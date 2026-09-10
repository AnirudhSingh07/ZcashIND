"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  checkPassword,
  createAdminSession,
  destroyAdminSession,
  isAdmin,
} from "@/lib/auth";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "").trim();
  if (!checkPassword(password)) {
    return { error: "Wrong password." };
  }
  await createAdminSession();
  redirect("/admin");
}

export async function logoutAction() {
  await destroyAdminSession();
  redirect("/admin/login");
}

async function assertAdmin() {
  if (!(await isAdmin())) throw new Error("Not authorised");
}

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/map");
  revalidatePath("/bounties/irl");
  revalidatePath("/admin");
  revalidatePath("/admin/submissions");
}

/** Verify a submission: assign next node number for its city + flag new city. */
export async function verifyMeetup(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  const meetup = await prisma.meetup.findUnique({ where: { id } });
  if (!meetup) return;

  // Any prior verified meetup in this city (any kind)?
  const priorVerified = await prisma.meetup.count({
    where: { city: meetup.city, status: "verified", id: { not: id } },
  });

  // Next node number among verified IRL meetups in this city.
  const lastNode = await prisma.meetup.aggregate({
    where: { city: meetup.city, status: "verified", kind: "irl_bounty" },
    _max: { nodeNumber: true },
  });
  const nextNode =
    meetup.kind === "irl_bounty" ? (lastNode._max.nodeNumber ?? 0) + 1 : meetup.nodeNumber;

  await prisma.meetup.update({
    where: { id },
    data: {
      status: "verified",
      verifiedAt: new Date(),
      nodeNumber: nextNode,
      // If this is the first verified meetup in the city, it's a new-city activation.
      newCityActivation: priorVerified === 0 ? true : meetup.newCityActivation,
      rejectionReason: null,
    },
  });
  revalidateAll();
  redirect("/admin/submissions");
}

export async function needsInfoMeetup(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  const note = String(formData.get("adminNotes") ?? "");
  await prisma.meetup.update({
    where: { id },
    data: { status: "needs_info", adminNotes: note || undefined },
  });
  revalidateAll();
  redirect("/admin/submissions");
}

export async function rejectMeetup(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  const reason = String(formData.get("rejectionReason") ?? "");
  await prisma.meetup.update({
    where: { id },
    data: { status: "rejected", rejectionReason: reason || "Did not meet the bar." },
  });
  revalidateAll();
  redirect("/admin/submissions");
}

export async function disqualifyMeetup(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  const reason = String(formData.get("rejectionReason") ?? "");
  await prisma.meetup.update({
    where: { id },
    data: {
      status: "disqualified",
      rejectionReason: reason || "Disqualified (rules violation).",
    },
  });
  revalidateAll();
  redirect("/admin/submissions");
}

/** Edit an official event's core fields. */
export async function updateEvent(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  const title = String(formData.get("title") ?? "");
  const city = String(formData.get("city") ?? "");
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("startTime") ?? "");
  const registrationUrl = String(formData.get("registrationUrl") ?? "");
  const description = String(formData.get("description") ?? "");

  const data: Record<string, unknown> = {
    title,
    city,
    registrationUrl: registrationUrl || null,
    description: description || null,
  };
  if (date && time) {
    data.startsAt = new Date(`${date}T${time}:00+05:30`);
  }

  await prisma.meetup.update({ where: { id }, data });
  revalidatePath("/events");
  revalidatePath("/admin/events");
  redirect("/admin/events");
}

// ---------------------------------------------------------------------------
// Featured posts (spotlighted @ZcashIND posts, shown on / and /events)
// ---------------------------------------------------------------------------

function revalidateFeatured() {
  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/admin/featured");
}

/** Add a featured post. Validates that the URL is an X/Twitter status link. */
export async function addFeaturedPost(formData: FormData) {
  await assertAdmin();
  const url = String(formData.get("url") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();

  const isStatusUrl = /^https?:\/\/(x|twitter)\.com\/[^/]+\/status\/\d+/i.test(url);
  if (!isStatusUrl || !title) {
    redirect("/admin/featured?error=invalid");
  }

  // Duplicate? Skip silently (url is unique in the schema).
  const existing = await prisma.featuredPost.findUnique({ where: { url } });
  if (existing) {
    redirect("/admin/featured?error=duplicate");
  }

  const last = await prisma.featuredPost.aggregate({ _max: { sortOrder: true } });
  await prisma.featuredPost.create({
    data: {
      url,
      title,
      subtitle: subtitle || null,
      sortOrder: (last._max.sortOrder ?? 0) + 1,
    },
  });
  revalidateFeatured();
  redirect("/admin/featured?added=1");
}

/** Edit a featured post's title/subtitle. */
export async function updateFeaturedPost(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  const title = String(formData.get("title") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  if (!title) redirect("/admin/featured?error=invalid");

  await prisma.featuredPost.update({
    where: { id },
    data: { title, subtitle: subtitle || null },
  });
  revalidateFeatured();
  redirect("/admin/featured?saved=1");
}

/** Delete a featured post. */
export async function deleteFeaturedPost(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  await prisma.featuredPost.delete({ where: { id } }).catch(() => {});
  revalidateFeatured();
  redirect("/admin/featured");
}

/** Move a featured post up or down by swapping sortOrder with its neighbour. */
export async function moveFeaturedPost(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  const dir = String(formData.get("dir")); // "up" | "down"

  const current = await prisma.featuredPost.findUnique({ where: { id } });
  if (!current) redirect("/admin/featured");

  const neighbour = await prisma.featuredPost.findFirst({
    where:
      dir === "up"
        ? { sortOrder: { lt: current.sortOrder } }
        : { sortOrder: { gt: current.sortOrder } },
    orderBy: { sortOrder: dir === "up" ? "desc" : "asc" },
  });
  if (!neighbour) redirect("/admin/featured"); // already at the edge

  await prisma.$transaction([
    prisma.featuredPost.update({
      where: { id: current.id },
      data: { sortOrder: neighbour.sortOrder },
    }),
    prisma.featuredPost.update({
      where: { id: neighbour.id },
      data: { sortOrder: current.sortOrder },
    }),
  ]);
  revalidateFeatured();
  redirect("/admin/featured");
}

// ---------------------------------------------------------------------------
// Updates ("What's New" feed, built from X links)
// ---------------------------------------------------------------------------

function revalidateUpdates() {
  revalidatePath("/");
  revalidatePath("/updates");
  revalidatePath("/admin/updates");
}

export async function addUpdate(formData: FormData) {
  await assertAdmin();
  const xUrl = String(formData.get("xUrl") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const tag = String(formData.get("tag") ?? "").trim();
  const pinned = formData.get("pinned") === "on";

  // An X link is the usual source; but allow a text-only update too.
  const isX = !xUrl || /^https?:\/\/(x|twitter)\.com\/[^/]+\/status\/\d+/i.test(xUrl);
  if (!isX || (!xUrl && !title && !body)) {
    redirect("/admin/updates?error=invalid");
  }

  await prisma.update.create({
    data: {
      xUrl: xUrl || null,
      title: title || null,
      body: body || null,
      tag: tag || null,
      pinned,
    },
  });
  revalidateUpdates();
  redirect("/admin/updates?added=1");
}

export async function updateUpdate(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  const xUrl = String(formData.get("xUrl") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const tag = String(formData.get("tag") ?? "").trim();
  const pinned = formData.get("pinned") === "on";

  const isX = !xUrl || /^https?:\/\/(x|twitter)\.com\/[^/]+\/status\/\d+/i.test(xUrl);
  if (!isX) redirect("/admin/updates?error=invalid");

  await prisma.update.update({
    where: { id },
    data: {
      xUrl: xUrl || null,
      title: title || null,
      body: body || null,
      tag: tag || null,
      pinned,
    },
  });
  revalidateUpdates();
  redirect("/admin/updates?saved=1");
}

export async function deleteUpdate(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  await prisma.update.delete({ where: { id } }).catch(() => {});
  revalidateUpdates();
  redirect("/admin/updates");
}

// ---------------------------------------------------------------------------
// Bounty (the /bounties/irl page: prizes, judging, minimums, window)
// ---------------------------------------------------------------------------

function revalidateBounty() {
  revalidatePath("/bounties/irl");
  revalidatePath("/bounties/irl/submit");
  revalidatePath("/admin/bounty");
}

/** Parse "place | amount | note" lines into a prizes JSON array. */
function parsePrizes(raw: string): string {
  const prizes = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [place = "", amount = "", ...noteParts] = line.split("|").map((s) => s.trim());
      return { place, amountUsd: Number(amount) || 0, note: noteParts.join(" | ") };
    })
    .filter((p) => p.place);
  return JSON.stringify(prizes);
}

/** Parse "label | weight" lines into a judging JSON array. */
function parseJudging(raw: string): string {
  const judging = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [label = "", weight = ""] = line.split("|").map((s) => s.trim());
      return { label, weight: Number(weight) || 0 };
    })
    .filter((j) => j.label);
  return JSON.stringify(judging);
}

/** Create or update a bounty (keyed by period). If `active`, deactivates others. */
export async function saveBounty(formData: FormData) {
  await assertAdmin();
  const period = String(formData.get("period") ?? "").trim();
  const windowLabel = String(formData.get("windowLabel") ?? "").trim();
  if (!period || !windowLabel) redirect("/admin/bounty?error=invalid");

  const data = {
    windowLabel,
    prizePoolUsd: Number(formData.get("prizePoolUsd")) || 0,
    prizes: parsePrizes(String(formData.get("prizes") ?? "")),
    minAttendees: Number(formData.get("minAttendees")) || 0,
    minNewToZcash: Number(formData.get("minNewToZcash")) || 0,
    minMinutes: Number(formData.get("minMinutes")) || 0,
    minPhotos: Number(formData.get("minPhotos")) || 0,
    judging: parseJudging(String(formData.get("judging") ?? "")),
    active: formData.get("active") === "on",
  };

  const saved = await prisma.bounty.upsert({
    where: { period },
    create: { period, ...data },
    update: data,
  });

  // Only one active at a time.
  if (data.active) {
    await prisma.bounty.updateMany({
      where: { id: { not: saved.id } },
      data: { active: false },
    });
  }
  revalidateBounty();
  redirect("/admin/bounty?saved=1");
}

/** Make a bounty the active one (deactivates the rest). */
export async function activateBounty(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  await prisma.$transaction([
    prisma.bounty.updateMany({ data: { active: false } }),
    prisma.bounty.update({ where: { id }, data: { active: true } }),
  ]);
  revalidateBounty();
  redirect("/admin/bounty");
}

export async function deleteBounty(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  await prisma.bounty.delete({ where: { id } }).catch(() => {});
  revalidateBounty();
  redirect("/admin/bounty");
}

// ---------------------------------------------------------------------------
// Luma events (the /events list + homepage recent events + map cities)
// ---------------------------------------------------------------------------

function revalidateLuma() {
  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/map");
  revalidatePath("/map/[city]", "page");
  revalidatePath("/admin/luma");
}

/** Parse the shared Luma-event form fields into a Prisma data object. */
function lumaFields(formData: FormData) {
  const slug = String(formData.get("slug") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const time = String(formData.get("startTime") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const series = String(formData.get("series") ?? "irl").trim();
  const venue = String(formData.get("venue") ?? "").trim();
  const coHosts = String(formData.get("coHosts") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const latRaw = String(formData.get("lat") ?? "").trim();
  const lngRaw = String(formData.get("lng") ?? "").trim();
  const isOnline = formData.get("isOnline") === "on";

  return {
    slug,
    title,
    date,
    time,
    valid: Boolean(slug && title && date && time && city),
    data: {
      slug,
      title,
      startsAt: date && time ? new Date(`${date}T${time}:00+05:30`) : undefined,
      city,
      series: ["live", "dev", "irl"].includes(series) ? series : "irl",
      venue: venue || null,
      coHosts: coHosts || null,
      state: state || null,
      lat: latRaw ? Number(latRaw) : null,
      lng: lngRaw ? Number(lngRaw) : null,
      isOnline,
    },
  };
}

export async function addLumaEvent(formData: FormData) {
  await assertAdmin();
  const f = lumaFields(formData);
  if (!f.valid) redirect("/admin/luma?error=invalid");

  const existing = await prisma.lumaEvent.findUnique({ where: { slug: f.slug } });
  if (existing) redirect("/admin/luma?error=duplicate");

  await prisma.lumaEvent.create({
    data: { ...f.data, startsAt: f.data.startsAt! },
  });
  revalidateLuma();
  redirect("/admin/luma?added=1");
}

export async function updateLumaEvent(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  const f = lumaFields(formData);
  if (!f.valid) redirect("/admin/luma?error=invalid");

  // Guard against a slug clash with a different row.
  const clash = await prisma.lumaEvent.findUnique({ where: { slug: f.slug } });
  if (clash && clash.id !== id) redirect("/admin/luma?error=duplicate");

  await prisma.lumaEvent.update({
    where: { id },
    data: { ...f.data, startsAt: f.data.startsAt! },
  });
  revalidateLuma();
  redirect("/admin/luma?saved=1");
}

export async function deleteLumaEvent(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  await prisma.lumaEvent.delete({ where: { id } }).catch(() => {});
  revalidateLuma();
  redirect("/admin/luma");
}

// ---------------------------------------------------------------------------
// Aftermovies (event recap videos shown in the grid on /events)
// ---------------------------------------------------------------------------

function revalidateAftermovies() {
  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/admin/aftermovies");
  revalidatePath("/map/[city]", "page"); // all city pages show their aftermovies
}

/**
 * Add an aftermovie. Source is one of: an uploaded video file, a URL (X post,
 * YouTube, Vimeo, or a direct mp4), or a raw embed snippet.
 */
export async function addAftermovie(formData: FormData) {
  await assertAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const event = String(formData.get("event") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const urlInput = String(formData.get("url") ?? "").trim();
  const embed = String(formData.get("embed") ?? "").trim();
  const file = formData.get("file");

  // Prefer an uploaded file, else the pasted URL.
  const { saveVideo } = await import("@/lib/uploads");
  const uploaded = file instanceof File ? await saveVideo(file) : null;
  const url = uploaded ?? urlInput;

  if (!title || !event || (!url && !embed)) {
    redirect("/admin/aftermovies?error=invalid");
  }

  const last = await prisma.aftermovie.aggregate({ _max: { sortOrder: true } });
  await prisma.aftermovie.create({
    data: {
      title,
      event,
      city: city || null,
      url: url || null,
      embed: embed || null,
      sortOrder: (last._max.sortOrder ?? 0) + 1,
    },
  });
  revalidateAftermovies();
  redirect("/admin/aftermovies?added=1");
}

/** Edit an aftermovie's title/event label. */
export async function updateAftermovie(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  const title = String(formData.get("title") ?? "").trim();
  const event = String(formData.get("event") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  if (!title || !event) redirect("/admin/aftermovies?error=invalid");

  await prisma.aftermovie.update({
    where: { id },
    data: { title, event, city: city || null },
  });
  revalidateAftermovies();
  redirect("/admin/aftermovies?saved=1");
}

/** Delete an aftermovie. */
export async function deleteAftermovie(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  await prisma.aftermovie.delete({ where: { id } }).catch(() => {});
  revalidateAftermovies();
  redirect("/admin/aftermovies");
}

/** Move an aftermovie up or down by swapping sortOrder with its neighbour. */
export async function moveAftermovie(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  const dir = String(formData.get("dir")); // "up" | "down"

  const current = await prisma.aftermovie.findUnique({ where: { id } });
  if (!current) redirect("/admin/aftermovies");

  const neighbour = await prisma.aftermovie.findFirst({
    where:
      dir === "up"
        ? { sortOrder: { lt: current.sortOrder } }
        : { sortOrder: { gt: current.sortOrder } },
    orderBy: { sortOrder: dir === "up" ? "desc" : "asc" },
  });
  if (!neighbour) redirect("/admin/aftermovies");

  await prisma.$transaction([
    prisma.aftermovie.update({
      where: { id: current.id },
      data: { sortOrder: neighbour.sortOrder },
    }),
    prisma.aftermovie.update({
      where: { id: neighbour.id },
      data: { sortOrder: current.sortOrder },
    }),
  ]);
  revalidateAftermovies();
  redirect("/admin/aftermovies");
}

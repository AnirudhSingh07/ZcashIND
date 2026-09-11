"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { saveUploads } from "@/lib/uploads";
import { submitSchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";
import { getBounty } from "@/lib/data";

// TODO: Add rate limiting and/or CAPTCHA before production launch.
// Currently no protection against spam submissions.

export type SubmitState = {
  ok: boolean;
  errors?: Record<string, string>;
  message?: string;
  values?: Record<string, string>;
};

function istDate(dateStr: string, timeStr: string): Date {
  // Combine yyyy-mm-dd + HH:mm as IST (+05:30)
  return new Date(`${dateStr}T${timeStr}:00+05:30`);
}

export async function submitMeetup(
  _prev: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  // 1) Collect the photo files but do NOT write them yet. Validation runs on
  //    placeholder paths first so a failed submission leaves no orphan files.
  const files = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);
  const photoPlaceholders = files.map((_, i) => `pending-${i}`);

  // 2) Collect fields
  const raw: Record<string, unknown> = {
    hostNamePublic: formData.get("hostNamePublic"),
    hostContactPrivate: formData.get("hostContactPrivate"),
    city: formData.get("city"),
    state: formData.get("state") ?? "",
    newCity: formData.get("newCity") === "on",
    venueType: formData.get("venueType"),
    venueName: formData.get("venueName") ?? "",
    isOnline: formData.get("isOnline") === "on",
    lat: formData.get("lat"),
    lng: formData.get("lng"),
    address: formData.get("address") ?? "",
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    durationMinutes: formData.get("durationMinutes"),
    format: formData.get("format"),
    title: formData.get("title"),
    summary: formData.get("summary"),
    attendeesTotal: formData.get("attendeesTotal"),
    attendeesNewToZcash: formData.get("attendeesNewToZcash"),
    photos: photoPlaceholders,
    brandingVisible: formData.get("brandingVisible") === "on",
    registrationUrl: formData.get("registrationUrl") ?? "",
    language: formData.get("language") ?? "",
    confirmInWindow: formData.get("confirmInWindow"),
    confirmRealPhotos: formData.get("confirmRealPhotos"),
    confirmOnce: formData.get("confirmOnce"),
    confirmHonest: formData.get("confirmHonest"),
  };

  // Keep re-fill values (strings only) for error redisplay
  const values: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string") values[k] = v;
  }

  const parsed = submitSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!errors[key]) errors[key] = issue.message;
    }
    return {
      ok: false,
      errors,
      message: "Please fix the highlighted fields.",
      values,
    };
  }

  const d = parsed.data;

  // 3) Validation passed: now persist the photos to disk.
  const photoPaths = await saveUploads(files);
  if (photoPaths.length < photoPlaceholders.length) {
    return {
      ok: false,
      errors: {
        photos:
          "One or more photos could not be saved. Use JPG, PNG or WebP under 8 MB each.",
      },
      message: "Please fix the highlighted fields.",
      values,
    };
  }

  const bounty = await getBounty();
  const startsAt = istDate(d.date, d.startTime);
  const endsAt = new Date(startsAt.getTime() + d.durationMinutes * 60_000);

  const slug = slugify(
    `${d.city}-${d.title}-${startsAt.getTime().toString(36)}`,
  );

  await prisma.meetup.create({
    data: {
      slug,
      kind: "irl_bounty",
      status: "pending",
      title: d.title,
      city: d.city,
      state: d.state || null,
      country: "India",
      lat: d.lat,
      lng: d.lng,
      venueType: d.venueType,
      venueName: d.venueName || null,
      startsAt,
      endsAt,
      timezone: "Asia/Kolkata",
      durationMinutes: d.durationMinutes,
      isOnline: d.isOnline,
      language: d.language || null,
      format: d.format,
      summary: d.summary,
      description: d.summary,
      attendeesTotal: d.attendeesTotal,
      attendeesNewToZcash: d.attendeesNewToZcash,
      newCityActivation: d.newCity,
      registrationUrl: d.registrationUrl || null,
      photos: JSON.stringify(photoPaths),
      brandingVisible: d.brandingVisible,
      hostNamePublic: d.hostNamePublic,
      hostContactPrivate: d.hostContactPrivate,
      bountyPeriod: bounty.period,
    },
  });

  redirect("/bounties/irl/submit/thanks");
}

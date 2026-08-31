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
  const password = String(formData.get("password") ?? "");
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

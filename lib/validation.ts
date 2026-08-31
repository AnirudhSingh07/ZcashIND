import { z } from "zod";

export const VENUE_TYPES = [
  "college",
  "cafe",
  "hostel",
  "coworking",
  "office",
  "public",
  "online",
  "other",
] as const;

export const FORMATS = [
  "privacy_talk",
  "zcash_intro",
  "ironwood",
  "quiz",
  "dev",
  "chai_privacy",
  "college_discussion",
  "live_stream",
  "workshop",
  "other",
] as const;

export const FORMAT_LABELS: Record<string, string> = {
  privacy_talk: "Privacy talk",
  zcash_intro: "Zcash intro",
  ironwood: "Ironwood",
  quiz: "Quiz / game",
  dev: "Dev session",
  chai_privacy: "Chai & privacy",
  college_discussion: "College discussion",
  live_stream: "Live stream",
  workshop: "Workshop",
  other: "Other",
};

export const VENUE_LABELS: Record<string, string> = {
  college: "College",
  cafe: "Café",
  hostel: "Hostel / home",
  coworking: "Coworking",
  office: "Office",
  public: "Public space",
  online: "Online",
  other: "Other",
};

// The submit form schema (server-validated).
export const submitSchema = z
  .object({
    hostNamePublic: z.string().min(2, "Please add a public host name").max(80),
    hostContactPrivate: z
      .string()
      .min(3, "Add a private contact (Telegram, X or email)")
      .max(140),
    city: z.string().min(2, "City is required").max(80),
    state: z.string().max(80).optional().or(z.literal("")),
    newCity: z.coerce.boolean().optional().default(false),
    venueType: z.enum(VENUE_TYPES),
    venueName: z.string().max(120).optional().or(z.literal("")),
    isOnline: z.coerce.boolean().optional().default(false),
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
    address: z.string().max(200).optional().or(z.literal("")),
    date: z.string().min(4, "Date is required"), // yyyy-mm-dd
    startTime: z.string().min(3, "Start time is required"), // HH:mm
    durationMinutes: z.coerce
      .number()
      .int()
      .min(20, "Meetups must be at least 20 minutes"),
    format: z.enum(FORMATS),
    title: z.string().min(4, "Give your meetup a title").max(120),
    summary: z
      .string()
      .min(20, "Tell us what you actually discussed (min 20 chars)")
      .max(2000),
    attendeesTotal: z.coerce
      .number()
      .int()
      .min(4, "Minimum 4 attendees to qualify"),
    attendeesNewToZcash: z.coerce
      .number()
      .int()
      .min(2, "Minimum 2 people new to Zcash"),
    photos: z
      .array(z.string())
      .min(3, "At least 3 photos required (1 must be a group photo)")
      .max(8, "Maximum 8 photos"),
    brandingVisible: z.coerce.boolean().optional().default(false),
    registrationUrl: z
      .string()
      .url("Must be a valid URL")
      .optional()
      .or(z.literal("")),
    language: z.string().max(40).optional().or(z.literal("")),
    // confirmations
    confirmInWindow: z.literal("on", {
      errorMap: () => ({ message: "Confirm it happened in the bounty window" }),
    }),
    confirmRealPhotos: z.literal("on", {
      errorMap: () => ({ message: "Confirm photos are real and not AI" }),
    }),
    confirmOnce: z.literal("on", {
      errorMap: () => ({ message: "Confirm you're submitting this once" }),
    }),
    confirmHonest: z.literal("on", {
      errorMap: () => ({
        message: "Confirm you understand fake attendance = disqualification",
      }),
    }),
  })
  .refine((d) => d.attendeesNewToZcash <= d.attendeesTotal, {
    message: "New-to-Zcash can't exceed total attendees",
    path: ["attendeesNewToZcash"],
  });

export type SubmitInput = z.infer<typeof submitSchema>;

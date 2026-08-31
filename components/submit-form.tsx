"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitMeetup, type SubmitState } from "@/app/actions/submit";
import { LocationPicker } from "@/components/map/location-picker";
import {
  VENUE_TYPES,
  FORMATS,
  VENUE_LABELS,
  FORMAT_LABELS,
} from "@/lib/validation";
import { site } from "@/config/site";

const initial: SubmitState = { ok: false };

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-sm text-danger">{msg}</p>;
}

function Label({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-text">
      {children}
      {required && <span className="text-gold"> *</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-text placeholder:text-muted/50 focus:border-gold";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-gold w-full px-6 py-3 disabled:opacity-60 sm:w-auto"
    >
      {pending ? "Submitting…" : "Submit for review"}
    </button>
  );
}

export function SubmitForm() {
  const [state, action] = useActionState(submitMeetup, initial);
  const e = state.errors ?? {};
  const v = state.values ?? {};
  const min = site.bounty.minimums;

  return (
    <form action={action} className="space-y-8">
      {state.message && (
        <div className="card border-danger/40 bg-danger/10 p-4 text-sm text-danger">
          {state.message}
        </div>
      )}

      {/* Host */}
      <fieldset className="card space-y-4 p-6">
        <legend className="px-1 text-lg font-semibold text-gold">You</legend>
        <div>
          <Label required>Public host name (shown on the map)</Label>
          <input
            name="hostNamePublic"
            defaultValue={v.hostNamePublic}
            className={inputCls}
            placeholder="e.g. Aditya from Indore"
          />
          <Err msg={e.hostNamePublic} />
        </div>
        <div>
          <Label required>Private contact (Telegram, X or email)</Label>
          <input
            name="hostContactPrivate"
            defaultValue={v.hostContactPrivate}
            className={inputCls}
            placeholder="@yourhandle or you@email.com"
          />
          <p className="mt-1 text-xs text-muted/60">
            Never shown publicly. Only our review team sees this.
          </p>
          <Err msg={e.hostContactPrivate} />
        </div>
      </fieldset>

      {/* Where */}
      <fieldset className="card space-y-4 p-6">
        <legend className="px-1 text-lg font-semibold text-gold">Where</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label required>City</Label>
            <input
              name="city"
              defaultValue={v.city}
              className={inputCls}
              placeholder="e.g. Indore"
            />
            <Err msg={e.city} />
          </div>
          <div>
            <Label>State</Label>
            <input
              name="state"
              defaultValue={v.state}
              className={inputCls}
              placeholder="e.g. Madhya Pradesh"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="newCity" className="h-4 w-4 accent-[#F4B728]" />
          This is the first-ever Zcash meetup in this city (new-city activation)
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label required>Venue type</Label>
            <select name="venueType" defaultValue={v.venueType || "cafe"} className={inputCls}>
              {VENUE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {VENUE_LABELS[t]}
                </option>
              ))}
            </select>
            <Err msg={e.venueType} />
          </div>
          <div>
            <Label>Venue name</Label>
            <input
              name="venueName"
              defaultValue={v.venueName}
              className={inputCls}
              placeholder="e.g. CG Road Chai House"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isOnline" className="h-4 w-4 accent-[#F4B728]" />
          This was an online meetup
        </label>

        <div>
          <Label required>Drop a pin</Label>
          <LocationPicker />
          <Err msg={e.lat || e.lng} />
        </div>
        <div>
          <Label>Address (optional)</Label>
          <input
            name="address"
            defaultValue={v.address}
            className={inputCls}
            placeholder="Rough address or landmark"
          />
        </div>
      </fieldset>

      {/* When */}
      <fieldset className="card space-y-4 p-6">
        <legend className="px-1 text-lg font-semibold text-gold">When</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label required>Date</Label>
            <input type="date" name="date" defaultValue={v.date} className={inputCls} />
            <Err msg={e.date} />
          </div>
          <div>
            <Label required>Start time (IST)</Label>
            <input type="time" name="startTime" defaultValue={v.startTime} className={inputCls} />
            <Err msg={e.startTime} />
          </div>
          <div>
            <Label required>Duration (min)</Label>
            <input
              type="number"
              name="durationMinutes"
              min={min.minutes}
              defaultValue={v.durationMinutes || min.minutes}
              className={inputCls}
            />
            <Err msg={e.durationMinutes} />
          </div>
        </div>
      </fieldset>

      {/* What */}
      <fieldset className="card space-y-4 p-6">
        <legend className="px-1 text-lg font-semibold text-gold">What happened</legend>
        <div>
          <Label required>Title</Label>
          <input
            name="title"
            defaultValue={v.title}
            className={inputCls}
            placeholder="e.g. Chai & Privacy — first meetup in Indore"
          />
          <Err msg={e.title} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label required>Format</Label>
            <select name="format" defaultValue={v.format || "chai_privacy"} className={inputCls}>
              {FORMATS.map((f) => (
                <option key={f} value={f}>
                  {FORMAT_LABELS[f]}
                </option>
              ))}
            </select>
            <Err msg={e.format} />
          </div>
          <div>
            <Label>Language</Label>
            <input
              name="language"
              defaultValue={v.language}
              className={inputCls}
              placeholder="e.g. Hindi / English"
            />
          </div>
        </div>
        <div>
          <Label required>What did you actually discuss?</Label>
          <textarea
            name="summary"
            defaultValue={v.summary}
            rows={4}
            className={inputCls}
            placeholder="Real talk — what came up, what clicked, what surprised people. Not a photo-op."
          />
          <Err msg={e.summary} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label required>Total attendees (min {min.attendees})</Label>
            <input
              type="number"
              name="attendeesTotal"
              min={min.attendees}
              defaultValue={v.attendeesTotal}
              className={inputCls}
            />
            <Err msg={e.attendeesTotal} />
          </div>
          <div>
            <Label required>New to Zcash (min {min.newToZcash})</Label>
            <input
              type="number"
              name="attendeesNewToZcash"
              min={min.newToZcash}
              defaultValue={v.attendeesNewToZcash}
              className={inputCls}
            />
            <Err msg={e.attendeesNewToZcash} />
          </div>
        </div>
        <div>
          <Label required>Photos ({min.photos}–8, one must be a group photo)</Label>
          <input
            type="file"
            name="photos"
            multiple
            accept="image/*"
            className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-gold file:px-4 file:py-2 file:font-medium file:text-bg"
          />
          <p className="mt-1 text-xs text-muted/60">
            Real photos only. AI-generated or manipulated images are disqualified.
          </p>
          <Err msg={e.photos} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="brandingVisible" className="h-4 w-4 accent-[#F4B728]" />
          Zcash / Zcash India branding is visible in at least one photo
        </label>
        <div>
          <Label>Registration / Telegram link (optional)</Label>
          <input
            name="registrationUrl"
            defaultValue={v.registrationUrl}
            className={inputCls}
            placeholder="https://…"
          />
          <Err msg={e.registrationUrl} />
        </div>
      </fieldset>

      {/* Confirmations */}
      <fieldset className="card space-y-3 p-6">
        <legend className="px-1 text-lg font-semibold text-gold">Confirm</legend>
        {[
          ["confirmInWindow", `This meetup happened during the bounty window (${site.bounty.period}).`, e.confirmInWindow],
          ["confirmRealPhotos", "The photos are real and not AI-generated or manipulated.", e.confirmRealPhotos],
          ["confirmOnce", "I am submitting this meetup only once.", e.confirmOnce],
          ["confirmHonest", "I understand fake or inflated attendance means disqualification.", e.confirmHonest],
        ].map(([name, label, err]) => (
          <div key={name as string}>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                name={name as string}
                className="mt-0.5 h-4 w-4 accent-[#F4B728]"
              />
              <span>{label}</span>
            </label>
            <Err msg={err as string} />
          </div>
        ))}
      </fieldset>

      <SubmitButton />
    </form>
  );
}

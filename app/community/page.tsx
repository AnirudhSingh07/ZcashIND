import type { Metadata } from "next";
import { site } from "@/config/site";
import { Container, Section, Badge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Community",
  description: "Where the Zcash India community lives online.",
};

const CHANNELS = [
  {
    label: "Telegram",
    href: site.links.telegram,
    desc: "The main hub. Ask questions, find meetups, meet hosts. Start here.",
    emoji: "💬",
  },
  {
    label: "X (Twitter)",
    href: site.links.x,
    desc: "Announcements, recaps and event highlights.",
    emoji: "𝕏",
  },
  {
    label: "Instagram",
    href: site.links.instagram,
    desc: "Photos from meetups and city activations.",
    emoji: "📸",
  },
  {
    label: "Forum",
    href: site.links.forum,
    desc: "Longer discussion, planning and the Zcash India 2026 thread.",
    emoji: "🗣️",
  },
  {
    label: "Luma",
    href: site.links.luma,
    desc: "RSVP to upcoming official events.",
    emoji: "🎟️",
  },
];

export default function CommunityPage() {
  return (
    <Section>
      <Container className="max-w-3xl">
        <Badge tone="gold" className="mb-4">
          Community
        </Badge>
        <h1 className="text-4xl font-bold sm:text-5xl">Come say hi</h1>
        <p className="mt-4 text-lg text-muted">
          No question is too basic. {site.voice.hcc}
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {CHANNELS.map((c) => (
            <a
              key={c.label}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className="card group flex items-start gap-4 p-6 transition-colors hover:border-gold/50"
            >
              <span className="text-2xl">{c.emoji}</span>
              <div>
                <h2 className="font-semibold group-hover:text-gold">
                  {c.label} ↗
                </h2>
                <p className="mt-1 text-sm text-muted">{c.desc}</p>
              </div>
            </a>
          ))}
        </div>

        <p className="mt-8 text-sm text-muted/70">
          Safety note: we will never DM you first asking for money or your seed
          phrase. Anyone who does is not us.
        </p>
      </Container>
    </Section>
  );
}

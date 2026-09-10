"use client";

import { useState } from "react";
import type { YouTubeVideo } from "@/lib/youtube";

/** One video: thumbnail with a play button that swaps to an inline player. */
function VideoCard({ v }: { v: YouTubeVideo }) {
  const [playing, setPlaying] = useState(false);

  return (
    <figure className="card self-start overflow-hidden">
      <div className="relative aspect-video w-full bg-black">
        {playing ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1`}
            title={v.title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <button
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 h-full w-full"
            aria-label={`Play: ${v.title}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={v.thumbnail}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/60 text-2xl text-white backdrop-blur transition-colors group-hover:bg-gold group-hover:text-bg">
                ▶
              </span>
            </span>
          </button>
        )}
      </div>
      <figcaption className="p-4">
        <a
          href={v.url}
          target="_blank"
          rel="noopener noreferrer"
          className="line-clamp-2 font-medium hover:text-gold"
        >
          {v.title}
        </a>
      </figcaption>
    </figure>
  );
}

export function YouTubeVideos({ videos }: { videos: YouTubeVideo[] }) {
  if (videos.length === 0) return null;
  return (
    <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {videos.map((v) => (
        <VideoCard key={v.id} v={v} />
      ))}
    </div>
  );
}

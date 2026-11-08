// @ts-nocheck
"use client";
import { useEffect, useRef, useState } from "react";

// Click-to-play YouTube embed. Until clicked it is only a thumbnail, so
// YouTube's player scripts and cookies load for viewers who actually watch.
// The player itself uses youtube-nocookie.com (YouTube's privacy mode).
export function YouTubeEmbed({ id, title, start = 0 }: { id: string; title: string; start?: number }) {
  const [playing, setPlaying] = useState(false);
  // The facade button is replaced by the player; move focus into it so
  // keyboard users are not dropped back at the top of the page.
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    if (playing) frame.current?.focus();
  }, [playing]);

  if (playing) {
    return (
      <div className="yt">
        <iframe
          ref={frame}
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0${start ? `&start=${start}` : ""}`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button type="button" className="yt yt-facade" onClick={() => setPlaying(true)} aria-label={`Play video: ${title}`}>
      <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" />
      <span className="yt-play" aria-hidden="true">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
      </span>
    </button>
  );
}

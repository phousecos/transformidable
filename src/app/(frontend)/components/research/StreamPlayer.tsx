// @ts-nocheck
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { clock } from "../../../../lib/podcast";

// Episode video player for Cloudflare Stream (HLS). Safari plays HLS itself;
// other browsers load hls.js, only once someone presses play. Controls live in
// their own bar under the picture so nothing covers the video on a phone.
//
// <SeekLink> elsewhere on the page dispatches "episode:seek" to jump here.

const SPEEDS = [1, 1.25, 1.5, 1.75, 2, 0.75];


const Icon = {
  play: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" fill="currentColor" /></svg>,
  pause: <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor" /><rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor" /></svg>,
  back: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7" /><path d="M4 3.5V8h4.5" /><text x="12" y="15.2" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="currentColor" stroke="none">15</text></svg>,
  fwd: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.4-5.7" /><path d="M20 3.5V8h-4.5" /><text x="12" y="15.2" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="currentColor" stroke="none">30</text></svg>,
  vol: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" /><path d="M16.5 8.5a5 5 0 0 1 0 7" /></svg>,
  muted: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" /><path d="M17 9.5l5 5M22 9.5l-5 5" /></svg>,
  pip: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><rect x="12" y="11.5" width="6.5" height="5" rx="1" fill="currentColor" /></svg>,
  full: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>,
  exitFull: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /></svg>,
};

function captionTracks(video: HTMLVideoElement | null) {
  return video ? Array.from(video.textTracks).filter((t) => t.kind === "subtitles" || t.kind === "captions") : [];
}

export function StreamPlayer({
  src,
  poster,
  title,
  chapters = [],
  duration: knownDuration = 0,
  startAt = 0,
  collapsible = false,
}: {
  src: string;
  poster?: string;
  title: string;
  chapters?: { title: string; start: number }[];
  duration?: number;
  startAt?: number;
  collapsible?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const hls = useRef<any>(null);
  const attached = useRef<Promise<void> | null>(null);
  // A jump asked for while the player is still a closed card; run once the
  // <video> exists.
  const pending = useRef<number | null>(null);
  // The closed card's button disappears when the player opens; focus moves to
  // the play/pause button so keyboard focus isn't lost.
  const playBtn = useRef<HTMLButtonElement>(null);
  const focusOnOpen = useRef(false);

  const [open, setOpen] = useState(!collapsible);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(startAt);
  const [duration, setDuration] = useState(knownDuration);
  const [buffered, setBuffered] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [hasCaptions, setHasCaptions] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [canPip, setCanPip] = useState(false);
  const [failed, setFailed] = useState(false);

  // Load the stream into the <video>. Runs once, on first play or seek.
  const attach = useCallback(() => {
    if (attached.current) return attached.current;
    const v = video.current!;
    attached.current = (async () => {
      if (v.canPlayType("application/vnd.apple.mpegurl")) {
        v.src = src;
        return;
      }
      const Hls = (await import("hls.js")).default;
      if (!Hls.isSupported()) {
        v.src = src;
        return;
      }
      const h = new Hls({ capLevelToPlayerSize: true });
      h.on(Hls.Events.ERROR, (_e: unknown, data: any) => {
        if (data?.fatal) setFailed(true);
      });
      h.loadSource(src);
      h.attachMedia(v);
      hls.current = h;
    })();
    return attached.current;
  }, [src]);

  const seekTo = useCallback(
    async (seconds: number, andPlay = false) => {
      const v = video.current;
      if (!v) return;
      await attach();
      setStarted(true);
      const go = () => {
        v.currentTime = Math.max(0, seconds);
        if (andPlay) v.play().catch(() => {});
      };
      if (v.readyState >= 1) go();
      else v.addEventListener("loadedmetadata", go, { once: true });
      setTime(seconds);
    },
    [attach],
  );

  const jump = useCallback(
    (seconds: number) => {
      if (video.current) return seekTo(seconds, true);
      pending.current = seconds;
      setOpen(true);
    },
    [seekTo],
  );

  useEffect(() => {
    if (open && focusOnOpen.current) {
      focusOnOpen.current = false;
      playBtn.current?.focus();
    }
    if (open && pending.current !== null && video.current) {
      seekTo(pending.current, true);
      pending.current = null;
    }
  }, [open, seekTo]);

  const toggle = useCallback(async () => {
    const v = video.current;
    if (!v) return;
    if (!started) return seekTo(time, true);
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }, [started, seekTo, time]);

  useEffect(() => {
    setCanPip(typeof document !== "undefined" && !!document.pictureInPictureEnabled);
    const onFs = () => setFullscreen(document.fullscreenElement === box.current);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      hls.current?.destroy();
    };
  }, []);

  // Jumps from "Discussed in the episode" and chapter links on the page.
  useEffect(() => {
    const onSeek = (e: CustomEvent) => {
      e.preventDefault();
      jump(Number(e.detail?.seconds) || 0);
      requestAnimationFrame(() => box.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
    };
    window.addEventListener("episode:seek", onSeek as EventListener);
    return () => window.removeEventListener("episode:seek", onSeek as EventListener);
  }, [jump]);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const tracks = v.textTracks;
    const sync = () => {
      setPlaying(!v.paused);
      setTime(v.currentTime);
      if (Number.isFinite(v.duration) && v.duration > 0) setDuration(v.duration);
      setBuffered(v.buffered.length ? v.buffered.end(v.buffered.length - 1) : 0);
      setMuted(v.muted);
      setVolume(v.volume);
      setSpeed(v.playbackRate);
    };
    const onTracks = () => {
      const list = captionTracks(v);
      setHasCaptions(list.length > 0);
      setCaptionsOn(list.some((t) => t.mode === "showing"));
    };
    const events = ["play", "pause", "timeupdate", "durationchange", "progress", "volumechange", "ratechange", "seeked"];
    events.forEach((ev) => v.addEventListener(ev, sync));
    tracks.addEventListener("addtrack", onTracks);
    tracks.addEventListener("change", onTracks);
    return () => {
      events.forEach((ev) => v.removeEventListener(ev, sync));
      tracks.removeEventListener("addtrack", onTracks);
      tracks.removeEventListener("change", onTracks);
    };
  }, [open]);

  const skip = (delta: number) => seekTo(Math.min(duration || Infinity, Math.max(0, time + delta)), playing);

  const toggleCaptions = () => {
    const list = captionTracks(video.current);
    const on = !captionsOn;
    list.forEach((t, i) => (t.mode = on && i === 0 ? "showing" : "disabled"));
    setCaptionsOn(on);
  };

  const cycleSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    if (video.current) video.current.playbackRate = next;
    setSpeed(next);
  };

  const toggleFullscreen = () => {
    const v = video.current as any;
    if (document.fullscreenElement) document.exitFullscreen();
    else if (box.current?.requestFullscreen) box.current.requestFullscreen();
    else v?.webkitEnterFullscreen?.(); // iPhone
  };

  const togglePip = () => {
    if (document.pictureInPictureElement) document.exitPictureInPicture();
    else video.current?.requestPictureInPicture().catch(() => {});
  };

  // Keyboard shortcuts while focus is inside the player (YouTube's keys).
  const onKeyDown = (e: React.KeyboardEvent) => {
    const onSlider = (e.target as HTMLElement).tagName === "INPUT";
    const keys: Record<string, () => void> = {
      k: toggle,
      j: () => skip(-15),
      l: () => skip(30),
      f: toggleFullscreen,
      m: () => video.current && (video.current.muted = !video.current.muted),
      ...(onSlider ? {} : { ArrowLeft: () => skip(-15), ArrowRight: () => skip(30) }),
    };
    const fn = keys[e.key];
    if (fn && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      fn();
    }
  };

  const current = chapters.reduce((found, c, i) => (c.start <= time + 0.5 ? i : found), -1);
  const pct = duration ? (time / duration) * 100 : 0;
  const buf = duration ? (buffered / duration) * 100 : 0;

  if (!open) {
    return (
      <div className="sp-card">
        <span className="sp-card-thumb">{poster && <img src={poster} alt="" loading="lazy" />}</span>
        <span className="sp-card-body">
          <span className="sp-card-t">{title}</span>
          <button
            type="button"
            className="sp-card-go"
            onClick={() => {
              focusOnOpen.current = true;
              jump(startAt);
            }}
            aria-label={`Watch: ${title}${knownDuration ? `, ${Math.round(knownDuration / 60)} minutes` : ""}`}
          >
            {Icon.play}
            Watch{knownDuration ? ` · ${Math.round(knownDuration / 60)} min` : ""}
          </button>
        </span>
      </div>
    );
  }

  return (
    <div className={`sp${fullscreen ? " sp--full" : ""}`} ref={box} onKeyDown={onKeyDown} role="region" aria-label={`Video player: ${title}`}>
      <div className="sp-head">
        <span>Video recording</span>
        {duration > 0 && <span>Runtime {clock(duration)}</span>}
      </div>
      <div className="sp-stage">
        <video
          ref={video}
          poster={poster}
          preload="none"
          playsInline
          crossOrigin="anonymous"
          onClick={toggle}
          aria-label={title}
        />
        {!started && (
          <button type="button" className="sp-big" onClick={toggle} aria-label={`Play: ${title}`}>{Icon.play}</button>
        )}
        {failed && <p className="sp-error" role="alert">The video couldn&rsquo;t load. Please refresh the page to try again.</p>}
      </div>
      <div className="sp-bar">
        <div className="sp-track">
          <span>{clock(time)}</span>
          <span className="sp-seek" style={{ "--pct": `${pct}%`, "--buf": `${Math.max(pct, buf)}%` } as React.CSSProperties}>
            <input
              type="range"
              min={0}
              max={Math.max(1, Math.floor(duration))}
              step={1}
              value={Math.floor(time)}
              onChange={(e) => seekTo(Number(e.target.value), playing)}
              aria-label="Seek"
              aria-valuetext={`${clock(time)} of ${clock(duration)}`}
            />
            {duration > 0 &&
              chapters.slice(1).map((c) => (
                <span key={c.start} className="sp-tick" aria-hidden="true" style={{ left: `${(c.start / duration) * 100}%` }} />
              ))}
          </span>
          <span>{clock(duration)}</span>
        </div>
        <div className="sp-row">
          <button ref={playBtn} type="button" className="sp-btn sp-play" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
            {playing ? Icon.pause : Icon.play}
          </button>
          <button type="button" className="sp-btn" onClick={() => skip(-15)} aria-label="Back 15 seconds">{Icon.back}</button>
          <button type="button" className="sp-btn" onClick={() => skip(30)} aria-label="Forward 30 seconds">{Icon.fwd}</button>
          <button
            type="button"
            className="sp-btn sp-mute"
            onClick={() => video.current && (video.current.muted = !muted)}
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted || volume === 0 ? Icon.muted : Icon.vol}
          </button>
          <input
            className="sp-vol"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={(e) => {
              const v = video.current;
              if (!v) return;
              v.volume = Number(e.target.value);
              v.muted = v.volume === 0;
            }}
            aria-label="Volume"
            aria-valuetext={muted ? "Muted" : `${Math.round(volume * 100)}%`}
          />
          {current >= 0 && (
            <span className="sp-chapter" aria-live="polite">
              Chapter {current + 1} of {chapters.length} · <em>{chapters[current].title}</em>
            </span>
          )}
          <span className="sp-spacer" />
          {hasCaptions && (
            <button type="button" className="sp-pill" onClick={toggleCaptions} aria-pressed={captionsOn} aria-label="Captions">CC</button>
          )}
          <button type="button" className="sp-pill" onClick={cycleSpeed} aria-label={`Playback speed: ${speed} times. Change speed`}>{speed}×</button>
          {canPip && (
            <button type="button" className="sp-btn sp-pipbtn" onClick={togglePip} aria-label="Picture in picture">{Icon.pip}</button>
          )}
          <button type="button" className="sp-btn" onClick={toggleFullscreen} aria-label={fullscreen ? "Exit full screen" : "Full screen"}>
            {fullscreen ? Icon.exitFull : Icon.full}
          </button>
        </div>
      </div>
    </div>
  );
}

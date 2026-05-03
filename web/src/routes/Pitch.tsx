import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api, demoFallback } from "../lib/api";
import { useKeyboard } from "../hooks/useKeyboard";
import type { Region, Savings } from "../lib/types";
import { slides, type SlideContext } from "../pitch/slides";

type Mode = "slide" | "overview" | "presenter";

export function Pitch() {
  const regionsQ = useQuery<Region[]>({ queryKey: ["regions"], queryFn: api.regions });
  const savingsQ = useQuery<Savings>({ queryKey: ["savings"], queryFn: api.savings });

  const isLive = regionsQ.isSuccess && savingsQ.isSuccess;
  const ctx: SlideContext = useMemo(
    () => ({
      regions: regionsQ.data ?? demoFallback.regions(),
      savings: savingsQ.data ?? demoFallback.savings(),
      isLive,
    }),
    [regionsQ.data, savingsQ.data, isLive],
  );

  const [index, setIndex] = useState<number>(() => {
    const fromHash = parseInt(window.location.hash.slice(1), 10);
    return Number.isFinite(fromHash) && fromHash >= 0 && fromHash < slides.length ? fromHash : 0;
  });
  const [mode, setMode] = useState<Mode>("slide");
  const [direction, setDirection] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode !== "overview") {
      window.location.hash = String(index);
    }
  }, [index, mode]);

  // hide app chrome while pitch is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const go = useCallback((delta: number) => {
    setDirection(delta > 0 ? 1 : -1);
    setIndex((i) => Math.min(slides.length - 1, Math.max(0, i + delta)));
  }, []);

  const goTo = useCallback((i: number, dir = 1) => {
    setDirection(dir);
    setIndex(Math.min(slides.length - 1, Math.max(0, i)));
    setMode("slide");
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {/* ignore */});
    } else {
      document.exitFullscreen?.().catch(() => {/* ignore */});
    }
  }, []);

  useKeyboard((e) => {
    // arrow keys, space, esc, f, p, home, end
    switch (e.key) {
      case "ArrowRight":
      case "PageDown":
      case " ":
        if (mode === "overview") return;
        e.preventDefault();
        go(1);
        break;
      case "ArrowLeft":
      case "PageUp":
        if (mode === "overview") return;
        e.preventDefault();
        go(-1);
        break;
      case "Home":
        e.preventDefault();
        goTo(0);
        break;
      case "End":
        e.preventDefault();
        goTo(slides.length - 1);
        break;
      case "Escape":
        e.preventDefault();
        setMode((m) => (m === "overview" ? "slide" : "overview"));
        break;
      case "f":
      case "F":
        e.preventDefault();
        toggleFullscreen();
        break;
      case "p":
      case "P":
        e.preventDefault();
        setMode((m) => (m === "presenter" ? "slide" : "presenter"));
        break;
    }
  }, [mode, go, goTo, toggleFullscreen]);

  const slide = slides[index];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-paper text-ink overflow-hidden"
      style={{ background: slide.background === "ink" ? "var(--ink)" : slide.background === "accent" ? "var(--accent)" : "var(--paper)" }}
    >
      <div className="absolute inset-0">
        {mode === "overview" ? (
          <Overview slides={slides} index={index} ctx={ctx} onPick={goTo} onClose={() => setMode("slide")} />
        ) : mode === "presenter" ? (
          <PresenterView
            current={slide}
            next={slides[index + 1]}
            ctx={ctx}
            index={index}
            total={slides.length}
            onExit={() => setMode("slide")}
            onAdvance={() => go(1)}
            onBack={() => go(-1)}
          />
        ) : (
          <SlideStage slide={slide} ctx={ctx} direction={direction} />
        )}
      </div>

      <ChromeBar
        index={index}
        total={slides.length}
        mode={mode}
        onPrev={() => go(-1)}
        onNext={() => go(1)}
        onOverview={() => setMode((m) => (m === "overview" ? "slide" : "overview"))}
        onPresenter={() => setMode((m) => (m === "presenter" ? "slide" : "presenter"))}
        onFullscreen={toggleFullscreen}
        slideTitle={slide.title}
      />
    </div>
  );
}

function SlideStage({
  slide,
  ctx,
  direction,
}: {
  slide: typeof slides[number];
  ctx: SlideContext;
  direction: number;
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <motion.div
          key={slide.id}
          custom={direction}
          variants={{
            enter: (d: number) => ({ opacity: 0, x: d * 40, filter: "blur(6px)" }),
            center: { opacity: 1, x: 0, filter: "blur(0px)" },
            exit: (d: number) => ({ opacity: 0, x: -d * 40, filter: "blur(6px)" }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <SlideCanvas slide={slide} ctx={ctx} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function SlideCanvas({ slide, ctx }: { slide: typeof slides[number]; ctx: SlideContext }) {
  // Reserve a safe area at the bottom so slide footer content (programme,
  // institution, etc.) is not occluded by the fixed control bar.
  return (
    <div className="absolute inset-0 pb-28 md:pb-32">
      <div className="w-full h-full">{slide.render(ctx)}</div>
    </div>
  );
}

function ChromeBar({
  index,
  total,
  mode,
  onPrev,
  onNext,
  onOverview,
  onPresenter,
  onFullscreen,
  slideTitle,
}: {
  index: number;
  total: number;
  mode: Mode;
  onPrev: () => void;
  onNext: () => void;
  onOverview: () => void;
  onPresenter: () => void;
  onFullscreen: () => void;
  slideTitle: string;
}) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="pointer-events-auto m-3 md:m-5 flex items-center gap-2 md:gap-3 rounded-full bg-paper-raised/80 backdrop-blur-md border border-ink-line px-3 py-2 mx-auto w-fit shadow-soft">
        <Link
          to="/"
          className="btn"
          aria-label="Exit pitch deck and return to dashboard"
          title="Exit pitch"
        >
          <span aria-hidden="true">↖</span>
          <span className="hidden sm:inline">Exit</span>
        </Link>
        <span className="hidden md:inline-block w-px h-5 bg-ink-line mx-1" />
        <button
          type="button"
          className="btn"
          onClick={onPrev}
          aria-label="Previous slide"
          disabled={index === 0}
        >
          <span aria-hidden="true">←</span>
        </button>
        <span
          className="font-mono text-xs text-ink-mute num-tabular px-2"
          aria-live="polite"
          aria-label={`Slide ${index + 1} of ${total}: ${slideTitle}`}
        >
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        <button
          type="button"
          className="btn"
          onClick={onNext}
          aria-label="Next slide"
          disabled={index === total - 1}
        >
          <span aria-hidden="true">→</span>
        </button>
        <span className="hidden md:inline-block w-px h-5 bg-ink-line mx-1" />
        <button
          type="button"
          className={`btn ${mode === "overview" ? "btn-primary" : ""}`}
          onClick={onOverview}
          aria-label="Toggle overview grid"
          aria-pressed={mode === "overview"}
        >
          <span aria-hidden="true">▦</span>
          <span className="hidden md:inline">Overview</span>
        </button>
        <button
          type="button"
          className={`btn ${mode === "presenter" ? "btn-primary" : ""}`}
          onClick={onPresenter}
          aria-label="Toggle presenter mode"
          aria-pressed={mode === "presenter"}
        >
          <span aria-hidden="true">◧</span>
          <span className="hidden md:inline">Presenter</span>
        </button>
        <button
          type="button"
          className="btn hidden md:inline-flex"
          onClick={onFullscreen}
          aria-label="Toggle fullscreen"
        >
          <span aria-hidden="true">⤢</span>
          <span>Fullscreen</span>
        </button>
      </div>
      <p className="text-center pb-2 text-xs text-ink-mute font-mono">
        ← → · Esc overview · F fullscreen · P presenter
      </p>
    </div>
  );
}

function Overview({
  slides,
  index,
  ctx,
  onPick,
  onClose,
}: {
  slides: typeof import("../pitch/slides").slides;
  index: number;
  ctx: SlideContext;
  onPick: (i: number, dir?: number) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 bg-paper-sunk overflow-y-auto scrollbar-quiet"
    >
      <header className="sticky top-0 z-10 backdrop-blur-md bg-paper-sunk/90 border-b border-ink-line">
        <div className="container-wide flex items-center justify-between py-3">
          <p className="label-eyebrow">overview · {slides.length} slides</p>
          <button type="button" className="btn" onClick={onClose} aria-label="Close overview">
            <span aria-hidden="true">✕</span> Close
          </button>
        </div>
      </header>
      <div className="container-wide py-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {slides.map((s, i) => (
          <button
            type="button"
            key={s.id}
            onClick={() => onPick(i, i > index ? 1 : -1)}
            className={`group relative aspect-video rounded-lg overflow-hidden border text-left transition-transform hover:-translate-y-0.5 ${
              i === index ? "border-accent ring-2 ring-accent" : "border-ink-line"
            }`}
            aria-current={i === index ? "true" : undefined}
            aria-label={`Slide ${i + 1}: ${s.title}`}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  s.background === "ink"
                    ? "var(--ink)"
                    : s.background === "accent"
                      ? "var(--accent)"
                      : "var(--paper-raised)",
              }}
            />
            <div className="absolute inset-0 origin-top-left scale-[0.22] w-[455%] h-[455%] pointer-events-none">
              {s.render(ctx)}
            </div>
            <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/60 to-transparent text-paper text-xs">
              <span className="font-mono mr-2 opacity-70">{String(i + 1).padStart(2, "0")}</span>
              {s.title}
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function PresenterView({
  current,
  next,
  ctx,
  index,
  total,
  onExit,
  onAdvance,
  onBack,
}: {
  current: typeof slides[number];
  next: typeof slides[number] | undefined;
  ctx: SlideContext;
  index: number;
  total: number;
  onExit: () => void;
  onAdvance: () => void;
  onBack: () => void;
}) {
  const startedAt = useRef(Date.now());
  const [elapsed, setElapsed] = useState("00:00");
  useEffect(() => {
    const t = window.setInterval(() => {
      const s = Math.floor((Date.now() - startedAt.current) / 1000);
      setElapsed(`${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`);
    }, 1000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div className="absolute inset-0 bg-paper-sunk grid grid-rows-[auto_1fr_auto] grid-cols-[2fr_1fr] gap-4 p-4 md:p-6 text-ink">
      <header className="col-span-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="pill" style={{ background: "var(--accent)", color: "var(--paper)", borderColor: "var(--accent)" }}>
            presenter
          </p>
          <p className="label-eyebrow">slide {index + 1} of {total}</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="font-mono text-sm num-tabular" aria-label="elapsed time">{elapsed}</p>
          <button type="button" className="btn" onClick={onExit}>Exit</button>
        </div>
      </header>

      <section className="rounded-lg border border-ink-line overflow-hidden bg-paper-raised relative" aria-label="Current slide">
        <div className="absolute inset-0">{current.render(ctx)}</div>
      </section>

      <aside className="rounded-lg border border-ink-line bg-paper-raised p-5 flex flex-col gap-4 overflow-hidden">
        <div>
          <p className="label-eyebrow">notes</p>
          <p className="mt-2 text-sm text-ink-soft text-pretty leading-relaxed">{current.notes}</p>
        </div>
        <div className="border-t border-ink-line pt-4">
          <p className="label-eyebrow">next up</p>
          {next ? (
            <>
              <p className="mt-2 font-display text-lg">{next.title}</p>
              <p className="text-xs text-ink-mute mt-1 line-clamp-3">{next.notes}</p>
              <div className="mt-3 aspect-video rounded border border-ink-line overflow-hidden relative">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      next.background === "ink"
                        ? "var(--ink)"
                        : next.background === "accent"
                          ? "var(--accent)"
                          : "var(--paper-raised)",
                  }}
                />
                <div className="absolute inset-0 origin-top-left scale-[0.28] w-[357%] h-[357%]">
                  {next.render(ctx)}
                </div>
              </div>
            </>
          ) : (
            <p className="mt-2 text-ink-mute text-sm">final slide.</p>
          )}
        </div>
      </aside>

      <footer className="col-span-2 flex items-center justify-between">
        <button type="button" className="btn" onClick={onBack} disabled={index === 0}>
          ← Previous
        </button>
        <p className="text-xs text-ink-mute font-mono">P toggles presenter · ← → moves slides</p>
        <button type="button" className="btn btn-primary" onClick={onAdvance} disabled={index === total - 1}>
          Next →
        </button>
      </footer>
    </div>
  );
}

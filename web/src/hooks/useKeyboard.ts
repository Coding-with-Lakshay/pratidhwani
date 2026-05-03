import { useEffect } from "react";

type KeyHandler = (e: KeyboardEvent) => void;

/**
 * Global keyboard listener. Skips events originating from form fields so the
 * pitch deck arrow keys don't fight with sliders / inputs.
 */
export function useKeyboard(handler: KeyHandler, deps: unknown[] = []) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t) {
        const tag = t.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          t.isContentEditable
        ) return;
      }
      handler(e);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

import { useEffect, useRef } from "react";

export function useDebouncedCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  delay = 250,
): (...args: A) => void {
  const ref = useRef(fn);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    ref.current = fn;
  }, [fn]);

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
  }, []);

  return (...args: A) => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => ref.current(...args), delay);
  };
}

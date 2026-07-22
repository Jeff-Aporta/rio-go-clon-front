import { useEffect, useRef, type RefCallback } from "react";

/**
 * Bind Shoelace events via callback ref (React 18 no soporta onsl-* bien).
 * Usa handlerRef para no re-bind en cada render.
 */
export function useSl(
  eventName: string,
  handler: ((ev: Event) => void) | undefined,
): RefCallback<HTMLElement | null> {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => () => cleanupRef.current?.(), []);

  return (el) => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    if (!el || !handler) return;
    const fn = (e: Event) => handlerRef.current?.(e);
    el.addEventListener(eventName, fn);
    cleanupRef.current = () => el.removeEventListener(eventName, fn);
  };
}

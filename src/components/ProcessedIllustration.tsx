"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { loadImageFromUrl } from "@/utils/backgroundRemoval"; // now ONLY using loader

const ORIGINAL = "/hero/woman1.png";

export default function ProcessedIllustration() {
  // Show the original instantly
  const [src, setSrc] = useState<string>(ORIGINAL);
  const didRun = useRef(false);

  // idle callback wrapper
  const idle = useMemo(
    () =>
      (cb: () => void) => {
        if ("requestIdleCallback" in window) {
          (window as any).requestIdleCallback(cb, { timeout: 1200 });
        } else {
          setTimeout(cb, 0);
        }
      },
    []
  );

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    // OPTIONAL: later you can re-enable real background removal here
    idle(async () => {
      try {
        // ensure the image loads (for future masking)
        await loadImageFromUrl(ORIGINAL);
        // Since we are *not* applying removeBackground now,
        // keep ORIGINAL as src — no flicker, no blue bg.
      } catch {
        // If it fails, just keep ORIGINAL silently
      }
    });
  }, [idle]);

  return (
    <div className="w-full max-w-md mx-auto lg:mx-0">
      <img
        src={src}
        alt="Intern management illustration"
        className="w-full h-auto object-contain rounded-lg transition-opacity duration-300"
      />
    </div>
  );
}
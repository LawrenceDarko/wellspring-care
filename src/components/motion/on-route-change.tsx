"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function PathnameEffect({ onChange }: { onChange: () => void }) {
  const pathname = usePathname();
  const latest = useRef(onChange);
  useEffect(() => {
    latest.current = onChange;
  });
  useEffect(() => {
    latest.current();
  }, [pathname]);
  return null;
}

/**
 * Calls `onChange` after mount and on every client route change. `usePathname` is runtime
 * data, so it lives in its own Suspense leaf and never blocks prerendering the surrounding page.
 */
export function OnRouteChange({ onChange }: { onChange: () => void }) {
  return (
    <Suspense fallback={null}>
      <PathnameEffect onChange={onChange} />
    </Suspense>
  );
}

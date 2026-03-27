"use client";

import type { ReactNode } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export function ScrollSection({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useScrollAnimation();
  return (
    <section id={id} ref={ref} className={className}>
      {children}
    </section>
  );
}

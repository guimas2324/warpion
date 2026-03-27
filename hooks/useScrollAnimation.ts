"use client";

import { useEffect, useRef } from "react";

export function useScrollAnimation<T extends HTMLDivElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    );

    root.querySelectorAll(".animate-on-scroll, .stagger-children").forEach((item) => {
      observer.observe(item);
    });

    return () => observer.disconnect();
  }, []);

  return ref;
}

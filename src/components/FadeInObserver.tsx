"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function FadeInObserver() {
  const pathname = usePathname();

  useEffect(() => {
    // Small delay to ensure DOM is ready after navigation
    const timer = setTimeout(() => {
      const elements = document.querySelectorAll(".fade-in:not(.visible)");
      if (elements.length === 0) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
              observer.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: "-40px",
        }
      );

      elements.forEach((el) => observer.observe(el));

      // Also make elements already in viewport visible immediately
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add("visible");
        }
      });

      return () => observer.disconnect();
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}

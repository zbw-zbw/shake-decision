"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Smartphone } from "lucide-react";
import { getUnratedCount } from "@/lib/storage";

const navLinks = [
  { href: "/", label: "首页" },
  { href: "/decide", label: "开始决策" },
  { href: "/history", label: "决策日记" },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [unratedCount, setUnratedCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Poll for unrated count every 2s
  useEffect(() => {
    const update = () => setUnratedCount(getUnratedCount());
    update();
    const id = setInterval(update, 2000);
    const handler = () => update();
    window.addEventListener("storage", handler);
    return () => {
      clearInterval(id);
      window.removeEventListener("storage", handler);
    };
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[rgba(15,11,26,0.85)] backdrop-blur-md">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white font-bold text-base cursor-pointer">
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">摇一摇决策器</span>
            <span className="sm:hidden">摇一摇</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors hover:text-white relative cursor-pointer ${
                  pathname === link.href
                    ? "text-white font-medium"
                    : "text-[rgba(255,255,255,0.7)]"
                }`}
              >
                {link.label}
                {link.href === "/history" && unratedCount > 0 && (
                  <span className="absolute -top-1.5 -right-3 w-2 h-2 bg-[#f472b6] rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-white p-2 cursor-pointer"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
              <rect
                x="0" y="0" width="20" height="1.5" rx="0.75"
                className="fill-white transition-transform duration-300"
                style={{ transform: menuOpen ? "rotate(45deg) translate(3.5px, 5px)" : "none" }}
              />
              <rect
                x="0" y="6" width="20" height="1.5" rx="0.75"
                className="fill-white transition-opacity duration-300"
                style={{ opacity: menuOpen ? 0 : 1 }}
              />
              <rect
                x="0" y="12" width="20" height="1.5" rx="0.75"
                className="fill-white transition-transform duration-300"
                style={{ transform: menuOpen ? "rotate(-45deg) translate(3.5px, -5px)" : "none" }}
              />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 z-40 bg-[rgba(15,11,26,0.95)] backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          menuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col items-center justify-center h-full gap-10">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-2xl font-medium transition-colors hover:text-white relative cursor-pointer ${
                pathname === link.href
                  ? "text-white"
                  : "text-[rgba(255,255,255,0.6)]"
              }`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
              {link.href === "/history" && unratedCount > 0 && (
                <span className="absolute -top-2 -right-4 w-2.5 h-2.5 bg-[#f472b6] rounded-full" />
              )}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

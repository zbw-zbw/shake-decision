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
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unratedCount, setUnratedCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Poll for unrated count every 2s (lightweight localStorage read)
  useEffect(() => {
    const update = () => setUnratedCount(getUnratedCount());
    update();
    const id = setInterval(update, 2000);
    // Also listen for storage events from other tabs
    const handler = () => update();
    window.addEventListener("storage", handler);
    return () => {
      clearInterval(id);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[rgba(15,11,26,0.9)] backdrop-blur-md"
            : "bg-[rgba(15,11,26,0.8)] backdrop-blur-md"
        }`}
      >
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white font-bold text-lg cursor-pointer">
            <Smartphone className="w-5 h-5" />
            <span>摇一摇决策器</span>
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
            <div className="w-5 h-4 flex flex-col justify-between">
              <span
                className={`block h-0.5 bg-white transition-transform duration-300 ${
                  menuOpen ? "rotate-45 translate-y-[7px]" : ""
                }`}
              />
              <span
                className={`block h-0.5 bg-white transition-opacity duration-300 ${
                  menuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`block h-0.5 bg-white transition-transform duration-300 ${
                  menuOpen ? "-rotate-45 -translate-y-[7px]" : ""
                }`}
              />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 z-40 bg-[#0f0b1a] transition-all duration-300 md:hidden ${
          menuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col items-center justify-center h-full gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-2xl transition-colors hover:text-white relative cursor-pointer ${
                pathname === link.href
                  ? "text-white font-bold"
                  : "text-[rgba(255,255,255,0.7)]"
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

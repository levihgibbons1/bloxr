"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase";
import type { Session, AuthChangeEvent } from "@supabase/supabase-js";

const navLinks = [
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
];

const Navbar = () => {
  const [visible, setVisible] = useState(true);
  const [atTop, setAtTop] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      setIsLoggedIn(!!data.session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const isAtTop = currentY < 40;

      setAtTop(isAtTop);

      if (isAtTop) {
        setVisible(true);
      } else if (currentY > lastScrollY.current + 5) {
        setVisible(false);
        setMenuOpen(false);
      } else if (currentY < lastScrollY.current - 5) {
        setVisible(true);
      }

      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: 0 }}
      animate={{ y: visible ? 0 : -100 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        !atTop || menuOpen ? "bg-black/90 backdrop-blur-xl border-b border-white/5" : ""
      }`}
    >
      <div className="flex items-center justify-between px-5 py-4 md:px-[80px] md:py-5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1 shrink-0">
          <Image
            src="/logo.png"
            alt="Bloxr logo"
            width={36}
            height={36}
            className="object-contain md:w-[44px] md:h-[44px]"
          />
          <span className="text-white text-[22px] md:text-[28px] font-bold tracking-tight">Bloxr</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center space-x-[40px]">
          {navLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-white/50 hover:text-white text-[15px] font-medium transition-colors duration-200"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Desktop buttons */}
        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="rounded-full bg-white hover:shadow-[0_0_20px_rgba(79,142,247,0.15)] px-[20px] py-[9px] transition-all duration-200 active:scale-[0.97] inline-block"
            >
              <span className="text-black text-[15px] font-semibold">Dashboard</span>
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full border border-white/20 hover:bg-white/[0.05] px-[20px] py-[9px] transition-all duration-300"
              >
                <span className="text-white/70 hover:text-white text-[15px] font-medium">Sign in</span>
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-white hover:shadow-[0_0_20px_rgba(79,142,247,0.15)] px-[20px] py-[9px] transition-all duration-200 active:scale-[0.97] inline-block"
              >
                <span className="text-black text-[15px] font-semibold">Create Account</span>
              </Link>
            </>
          )}
        </div>

        {/* Mobile: single CTA + hamburger */}
        <div className="flex md:hidden items-center gap-2.5">
          <Link
            href={isLoggedIn ? "/dashboard" : "/signup"}
            className="rounded-full bg-white px-4 py-[8px] transition-all duration-200 active:scale-[0.97]"
          >
            <span className="text-black text-[13px] font-semibold">{isLoggedIn ? "Dashboard" : "Get Started"}</span>
          </Link>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="w-9 h-9 flex flex-col items-center justify-center gap-[5px]"
            aria-label="Toggle menu"
          >
            <span
              className={`block w-5 h-[1.5px] bg-white/70 transition-all duration-200 origin-center ${
                menuOpen ? "rotate-45 translate-y-[6.5px]" : ""
              }`}
            />
            <span
              className={`block w-5 h-[1.5px] bg-white/70 transition-all duration-200 ${
                menuOpen ? "opacity-0 scale-x-0" : ""
              }`}
            />
            <span
              className={`block w-5 h-[1.5px] bg-white/70 transition-all duration-200 origin-center ${
                menuOpen ? "-rotate-45 -translate-y-[6.5px]" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden md:hidden border-t border-white/[0.06]"
          >
            <div className="px-5 py-3 flex flex-col">
              {navLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-white/50 hover:text-white text-[16px] font-medium py-3.5 border-b border-white/[0.05] last:border-0 transition-colors duration-200"
                >
                  {item.label}
                </Link>
              ))}
              {!isLoggedIn && (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="text-white/50 hover:text-white text-[16px] font-medium pt-3.5 transition-colors duration-200"
                >
                  Sign in
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;

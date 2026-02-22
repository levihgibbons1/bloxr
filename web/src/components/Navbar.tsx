"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

const Navbar = () => {
  const [visible, setVisible] = useState(true);
  const [atTop, setAtTop] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const isAtTop = currentY < 40;

      setAtTop(isAtTop);

      if (isAtTop) {
        setVisible(true);
      } else if (currentY > lastScrollY.current + 5) {
        setVisible(false);
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
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 md:px-[80px] md:py-5 w-full transition-all duration-300 ${
        !atTop ? "bg-black/80 backdrop-blur-xl border-b border-white/5" : ""
      }`}
    >
      <Link href="/" className="flex items-center gap-1">
        <Image src="/logo.png" alt="Bloxr logo" width={44} height={44} className="object-contain" />
        <span className="text-white text-[28px] font-bold tracking-tight">Bloxr</span>
      </Link>

      <div className="hidden md:flex items-center space-x-[40px]">
        {[
          { label: "How It Works", href: "/#how-it-works" },
          { label: "Features", href: "/#features" },
          { label: "Pricing", href: "/#pricing" },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="text-white/50 hover:text-white text-[15px] font-medium transition-colors duration-200"
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-3">
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
      </div>
    </motion.nav>
  );
};

export default Navbar;

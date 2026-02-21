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
      <Link href="/" className="flex items-center gap-2.5">
        <Image src="/icon.png" alt="Bloxr logo" width={28} height={28} className="rounded-md" />
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

      <Link
        href="/waitlist"
        className="rounded-full border border-white/20 hover:bg-white hover:border-white px-[28px] py-[10px] transition-all duration-300"
      >
        <span className="text-white hover:text-black text-[15px] font-medium">
          Join Waitlist
        </span>
      </Link>
    </motion.nav>
  );
};

export default Navbar;

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
      setAtTop(currentY < 40);
      if (currentY < 40) {
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        !atTop ? "bg-black/90 backdrop-blur-xl border-b border-white/5" : ""
      }`}
    >
      <div className="flex items-center px-5 py-4 md:px-[80px] md:py-5">
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
      </div>
    </motion.nav>
  );
};

export default Navbar;

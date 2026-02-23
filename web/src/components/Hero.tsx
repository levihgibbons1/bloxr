"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Navbar from "./Navbar";

const TypingPrompt = () => {
  const prompts = [
    "Add a shop where players buy speed with coins",
    "Make enemies patrol and chase players within 20 studs",
    "Create a stamina bar that drains when sprinting",
    "Add a top 10 kills leaderboard with live updates",
    "Build a trading system between two players",
    "Create an obby checkpoint system with respawning",
  ];
  const [currentPrompt, setCurrentPrompt] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [phase, setPhase] = useState<"typing" | "deleting">("typing");

  useEffect(() => {
    const prompt = prompts[currentPrompt];

    if (phase === "typing") {
      if (displayText.length < prompt.length) {
        const timeout = setTimeout(() => {
          setDisplayText(prompt.slice(0, displayText.length + 1));
        }, 35 + Math.random() * 25);
        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(() => setPhase("deleting"), 2400);
        return () => clearTimeout(timeout);
      }
    }

    if (phase === "deleting") {
      if (displayText.length > 0) {
        const timeout = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, 15);
        return () => clearTimeout(timeout);
      } else {
        setCurrentPrompt((prev) => (prev + 1) % prompts.length);
        setPhase("typing");
      }
    }
  }, [displayText, phase, currentPrompt]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.5 }}
      className="mt-14 w-full max-w-[600px]"
    >
      <div className="relative rounded-2xl border border-white/[0.08] bg-[#0A0A0F]/90 backdrop-blur-xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

        <div className="px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-[20px] h-[20px] rounded-full bg-gradient-to-br from-white/80 to-white/40 flex items-center justify-center shrink-0">
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L9.5 6.5L14 8L9.5 9.5L8 14L6.5 9.5L2 8L6.5 6.5L8 2Z" fill="black" />
              </svg>
            </div>
            <div className="flex-1 min-h-[24px] flex items-center">
              <span className="text-[15px] font-normal">
                {displayText ? (
                  <span className="text-white/60">
                    {displayText}
                    <span className="inline-block w-[2px] h-[16px] bg-white ml-[1px] align-middle animate-pulse-glow"></span>
                  </span>
                ) : (
                  <span className="text-white/15">Describe what you want to build...</span>
                )}
              </span>
            </div>
            <button
              className={`shrink-0 w-[32px] h-[32px] rounded-lg flex items-center justify-center transition-all duration-200 ${
                displayText ? "bg-white" : "bg-white/[0.06]"
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 12V2M7 2L3 6M7 2L11 6"
                  stroke={displayText ? "black" : "rgba(255,255,255,0.2)"}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Hero = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const isMobile = window.innerWidth < 768;
    const MOBILE_LOOP_DURATION = 5; // seconds — seek back to 0 to limit buffering

    const handleTimeUpdate = () => {
      if (video.currentTime >= MOBILE_LOOP_DURATION) {
        video.currentTime = 0;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        video.pause();
      } else {
        video.play().catch(() => {});
      }
    };

    // Defer video load until after initial paint so it doesn't block FCP
    const timer = setTimeout(() => {
      video.load();
      if (isMobile) {
        video.playbackRate = 0.75;
        video.addEventListener("timeupdate", handleTimeUpdate);
      }
      video.play().catch(() => {});
    }, 0);

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearTimeout(timer);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-black overflow-hidden flex flex-col items-center justify-center noise-overlay">
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          loop
          muted
          playsInline
          preload="none"
          onCanPlay={() => setVideoReady(true)}
          className={`w-full h-full object-cover transition-opacity duration-1000 ${videoReady ? "opacity-60" : "opacity-0"}`}
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260217_030345_246c0224-10a4-422c-b324-070b7c0eceda.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/90"></div>
      </div>

      <div className="absolute inset-0 grid-bg"></div>

      <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] bg-[#4F8EF7]/[0.04] rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[20%] right-[10%] w-[300px] h-[300px] bg-[#7B61FF]/[0.03] rounded-full blur-[100px]"></div>

      <Navbar />

      <div className="relative z-10 flex flex-col items-center w-full px-6 text-center pt-[80px]">
        {/* Badge — truncated on mobile to prevent overflow */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 border border-white/10 rounded-full px-4 sm:px-5 py-2.5 bg-white/[0.03] backdrop-blur-sm"
        >
          <div className="relative flex items-center justify-center w-2 h-2 shrink-0">
            <div className="absolute w-2 h-2 bg-[#4F8EF7] rounded-full"></div>
            <div className="absolute w-4 h-4 bg-[#4F8EF7]/20 rounded-full animate-ping"></div>
          </div>
          <span className="text-white/50 text-[13px] sm:text-[14px] font-medium whitespace-nowrap">Now in early access</span>
          <span className="hidden sm:inline text-white/10">|</span>
          <span className="hidden sm:inline text-white text-[14px] font-medium whitespace-nowrap">Start building for free</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-8 sm:mt-10 text-[38px] sm:text-[44px] md:text-[76px] font-medium leading-[1.05] tracking-[-1.5px] sm:tracking-[-2.5px] max-w-[860px] pb-1"
          style={{
            backgroundImage: "linear-gradient(180deg, #FFFFFF 20%, rgba(255, 255, 255, 0.4) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Roblox development, reimagined through AI.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 sm:mt-7 text-[16px] sm:text-[18px] md:text-[20px] font-normal text-white/45 max-w-[540px] leading-[1.6]"
        >
          Describe what you want to build. Watch it appear in Roblox Studio in real time. No Lua required.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto"
        >
          <Link
            href="/waitlist"
            className="w-full sm:w-auto group relative bg-white rounded-full px-[36px] py-[14px] text-center transition-all duration-200 hover:shadow-[0_0_30px_rgba(79,142,247,0.15)] active:scale-[0.97] inline-block"
          >
            <span className="text-black text-[16px] font-semibold">Get Early Access</span>
          </Link>
          <a
            href="#how-it-works"
            className="text-white/40 hover:text-white/70 text-[15px] font-medium transition-colors flex items-center gap-2"
          >
            See how it works
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-[1px]">
              <path
                d="M6 12L10 8L6 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="mt-5 text-[13px] sm:text-[14px] text-white/25 tracking-wide"
        >
          Free forever / Pro plans for power users / No credit card to start
        </motion.p>

        <TypingPrompt />
      </div>
    </div>
  );
};

export default Hero;

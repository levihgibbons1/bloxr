"use client";

import { motion } from "framer-motion";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import Navbar from "./Navbar";

const Waitlist = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
      } else {
        setErrorMsg(data.error || "Something went wrong.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Could not connect. Please try again.");
      setStatus("error");
    }
  };

  return (
    <div className="w-full min-h-screen bg-black">
      <Navbar />

      <div className="flex flex-col items-center justify-center min-h-screen px-6 pt-[80px]">
        <div className="w-full max-w-[480px]">
          {status === "success" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <div className="w-[64px] h-[64px] rounded-full bg-[#10B981]/10 flex items-center justify-center mx-auto mb-6">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 13L9 17L19 7"
                    stroke="#10B981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h1 className="text-[32px] md:text-[40px] font-semibold text-white mb-4">
                {"You're on the list!"}
              </h1>
              <p className="text-white/40 text-[17px] leading-relaxed mb-4 max-w-[420px] mx-auto">
                {"We'll send you an invite when your spot is ready. Keep an eye on your inbox."}
              </p>
              <p className="text-white/25 text-[14px] mb-10 max-w-[380px] mx-auto">
                In the meantime, follow us on social media for sneak peeks and updates.
              </p>
              <Link
                href="/"
                className="text-[#4F8EF7] hover:text-[#4F8EF7]/80 text-[15px] font-medium transition-colors"
              >
                Back to home
              </Link>
            </motion.div>
          ) : (
            <>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-[36px] md:text-[48px] font-medium text-center leading-[1.08] tracking-[-2px] mb-4 text-white"
              >
                Get early access
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-white/40 text-[17px] text-center leading-relaxed mb-10 max-w-[400px] mx-auto"
              >
                {"Be among the first to build Roblox games with AI. We'll email you when it's your turn."}
              </motion.p>

              <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="space-y-4"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === "error") setStatus("idle");
                  }}
                  placeholder="you@example.com"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-5 py-4 text-white text-[16px] placeholder:text-white/20 outline-none focus:border-white/20 transition-colors duration-200"
                  autoFocus
                />

                {status === "error" && (
                  <p className="text-[#FF6B6B]/80 text-[14px]">{errorMsg}</p>
                )}

                <motion.button
                  type="submit"
                  disabled={status === "loading" || !email}
                  className="w-full bg-white rounded-xl py-4 text-black text-[16px] font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {status === "loading" ? "Joining..." : "Join Waitlist"}
                </motion.button>
              </motion.form>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="mt-8 flex flex-col items-center gap-3"
              >
                <div className="flex items-center gap-6 text-white/20 text-[13px]">
                  <span className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Free plan included
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    No credit card
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    No spam
                  </span>
                </div>
                <p className="text-white/15 text-[12px]">
                  Upgrade later for unlimited prompts and team features
                </p>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Waitlist;

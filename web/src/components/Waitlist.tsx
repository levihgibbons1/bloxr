"use client";

import { motion } from "framer-motion";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import Navbar from "./Navbar";

const FloatingParticle = ({
  delay,
  x,
  y,
  size,
}: {
  delay: number;
  x: string;
  y: string;
  size: number;
}) => (
  <motion.div
    className="absolute rounded-full bg-[#4F8EF7]"
    style={{ left: x, top: y, width: size, height: size }}
    initial={{ opacity: 0, scale: 0 }}
    animate={{
      opacity: [0, 0.3, 0.1, 0.3, 0],
      scale: [0, 1, 0.8, 1, 0],
      y: [0, -30, -15, -40, -60],
    }}
    transition={{ duration: 6, delay, repeat: Infinity, ease: "easeInOut" }}
  />
);

const Waitlist = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const res = await fetch(
        process.env.NEXT_PUBLIC_API_URL
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/waitlist`
          : "/api/waitlist",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
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
    <div className="relative w-full min-h-screen bg-black overflow-hidden noise-overlay">
      <div className="absolute inset-0 grid-bg"></div>

      <motion.div
        className="absolute top-[20%] left-[15%] w-[500px] h-[500px] rounded-full blur-[150px]"
        animate={{
          background: [
            "radial-gradient(circle, rgba(79,142,247,0.06) 0%, transparent 70%)",
            "radial-gradient(circle, rgba(123,97,255,0.06) 0%, transparent 70%)",
            "radial-gradient(circle, rgba(79,142,247,0.06) 0%, transparent 70%)",
          ],
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[15%] right-[10%] w-[400px] h-[400px] rounded-full blur-[130px]"
        animate={{
          background: [
            "radial-gradient(circle, rgba(123,97,255,0.04) 0%, transparent 70%)",
            "radial-gradient(circle, rgba(79,142,247,0.05) 0%, transparent 70%)",
            "radial-gradient(circle, rgba(123,97,255,0.04) 0%, transparent 70%)",
          ],
          x: [0, -20, 0],
          y: [0, 15, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <FloatingParticle delay={0} x="20%" y="60%" size={3} />
      <FloatingParticle delay={1.2} x="75%" y="70%" size={2} />
      <FloatingParticle delay={2.5} x="40%" y="80%" size={4} />
      <FloatingParticle delay={0.8} x="60%" y="55%" size={2} />
      <FloatingParticle delay={3.5} x="30%" y="45%" size={3} />
      <FloatingParticle delay={1.8} x="85%" y="40%" size={2} />
      <FloatingParticle delay={4} x="15%" y="75%" size={3} />
      <FloatingParticle delay={2} x="50%" y="35%" size={2} />

      <Navbar />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 pt-[80px]">
        <div className="w-full max-w-[480px]">
          {status === "success" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                className="w-[64px] h-[64px] rounded-full bg-[#10B981]/10 flex items-center justify-center mx-auto mb-6"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <motion.path
                    d="M5 13L9 17L19 7"
                    stroke="#10B981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  />
                </svg>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-[32px] md:text-[40px] font-semibold text-white mb-4"
              >
                {"You've successfully joined the waitlist!"}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-white/40 text-[17px] leading-relaxed mb-4 max-w-[420px] mx-auto"
              >
                {"We'll send you an invite when your spot is ready. Keep an eye on your inbox."}
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-white/25 text-[14px] mb-10 max-w-[380px] mx-auto"
              >
                In the meantime, follow us on social media for sneak peeks and updates.
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-6"
              >
                <Link
                  href="/"
                  className="text-[#4F8EF7] hover:text-[#4F8EF7]/80 text-[15px] font-medium transition-colors"
                >
                  Back to home
                </Link>
              </motion.div>
            </motion.div>
          ) : (
            <>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-[36px] md:text-[48px] font-medium text-center leading-[1.08] tracking-[-2px] mb-4"
                style={{
                  backgroundImage:
                    "linear-gradient(180deg, #FFFFFF 20%, rgba(255, 255, 255, 0.5) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
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
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[#FF6B6B]/80 text-[14px]"
                  >
                    {errorMsg}
                  </motion.p>
                )}

                <motion.button
                  type="submit"
                  disabled={status === "loading" || !email}
                  className="w-full bg-white rounded-xl py-4 text-black text-[16px] font-semibold transition-all duration-200 hover:shadow-[0_0_40px_rgba(79,142,247,0.2)] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
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
                      <path
                        d="M5 13L9 17L19 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Free plan included
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 13L9 17L19 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    No credit card
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 13L9 17L19 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
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

"use client";

import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Sign in with Roblox",
    description:
      "One click. Roblox handles the login. No new account, no email, no password. You are in.",
    visual: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect x="4" y="4" width="40" height="40" rx="12" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M18 28L24 20L30 28"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="24" cy="16" r="4" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Connect Studio",
    description:
      "Click one button. Studio opens. The plugin installs itself silently in the background. No setup wizard, no config files.",
    visual: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <path d="M8 24H20M28 24H40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="24" cy="24" r="6" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M22 24L24 26L26 22"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Auto-authentication",
    description:
      "The plugin already knows who you are from the Roblox sign-in. No tokens to paste. No manual setup. It just connects.",
    visual: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect x="12" y="20" width="24" height="16" rx="4" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M18 20V16C18 12.6863 20.6863 10 24 10C27.3137 10 30 12.6863 30 16V20"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="24" cy="28" r="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Start building",
    description:
      "Type what you want. Hit send. Watch code appear in your open Studio place in real time. Pick a game blueprint or start from scratch. Under 60 seconds from zero to building.",
    visual: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <path
          d="M14 34L20 28L26 32L34 20"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="34" cy="20" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 40H38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      </svg>
    ),
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="relative bg-black py-[140px] px-8 md:px-[80px] overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-50"></div>

      <div className="relative max-w-[1100px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-20"
        >
          <p className="text-[#4F8EF7] text-[14px] font-semibold tracking-[0.1em] uppercase mb-4">
            How It Works
          </p>
          <h2 className="text-[36px] md:text-[52px] font-medium leading-[1.08] tracking-[-2px] text-white max-w-[600px]">
            Zero to building in under 60 seconds.
          </h2>
          <p className="mt-5 text-white/40 text-[18px] max-w-[480px] leading-relaxed">
            Four steps. Four clicks. No terminal. No config files. No coding knowledge required.
          </p>
        </motion.div>

        <div className="relative">
          <div className="hidden md:block absolute left-[23px] top-0 bottom-0 w-[1px] bg-gradient-to-b from-[#4F8EF7]/30 via-[#4F8EF7]/10 to-transparent"></div>

          <div className="space-y-6 md:space-y-0">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: i * 0.1 }}
                className="relative md:pl-16 py-8 group"
              >
                <div className="hidden md:flex absolute left-0 top-8 w-[48px] h-[48px] items-center justify-center">
                  <div className="w-[10px] h-[10px] rounded-full bg-[#4F8EF7]/60 group-hover:bg-[#4F8EF7] transition-colors duration-300 ring-4 ring-black"></div>
                </div>

                <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-12 p-6 md:p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300">
                  <div className="text-[#4F8EF7]/40 group-hover:text-[#4F8EF7]/70 transition-colors shrink-0">
                    {step.visual}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[#4F8EF7]/40 text-[13px] font-mono font-semibold">
                        {step.number}
                      </span>
                      <h3 className="text-white text-[22px] font-semibold">{step.title}</h3>
                    </div>
                    <p className="text-white/40 text-[16px] leading-relaxed max-w-[500px]">
                      {step.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

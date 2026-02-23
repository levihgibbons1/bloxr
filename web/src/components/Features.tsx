"use client";

import { motion } from "framer-motion";

const features = [
  {
    title: "Deep Roblox AI",
    description:
      "Not a generic chatbot. An AI with a comprehensive Roblox context layer -- every current API, every service, every Luau pattern. It knows the difference between deprecated Lua and current Luau syntax.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path
          d="M16 4V8M16 24V28M4 16H8M24 16H28"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="16" cy="16" r="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Real-time Studio sync",
    description:
      "Changes appear live inside your open Roblox Studio place. Not a file export. Not a copy-paste workflow. You type a prompt, hit send, and watch code materialize where it belongs.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M6 16L14 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M18 16L26 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path
          d="M14 12L18 16L14 20"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="2" y="8" width="8" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <rect x="22" y="8" width="8" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    title: "Game blueprint system",
    description:
      "Full game templates that give you a working foundation in seconds. Obby, tycoon, simulator, RPG. Each blueprint comes with pre-wired systems you can customize through prompts.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="6" width="24" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4 12H28" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 12V26" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="7" cy="9" r="1" fill="currentColor" opacity="0.4" />
        <rect x="14" y="16" width="8" height="3" rx="1" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
        <rect x="14" y="22" width="5" height="1" rx="0.5" fill="currentColor" opacity="0.3" />
      </svg>
    ),
  },
  {
    title: "Self-correcting",
    description:
      "When generated code produces a Studio error, the plugin captures it and feeds it back to the AI automatically. The fix appears without you lifting a finger. Errors just disappear.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path
          d="M12 16L15 19L20 13"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M28 16C28 22.6274 22.6274 28 16 28C9.37258 28 4 22.6274 4 16C4 9.37258 9.37258 4 16 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M28 4L28 12H20"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Conversation memory",
    description:
      "The AI remembers your entire session. Follow-up prompts work naturally. Say \"now add a cooldown to that ability\" and it knows exactly which ability you mean. Pro users get unlimited history.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M8 10H24M8 16H20M8 22H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="4" y="4" width="24" height="24" rx="4" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    title: "Open source plugin",
    description:
      "The Studio plugin that connects Bloxr to your game is fully open source. Every line is public on GitHub. No black boxes, no hidden network calls. You can audit exactly what runs inside your Studio.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path
          d="M16 4C9.37258 4 4 9.37258 4 16C4 21.3005 7.40246 25.8096 12.1716 27.4513C12.7716 27.5603 13 27.1932 13 26.8766V24.6568C9.95507 25.3765 9.25 23.2284 9.25 23.2284C8.70402 21.794 7.92228 21.4301 7.92228 21.4301C6.84602 20.6918 8.0025 20.7074 8.0025 20.7074C9.19341 20.7913 9.81712 21.9344 9.81712 21.9344C10.875 23.8096 12.6026 23.2662 13.0499 22.9511C13.1551 22.1796 13.4638 21.6378 13.8034 21.3305C11.3959 21.0183 8.86364 20.0785 8.86364 15.8494C8.86364 14.4837 9.34091 13.3683 10.0682 12.5C9.94886 12.1882 9.52841 10.9136 10.1818 9.20455C10.1818 9.20455 11.1705 8.875 13 10.0682C13.7955 9.8422 14.6477 9.72869 15.5 9.72443C16.3523 9.72869 17.2045 9.8422 18 10.0682C19.8295 8.875 20.8182 9.20455 20.8182 9.20455C21.4716 10.9136 21.0511 12.1882 20.9318 12.5C21.6616 13.3683 22.1364 14.4837 22.1364 15.8494C22.1364 20.0908 19.5989 21.015 17.1841 21.3196C17.6023 21.6971 18 22.4368 18 23.5767V26.8766C18 27.196 18.2261 27.5657 18.8352 27.4496C23.6006 25.8064 27 21.2989 27 16C27 9.37258 21.6274 4 15 4H16Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "UI component library",
    description:
      "A curated library of 100+ beautiful, functional UI components. Shop GUIs, health bars, leaderboards, notification systems. Each one arrives pre-wired and ready to use in your game.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <rect x="17" y="4" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <rect x="4" y="17" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M22.5 20V26M19.5 23H25.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

const Features = () => {
  return (
    <section id="features" className="relative bg-black py-[140px] px-8 md:px-[80px] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"></div>
      <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] bg-[#4F8EF7]/[0.02] rounded-full blur-[150px]"></div>

      <div className="relative max-w-[1100px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5 lg:sticky lg:top-[120px] lg:self-start"
          >
            <p className="text-[#4F8EF7] text-[14px] font-semibold tracking-[0.1em] uppercase mb-4">
              Features
            </p>
            <h2 className="text-[36px] md:text-[48px] font-medium leading-[1.08] tracking-[-2px] text-white">
              Not another wrapper around ChatGPT.
            </h2>
            <p className="mt-5 text-white/40 text-[18px] leading-relaxed">
              Every feature exists because generic AI tools fail at Roblox development in specific,
              predictable ways. Bloxr fixes each one.
            </p>
          </motion.div>

          <div className="lg:col-span-7 space-y-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="group p-7 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300"
              >
                <div className="flex items-start gap-5">
                  <div className="text-white/20 group-hover:text-[#4F8EF7]/60 transition-colors duration-300 shrink-0 mt-1">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-white text-[19px] font-semibold mb-2">{feature.title}</h3>
                    <p className="text-white/35 text-[15px] leading-[1.7] group-hover:text-white/45 transition-colors duration-300">
                      {feature.description}
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

export default Features;

"use client";

import { motion } from "framer-motion";

const competitors = [
  {
    name: "Roblox's built-in AI",
    verdict: "Fails at complex multi-step tasks",
    detail:
      "Confirmed by their own benchmark data. Fine for renaming a part. Useless for building a shop system.",
  },
  {
    name: "ChatGPT / Gemini",
    verdict: "Deprecated APIs, wrong script types",
    detail:
      "Returns Lua instead of Luau. Puts server code in LocalScripts. Generates APIs that were removed two years ago.",
  },
  {
    name: "Roblox Studio MCP",
    verdict: "Requires Rust, source builds, JSON configs",
    detail:
      "Powerful for engineers. Completely inaccessible to 99% of the 4 million creators who actually want to build.",
  },
  {
    name: "Existing Studio plugins",
    verdict: "Basic, ugly, no agentic capabilities",
    detail:
      "Simple code insertion with no context awareness. No error correction. No conversation memory. No UI components.",
  },
];

const Problem = () => {
  return (
    <section className="relative bg-black py-[140px] px-8 md:px-[80px] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"></div>

      <div className="relative max-w-[1100px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <p className="text-[#4F8EF7] text-[14px] font-semibold tracking-[0.1em] uppercase mb-4">
            The Problem
          </p>
          <h2 className="text-[36px] md:text-[48px] font-medium leading-[1.08] tracking-[-2px] text-white max-w-[700px]">
            88 million daily players. Millions want to build. One thing blocks them all.
          </h2>
          <p className="mt-5 text-white/40 text-[18px] leading-relaxed max-w-[540px]">
            Luau scripting. Every existing solution either fails at Roblox-specific tasks or requires
            technical knowledge that most creators do not have.
          </p>
        </motion.div>

        <div className="space-y-3">
          {competitors.map((comp, i) => (
            <motion.div
              key={comp.name}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="group relative p-6 md:p-7 rounded-2xl border border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.03] transition-all duration-300"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                <div className="md:w-[200px] shrink-0">
                  <span className="text-white/60 text-[15px] font-semibold">{comp.name}</span>
                </div>
                <div className="md:w-[280px] shrink-0">
                  <span className="text-[#FF6B6B]/70 text-[14px] font-medium">{comp.verdict}</span>
                </div>
                <div className="flex-1">
                  <p className="text-white/25 text-[14px] leading-relaxed">{comp.detail}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 p-7 rounded-2xl border border-[#4F8EF7]/20 bg-[#4F8EF7]/[0.03]"
        >
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
            <div className="md:w-[200px] shrink-0">
              <span className="text-white text-[15px] font-semibold">Bloxr.dev</span>
            </div>
            <div className="md:w-[280px] shrink-0">
              <span className="text-[#4F8EF7] text-[14px] font-medium">
                Deep AI + real-time sync + UI library
              </span>
            </div>
            <div className="flex-1">
              <p className="text-white/40 text-[14px] leading-relaxed">
                The only tool that combines Claude-powered Roblox-specific AI, live Studio sync via an
                invisible plugin, and a curated marketplace of production-ready UI components.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Problem;

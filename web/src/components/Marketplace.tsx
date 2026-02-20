"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const categories = [
  {
    name: "Shop & Economy",
    items: ["Shop GUIs", "Coin displays", "Purchase confirmations", "Inventory grids"],
    count: 8,
    gradient: "from-[#4F8EF7]/10 to-[#4F8EF7]/[0.02]",
    accent: "#4F8EF7",
  },
  {
    name: "Player Info",
    items: ["Health bars", "Stamina bars", "Level progress", "XP displays"],
    count: 6,
    gradient: "from-[#7B61FF]/10 to-[#7B61FF]/[0.02]",
    accent: "#7B61FF",
  },
  {
    name: "Notifications",
    items: ["Toast alerts", "Achievement popups", "System messages", "Kill feed"],
    count: 5,
    gradient: "from-[#F59E0B]/10 to-[#F59E0B]/[0.02]",
    accent: "#F59E0B",
  },
  {
    name: "Navigation",
    items: ["Mobile buttons", "Main menus", "Settings panels", "Tab systems"],
    count: 6,
    gradient: "from-[#10B981]/10 to-[#10B981]/[0.02]",
    accent: "#10B981",
  },
];

const Marketplace = () => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  return (
    <section id="marketplace" className="relative bg-black py-[140px] px-8 md:px-[80px] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"></div>

      <div className="relative max-w-[1100px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="lg:sticky lg:top-[120px]"
          >
            <p className="text-[#4F8EF7] text-[14px] font-semibold tracking-[0.1em] uppercase mb-4">
              UI Marketplace
            </p>
            <h2 className="text-[36px] md:text-[48px] font-medium leading-[1.08] tracking-[-2px] text-white">
              Beautiful components, one click away.
            </h2>
            <p className="mt-5 text-white/40 text-[18px] leading-relaxed max-w-[460px]">
              Manually curated UI components matching the design quality of current top Roblox games.
              Each one is functional out of the box -- not just visuals. Insert directly into Studio
              with a single click.
            </p>

            <div className="mt-8 flex items-center gap-6">
              <div>
                <span className="text-white text-[32px] font-bold tracking-tight">20+</span>
                <p className="text-white/30 text-[14px] mt-1">Launch components</p>
              </div>
              <div className="w-[1px] h-[40px] bg-white/10"></div>
              <div>
                <span className="text-white text-[32px] font-bold tracking-tight">4</span>
                <p className="text-white/30 text-[14px] mt-1">Categories</p>
              </div>
              <div className="w-[1px] h-[40px] bg-white/10"></div>
              <div>
                <span className="text-white text-[32px] font-bold tracking-tight">Weekly</span>
                <p className="text-white/30 text-[14px] mt-1">New drops</p>
              </div>
            </div>
          </motion.div>

          <div className="space-y-4">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className={`relative p-6 rounded-2xl border border-white/[0.06] bg-gradient-to-br ${cat.gradient} hover:border-white/[0.12] transition-all duration-300 cursor-default overflow-hidden`}
                onMouseEnter={() => setHoveredCard(i)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div
                  className="absolute top-0 right-0 w-[120px] h-[120px] rounded-full blur-[60px] transition-opacity duration-500"
                  style={{ backgroundColor: cat.accent, opacity: hoveredCard === i ? 0.08 : 0 }}
                ></div>

                <div className="relative flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.accent }}></div>
                      <h3 className="text-white text-[18px] font-semibold">{cat.name}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {cat.items.map((item) => (
                        <span
                          key={item}
                          className="text-white/25 text-[13px] bg-white/[0.04] rounded-full px-3 py-1 border border-white/[0.04]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-white/20 text-[14px] font-mono shrink-0 ml-4">{cat.count}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Marketplace;

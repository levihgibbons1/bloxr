"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    description: "Everything you need to start building with AI. No credit card required.",
    features: [
      "10 prompts per day",
      "5 UI components from basic library",
      "1 project",
      "Real-time Studio sync",
      "7-day conversation history",
      "Community support",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$14",
    period: "/mo",
    badge: "Most Popular",
    description: "For builders who have outgrown the free tier and want to ship faster.",
    features: [
      "Unlimited prompts",
      "Full UI component library (100+)",
      "Unlimited projects",
      "Full game blueprint system",
      "Unlimited conversation history",
      "Priority AI response speed",
      "Email support",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
  {
    name: "Studio",
    price: "$39",
    period: "/mo",
    description: "For teams and studios shipping games together at scale.",
    features: [
      "Everything in Pro",
      "Up to 5 team members",
      "Shared projects",
      "1 custom UI component request/mo",
      "Early access to new blueprints",
      "Priority support (24hr response)",
      "Usage analytics dashboard",
    ],
    cta: "Go Studio",
    highlighted: false,
  },
];

const Pricing = () => {
  return (
    <section id="pricing" className="relative bg-black py-[140px] px-8 md:px-[80px] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"></div>
      <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[800px] h-[400px] bg-[#4F8EF7]/[0.02] rounded-full blur-[150px]"></div>

      <div className="relative max-w-[1100px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-[#4F8EF7] text-[14px] font-semibold tracking-[0.1em] uppercase mb-4">
            Pricing
          </p>
          <h2 className="text-[36px] md:text-[48px] font-medium leading-[1.08] tracking-[-2px] text-white">
            Start free. Upgrade when you outgrow it.
          </h2>
          <p className="mt-5 text-white/40 text-[18px] max-w-[440px] mx-auto">
            No surprises. No hidden fees. Cancel anytime.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              className={`relative p-8 rounded-2xl border transition-all duration-300 ${
                plan.highlighted
                  ? "border-[#4F8EF7]/30 bg-[#4F8EF7]/[0.04] hover:border-[#4F8EF7]/50"
                  : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-[1px] left-[20%] right-[20%] h-[1px] bg-gradient-to-r from-transparent via-[#4F8EF7]/60 to-transparent"></div>
              )}

              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-white text-[18px] font-semibold">{plan.name}</h3>
                  {"badge" in plan && plan.badge && (
                    <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#4F8EF7] bg-[#4F8EF7]/10 px-2.5 py-1 rounded-full">
                      {plan.badge}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-white text-[44px] font-bold tracking-tight leading-none">
                    {plan.price}
                  </span>
                  <span className="text-white/30 text-[16px]">{plan.period}</span>
                </div>
                <p className="text-white/35 text-[15px] mt-3 leading-relaxed">{plan.description}</p>
              </div>

              <div className="h-[1px] bg-white/[0.06] mb-6"></div>

              <ul className="space-y-3.5 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-white/50 text-[15px]">
                    <svg className="w-4 h-4 mt-[3px] shrink-0" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M3 8L6.5 11.5L13 5"
                        stroke={plan.highlighted ? "#4F8EF7" : "rgba(255,255,255,0.25)"}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/waitlist"
                className={`block w-full text-center rounded-xl py-[13px] text-[15px] font-semibold transition-all duration-200 active:scale-[0.97] ${
                  plan.highlighted
                    ? "bg-[#4F8EF7] text-white hover:bg-[#3D7BE5] shadow-[0_0_20px_rgba(79,142,247,0.15)]"
                    : "bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white"
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;

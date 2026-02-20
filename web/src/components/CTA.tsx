"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const CTA = () => {
  return (
    <section className="relative bg-black py-[120px] px-8 md:px-[80px] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"></div>

      <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#4F8EF7]/[0.04] rounded-full blur-[120px]"></div>

      <div className="relative max-w-[700px] mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-[36px] md:text-[52px] font-medium leading-[1.08] tracking-[-2px] text-white">
            Build anything you imagine.
          </h2>
          <p className="mt-5 text-white/40 text-[18px] leading-relaxed max-w-[460px] mx-auto">
            Join thousands of Roblox creators who are building games faster than they ever thought
            possible.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/waitlist"
              className="group relative bg-white rounded-full px-[36px] py-[14px] transition-all duration-200 hover:shadow-[0_0_40px_rgba(79,142,247,0.2)] active:scale-[0.97] inline-block"
            >
              <span className="text-black text-[16px] font-semibold">Get Early Access</span>
            </Link>
            <span className="text-white/25 text-[14px]">Free to start. No credit card.</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;

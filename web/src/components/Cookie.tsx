"use client";

import { motion } from "framer-motion";
import Navbar from "./Navbar";
import Footer from "./Footer";

const Cookie = () => {
  return (
    <div className="relative w-full min-h-screen bg-black">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <Navbar />

      <div className="relative z-10 max-w-[720px] mx-auto px-6 pt-[140px] pb-[100px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-[36px] md:text-[48px] font-medium leading-[1.08] tracking-[-2px] text-white mb-3">
            Cookie Policy
          </h1>
          <p className="text-white/30 text-[15px] mb-12">Effective Date: February 20, 2026</p>

          <div className="space-y-10 text-white/50 text-[15px] leading-[1.8]">
            <div>
              <h2 className="text-white text-[18px] font-semibold mb-3">1. What Are Cookies</h2>
              <p>Cookies are small text files placed on your device when you visit a website. They help the site remember information about your visit, such as your preferences and session state.</p>
            </div>

            <div>
              <h2 className="text-white text-[18px] font-semibold mb-3">2. How We Use Cookies</h2>
              <p className="mb-3">Bloxr uses cookies for the following purposes:</p>
              <ul className="space-y-2 ml-1">
                <li className="flex items-start gap-2">
                  <span className="mt-[10px] shrink-0 w-1 h-1 rounded-full bg-white/30"></span>
                  <span><strong className="text-white/70">Essential cookies:</strong> Required for the Service to function. These cannot be disabled.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-[10px] shrink-0 w-1 h-1 rounded-full bg-white/30"></span>
                  <span><strong className="text-white/70">Analytics cookies:</strong> Help us understand how visitors interact with our site so we can improve it.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-[10px] shrink-0 w-1 h-1 rounded-full bg-white/30"></span>
                  <span><strong className="text-white/70">Preference cookies:</strong> Remember your settings and preferences across sessions.</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-white text-[18px] font-semibold mb-3">3. Types of Cookies We Use</h2>
              <ul className="space-y-2 ml-1">
                <li className="flex items-start gap-2">
                  <span className="mt-[10px] shrink-0 w-1 h-1 rounded-full bg-white/30"></span>
                  <span><strong className="text-white/70">Session cookies:</strong> Temporary cookies that expire when you close your browser.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-[10px] shrink-0 w-1 h-1 rounded-full bg-white/30"></span>
                  <span><strong className="text-white/70">Persistent cookies:</strong> Remain on your device for a set period or until you delete them.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-[10px] shrink-0 w-1 h-1 rounded-full bg-white/30"></span>
                  <span><strong className="text-white/70">Third-party cookies:</strong> Set by our service providers (e.g., analytics tools) to help us understand usage.</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-white text-[18px] font-semibold mb-3">4. Managing Cookies</h2>
              <p>You can control and delete cookies through your browser settings. Disabling certain cookies may affect the functionality of the Service. Most browsers allow you to:</p>
              <ul className="space-y-2 ml-1 mt-3">
                <li className="flex items-start gap-2">
                  <span className="mt-[10px] shrink-0 w-1 h-1 rounded-full bg-white/30"></span>
                  <span>View cookies stored on your device</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-[10px] shrink-0 w-1 h-1 rounded-full bg-white/30"></span>
                  <span>Delete all or specific cookies</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-[10px] shrink-0 w-1 h-1 rounded-full bg-white/30"></span>
                  <span>Block cookies from specific or all websites</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-white text-[18px] font-semibold mb-3">5. Third-Party Services</h2>
              <p>We may use third-party analytics services that set their own cookies. These services are governed by their own privacy and cookie policies. We do not control third-party cookies.</p>
            </div>

            <div>
              <h2 className="text-white text-[18px] font-semibold mb-3">6. Changes to This Policy</h2>
              <p>We may update this Cookie Policy at any time. Continued use of the Service after changes constitutes acceptance of the updated policy.</p>
            </div>

            <div>
              <h2 className="text-white text-[18px] font-semibold mb-3">7. Contact</h2>
              <p>For questions about our use of cookies, contact us at <a href="mailto:privacy@bloxr.dev" className="text-[#4F8EF7] hover:text-[#4F8EF7]/80 transition-colors">privacy@bloxr.dev</a>.</p>
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default Cookie;

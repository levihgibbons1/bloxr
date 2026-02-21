"use client";

import { motion } from "framer-motion";
import Navbar from "./Navbar";
import Footer from "./Footer";

const Privacy = () => {
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
            Privacy Policy
          </h1>
          <p className="text-white/30 text-[15px] mb-12">Effective Date: February 20, 2026</p>

          <div className="space-y-10 text-white/50 text-[15px] leading-[1.8]">
            <div>
              <h2 className="text-white text-[18px] font-semibold mb-3">1. Information We Collect</h2>
              <ul className="space-y-2 ml-1">
                <li className="flex items-start gap-2">
                  <span className="mt-[10px] shrink-0 w-1 h-1 rounded-full bg-white/30"></span>
                  <span><strong className="text-white/70">Account information:</strong> name, email address, password</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-[10px] shrink-0 w-1 h-1 rounded-full bg-white/30"></span>
                  <span><strong className="text-white/70">Usage data:</strong> prompts submitted, features used, session duration</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-[10px] shrink-0 w-1 h-1 rounded-full bg-white/30"></span>
                  <span><strong className="text-white/70">Technical data:</strong> IP address, browser type, device information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-[10px] shrink-0 w-1 h-1 rounded-full bg-white/30"></span>
                  <span><strong className="text-white/70">Payment information:</strong> processed securely by our payment provider; we do not store card details</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-white text-[18px] font-semibold mb-3">2. How We Use Your Information</h2>
              <ul className="space-y-2 ml-1">
                <li className="flex items-start gap-2">
                  <span className="mt-[10px] shrink-0 w-1 h-1 rounded-full bg-white/30"></span>
                  <span>To provide and improve the Service</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-[10px] shrink-0 w-1 h-1 rounded-full bg-white/30"></span>
                  <span>To send transactional emails (account, billing, waitlist)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-[10px] shrink-0 w-1 h-1 rounded-full bg-white/30"></span>
                  <span>To send product updates (you may opt out at any time)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-[10px] shrink-0 w-1 h-1 rounded-full bg-white/30"></span>
                  <span>To detect and prevent fraud or abuse</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-white text-[18px] font-semibold mb-3">3. Data Sharing</h2>
              <p className="mb-3">We do not sell your personal data. We may share data with:</p>
              <ul className="space-y-2 ml-1">
                <li className="flex items-start gap-2">
                  <span className="mt-[10px] shrink-0 w-1 h-1 rounded-full bg-white/30"></span>
                  <span><strong className="text-white/70">Service providers</strong> (e.g., email delivery, payment processing, hosting) under strict data processing agreements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-[10px] shrink-0 w-1 h-1 rounded-full bg-white/30"></span>
                  <span><strong className="text-white/70">Legal authorities</strong> if required by law</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-white text-[18px] font-semibold mb-3">4. Data Retention</h2>
              <p>We retain your data for as long as your account is active or as needed to provide the Service. You may request deletion at any time.</p>
            </div>

            <div>
              <h2 className="text-white text-[18px] font-semibold mb-3">5. Cookies</h2>
              <p>We use essential cookies to operate the Service and analytics cookies to understand usage. You may disable non-essential cookies in your browser settings.</p>
            </div>

            <div>
              <h2 className="text-white text-[18px] font-semibold mb-3">6. Security</h2>
              <p>We use industry-standard security measures to protect your data. No method of transmission over the internet is 100% secure.</p>
            </div>

            <div>
              <h2 className="text-white text-[18px] font-semibold mb-3">7. Children&apos;s Privacy</h2>
              <p>Bloxr is not directed at children under 13. We do not knowingly collect data from children under 13.</p>
            </div>

            <div>
              <h2 className="text-white text-[18px] font-semibold mb-3">8. Your Rights</h2>
              <p>Depending on your location, you may have the right to access, correct, delete, or export your personal data. Contact us at <a href="mailto:privacy@bloxr.dev" className="text-[#4F8EF7] hover:text-[#4F8EF7]/80 transition-colors">privacy@bloxr.dev</a> to make a request.</p>
            </div>

            <div>
              <h2 className="text-white text-[18px] font-semibold mb-3">9. Changes to This Policy</h2>
              <p>We may update this Privacy Policy at any time. We will notify you of significant changes via email or in-app notice.</p>
            </div>

            <div>
              <h2 className="text-white text-[18px] font-semibold mb-3">10. Contact</h2>
              <p>For privacy questions or requests, contact us at <a href="mailto:privacy@bloxr.dev" className="text-[#4F8EF7] hover:text-[#4F8EF7]/80 transition-colors">privacy@bloxr.dev</a>.</p>
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default Privacy;

import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-black border-t border-white/[0.06] py-14 px-8 md:px-[80px]">
      <div className="max-w-[1100px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-14">
          <div className="md:col-span-4">
            <div className="flex items-center mb-4">
              <span className="text-white text-[24px] font-bold tracking-tight">Bloxr.dev</span>
            </div>
            <p className="text-white/30 text-[15px] leading-relaxed max-w-[280px]">
              AI-powered Roblox development. Describe what you want to build. Watch it appear in
              Studio.
            </p>
          </div>

          <div className="md:col-span-2 md:col-start-6">
            <h4 className="text-white/60 text-[13px] font-semibold tracking-[0.08em] uppercase mb-5">
              Product
            </h4>
            <ul className="space-y-3">
              {[
                { label: "How It Works", href: "/#how-it-works" },
                { label: "Features", href: "/#features" },
                { label: "Marketplace", href: "/#marketplace" },
                { label: "Pricing", href: "/#pricing" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-white/30 hover:text-white/60 text-[14px] transition-colors duration-200"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-white/60 text-[13px] font-semibold tracking-[0.08em] uppercase mb-5">
              Company
            </h4>
            <ul className="space-y-3">
              {["About", "Blog", "Careers", "Contact"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-white/30 hover:text-white/60 text-[14px] transition-colors duration-200"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-white/60 text-[13px] font-semibold tracking-[0.08em] uppercase mb-5">
              Legal
            </h4>
            <ul className="space-y-3">
              {["Terms of Service", "Privacy Policy", "Cookie Policy"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-white/30 hover:text-white/60 text-[14px] transition-colors duration-200"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/[0.06] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/20 text-[13px]">
            {new Date().getFullYear()} Bloxr.dev. All rights reserved.
          </p>
          <div className="flex items-center space-x-6">
            <a href="#" className="text-white/20 hover:text-white/40 text-[13px] transition-colors duration-200">
              Terms
            </a>
            <a href="#" className="text-white/20 hover:text-white/40 text-[13px] transition-colors duration-200">
              Privacy
            </a>
            <a href="#" className="text-white/20 hover:text-white/40 text-[13px] transition-colors duration-200">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6 grid-bg relative overflow-hidden">
      <div className="absolute top-[20%] left-[15%] w-[400px] h-[400px] bg-[#4F8EF7]/[0.04] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[15%] w-[300px] h-[300px] bg-[#7B61FF]/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[400px] relative z-10"
      >
        <Link href="/" className="flex items-center justify-center gap-1 mb-10">
          <Image src="/logo.png" alt="Bloxr" width={36} height={36} className="object-contain" />
          <span className="text-white text-[24px] font-bold tracking-tight">Bloxr</span>
        </Link>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8">
          <h1 className="text-[24px] font-semibold text-white mb-1">Welcome back</h1>
          <p className="text-[14px] text-white/40 mb-8">Sign in to your Bloxr account</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-medium text-white/50">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[15px] text-white placeholder-white/20 outline-none focus:border-[#4F8EF7]/50 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-medium text-white/50">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[15px] text-white placeholder-white/20 outline-none focus:border-[#4F8EF7]/50 transition-colors"
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[13px] text-[#FF6B6B]"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 bg-white rounded-full py-[13px] text-black text-[15px] font-semibold transition-all duration-200 hover:shadow-[0_0_30px_rgba(79,142,247,0.15)] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-[14px] text-white/30 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-white/60 hover:text-white transition-colors">
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

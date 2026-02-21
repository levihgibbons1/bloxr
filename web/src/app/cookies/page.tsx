import type { Metadata } from "next";
import Cookie from "@/components/Cookie";

export const metadata: Metadata = {
  title: "Cookie Policy — Bloxr",
  description: "Bloxr Cookie Policy",
};

export default function CookiePage() {
  return <Cookie />;
}

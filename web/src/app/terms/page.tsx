import type { Metadata } from "next";
import Terms from "@/components/Terms";

export const metadata: Metadata = {
  title: "Terms of Service — Bloxr",
  description: "Bloxr Terms of Service",
};

export default function TermsPage() {
  return <Terms />;
}

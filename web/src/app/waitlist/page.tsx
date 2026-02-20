import type { Metadata } from "next";
import Waitlist from "@/components/Waitlist";

export const metadata: Metadata = {
  title: "Join the Waitlist - Bloxr",
  description: "Get early access to Bloxr — AI-powered Roblox development.",
};

export default function WaitlistPage() {
  return <Waitlist />;
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bloxr - AI Roblox Development",
  description: "Roblox development, reimagined through AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ backgroundColor: "#000" }}>
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=general-sans@200,300,400,500,600,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ backgroundColor: "#000", margin: 0, fontFamily: "'General Sans', 'Inter', ui-sans-serif, system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}

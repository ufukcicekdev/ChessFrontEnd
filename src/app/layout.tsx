import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import ChallengeNotification from "@/components/ChallengeNotification";
import { ChallengesProvider } from "@/context/ChallengesContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Chess0-0 — Play Chess Online", template: "%s | Chess0-0" },
  description: "Real-time chess platform. Play, spectate live games, join tournaments and climb the leaderboard.",
  keywords: ["chess", "online chess", "play chess", "chess tournament", "blitz chess"],
  openGraph: {
    title: "Chess0-0 — Play Chess Online",
    description: "Real-time chess platform. Play, spectate live games, join tournaments and climb the leaderboard.",
    url: "https://chess0-0.com",
    siteName: "Chess0-0",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chess0-0 — Play Chess Online",
    description: "Real-time chess platform. Play, spectate and compete.",
  },
  metadataBase: new URL("https://chess0-0.com"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <ChallengesProvider>
          <Navbar />
          <main>{children}</main>
          <ChallengeNotification />
        </ChallengesProvider>
      </body>
    </html>
  );
}

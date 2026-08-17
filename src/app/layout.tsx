import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import ChallengeNotification from "@/components/ChallengeNotification";
import FcmProvider from "@/components/FcmProvider";
import { ChallengesProvider } from "@/context/ChallengesContext";

const inter = Inter({ subsets: ["latin"] });
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: { default: "fianchess — Play Chess Online", template: "%s | fianchess" },
  description: "Real-time chess platform. Play, spectate live games, join tournaments and climb the leaderboard.",
  keywords: ["chess", "online chess", "play chess", "chess tournament", "blitz chess", "fianchess"],
  openGraph: {
    title: "fianchess — Play Chess Online",
    description: "Real-time chess platform. Play, spectate live games, join tournaments and climb the leaderboard.",
    url: "https://fianchess.com",
    siteName: "fianchess",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "fianchess — Play Chess Online",
    description: "Real-time chess platform. Play, spectate and compete.",
  },
  metadataBase: new URL("https://fianchess.com"),
  applicationName: "fianchess",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "fianchess",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} ${playfair.variable}`}>
        <ChallengesProvider>
          <Navbar />
          <main>{children}</main>
          <ChallengeNotification />
          <FcmProvider />
        </ChallengesProvider>
      </body>
    </html>
  );
}

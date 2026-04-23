import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://chess0-0.com";
  const now = new Date();
  return [
    { url: base,                    lastModified: now, changeFrequency: "daily",   priority: 1   },
    { url: `${base}/play`,          lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${base}/leaderboard`,   lastModified: now, changeFrequency: "hourly",  priority: 0.8 },
    { url: `${base}/watch`,         lastModified: now, changeFrequency: "always",  priority: 0.7 },
    { url: `${base}/history`,       lastModified: now, changeFrequency: "hourly",  priority: 0.6 },
    { url: `${base}/auth/login`,    lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/auth/register`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];
}

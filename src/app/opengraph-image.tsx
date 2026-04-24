import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "chess0-0 · Real-time Chess Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a0a 0%, #111111 50%, #0d0d0d 100%)",
          fontFamily: "monospace",
          position: "relative",
        }}
      >
        {/* Grid pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 80,
              height: 80,
              background: "rgba(245,158,11,0.15)",
              border: "2px solid rgba(245,158,11,0.4)",
              borderRadius: 16,
              fontSize: 40,
            }}
          >
            ♔
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 80,
              height: 80,
              background: "rgba(180,120,0,0.1)",
              border: "2px solid rgba(180,120,0,0.3)",
              borderRadius: 16,
              fontSize: 40,
            }}
          >
            ♖
          </div>
        </div>

        {/* Title */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "16px" }}>
          <span style={{ fontSize: 64, fontWeight: 900, color: "#ffffff", letterSpacing: "-2px" }}>
            chess
          </span>
          <span
            style={{
              fontSize: 64,
              fontWeight: 900,
              color: "#f59e0b",
              letterSpacing: "-2px",
              fontFamily: "monospace",
            }}
          >
            0-0
          </span>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: 28,
            color: "rgba(156,163,175,1)",
            margin: 0,
            letterSpacing: "0.05em",
          }}
        >
          Castle your way to the top.
        </p>

        {/* Badge */}
        <div
          style={{
            marginTop: 40,
            display: "flex",
            gap: 16,
          }}
        >
          {["Real-time multiplayer", "Elo ratings", "Tournaments"].map((label) => (
            <div
              key={label}
              style={{
                padding: "8px 20px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 100,
                fontSize: 18,
                color: "rgba(209,213,219,1)",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}

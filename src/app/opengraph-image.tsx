import { ImageResponse } from "next/og";

export const alt = "Jontri: Done-for-you AI automation";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#0a0a12",
          backgroundImage:
            "radial-gradient(circle at 70% 30%, rgba(124,58,237,0.35), transparent 55%), radial-gradient(circle at 20% 80%, rgba(245,158,11,0.18), transparent 50%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 36, fontWeight: 700, opacity: 0.85 }}>Jontri</div>
        <div
          style={{
            marginTop: 24,
            fontSize: 76,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
          }}
        >
          Your Business. Automated.
        </div>
        <div style={{ marginTop: 28, fontSize: 32, color: "#c4c4d4", lineHeight: 1.4 }}>
          AI voice agents · Lead generation · Chatbots · SEO &amp; AI search
        </div>
      </div>
    ),
    size
  );
}

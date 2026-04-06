"use client";

import { useEffect } from "react";

export function ChatWidget() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/api/chatbot?client=jontri-consulting&color=%233B82F6&v=3";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      try {
        document.body.removeChild(script);
      } catch {
        // Script may already be removed
      }
    };
  }, []);

  return null;
}

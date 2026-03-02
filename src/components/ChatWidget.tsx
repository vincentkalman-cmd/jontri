"use client";

import { useEffect } from "react";

// Replace these with your actual Botpress bot credentials
// You can find these in your Botpress Cloud dashboard under "Integrations" > "Webchat"
const BOTPRESS_BOT_ID = "YOUR_BOT_ID";
const BOTPRESS_CLIENT_ID = "YOUR_CLIENT_ID";

export function ChatWidget() {
  useEffect(() => {
    // Skip loading if credentials haven't been configured yet
    if (BOTPRESS_BOT_ID === "YOUR_BOT_ID") {
      console.log(
        "Botpress ChatWidget: Set your BOTPRESS_BOT_ID and BOTPRESS_CLIENT_ID in src/components/ChatWidget.tsx"
      );
      return;
    }

    const injectScript = document.createElement("script");
    injectScript.src = "https://cdn.botpress.cloud/webchat/v2.3/inject.js";
    injectScript.async = true;
    document.body.appendChild(injectScript);

    const configScript = document.createElement("script");
    configScript.src = `https://files.bpcontent.cloud/${BOTPRESS_BOT_ID}/webchat/v2.3/config.js`;
    configScript.async = true;
    document.body.appendChild(configScript);

    return () => {
      document.body.removeChild(injectScript);
      document.body.removeChild(configScript);
    };
  }, []);

  return null;
}

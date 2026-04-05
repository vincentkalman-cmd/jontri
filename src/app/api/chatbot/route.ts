import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("client");
  const rawColor = request.nextUrl.searchParams.get("color") || "#3B82F6";
  const color = /^#[0-9A-Fa-f]{3,8}$/.test(rawColor) ? rawColor : "#3B82F6";
  const host = request.nextUrl.origin;

  // If ?frame=1, serve the iframe inner HTML
  if (request.nextUrl.searchParams.get("frame") === "1") {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  html, body { margin: 0; padding: 0; height: 100%; color-scheme: light; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    display: flex; flex-direction: column; background: #fff; color: #000;
  }
  .header {
    background: ${color}; color: #fff; padding: 16px 20px;
    font-size: 15px; font-weight: 600; display: flex;
    align-items: center; justify-content: space-between;
  }
  .header button {
    background: none; border: none; color: #fff; font-size: 20px;
    cursor: pointer; padding: 0; line-height: 1; opacity: 0.8;
  }
  .header button:hover { opacity: 1; }
  .messages {
    flex: 1; overflow-y: auto; padding: 16px; display: flex;
    flex-direction: column; gap: 12px; background: #f8f9fa;
  }
  .msg {
    max-width: 85%; padding: 10px 14px; border-radius: 12px;
    font-size: 14px; line-height: 1.5; word-wrap: break-word; color: #1a1a1a;
  }
  .msg.bot {
    background: #fff; align-self: flex-start;
    border: 1px solid #e5e7eb; border-bottom-left-radius: 4px;
  }
  .msg.user {
    background: ${color}; color: #fff; align-self: flex-end;
    border-bottom-right-radius: 4px;
  }
  .msg.typing { opacity: 0.6; font-style: italic; }
  .input-wrap {
    display: flex; padding: 12px; border-top: 1px solid #e5e7eb; background: #fff;
  }
  .chat-input {
    flex: 1; border: 1px solid #d1d5db; border-radius: 8px;
    padding: 10px 12px; font-size: 14px; outline: none;
    font-family: inherit; resize: none; color: #000; background: #fff;
  }
  .chat-input::placeholder { color: #9ca3af; }
  .chat-input:focus { border-color: ${color}; }
  .send-btn {
    margin-left: 8px; background: ${color}; color: #fff;
    border: none; border-radius: 8px; padding: 10px 16px;
    font-size: 14px; font-weight: 600; cursor: pointer;
  }
  .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .send-btn:hover:not(:disabled) { filter: brightness(1.1); }
  .msg a { color: ${color}; text-decoration: underline; }
</style>
</head>
<body>
  <div class="header"><span>Chat with us</span><button onclick="parent.postMessage('jontri-close','*')">&times;</button></div>
  <div class="messages" id="msgs"></div>
  <div class="input-wrap">
    <input class="chat-input" id="input" placeholder="Type a message..." />
    <button class="send-btn" id="sendBtn">Send</button>
  </div>
<script>
var SLUG = ${JSON.stringify(slug || "")};
var API = ${JSON.stringify(host + "/api/chat")};
var chatHistory = [];
var msgs = document.getElementById("msgs");
var input = document.getElementById("input");
var sendBtn = document.getElementById("sendBtn");

function addMsg(role, text) {
  var div = document.createElement("div");
  div.className = "msg " + role;
  div.innerHTML = text.replace(/(https?:\\/\\/[^\\s]+)/g, '<a href="$1" target="_blank">$1</a>');
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

addMsg("bot", "Hi there! 👋 How can I help you today?");

async function send() {
  var text = input.value.trim();
  if (!text) return;
  input.value = "";
  addMsg("user", text);
  chatHistory.push({ role: "user", content: text });
  var typing = addMsg("bot", "Typing...");
  typing.classList.add("typing");
  sendBtn.disabled = true;
  try {
    var res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: SLUG, message: text, history: chatHistory })
    });
    var data = await res.json();
    typing.remove();
    if (data.reply) {
      addMsg("bot", data.reply);
      chatHistory.push({ role: "assistant", content: data.reply });
    } else {
      addMsg("bot", "Sorry, I couldn't process that. Please try again.");
    }
  } catch(e) {
    typing.remove();
    addMsg("bot", "Connection error. Please try again.");
  }
  sendBtn.disabled = false;
  input.focus();
}

sendBtn.addEventListener("click", send);
input.addEventListener("keydown", function(e) {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
});
</script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "no-cache",
      },
    });
  }

  // Main script: just creates a bubble + iframe
  const js = `
(function() {
  var COLOR = ${JSON.stringify(color)};
  var FRAME_URL = ${JSON.stringify(host + "/api/chatbot?client=" + slug + "&color=" + encodeURIComponent(color) + "&frame=1")};

  var style = document.createElement("style");
  style.textContent = \`
    #jontri-bubble {
      position: fixed; bottom: 24px; right: 24px; z-index: 99999;
      width: 60px; height: 60px; border-radius: 50%;
      background: \${COLOR}; color: #fff; border: none; cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25); display: flex;
      align-items: center; justify-content: center; font-size: 28px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    #jontri-bubble:hover { transform: scale(1.1); box-shadow: 0 6px 28px rgba(0,0,0,0.35); }
    #jontri-frame {
      position: fixed; bottom: 96px; right: 24px; z-index: 99999;
      width: 380px; max-width: calc(100vw - 32px); height: 520px; max-height: calc(100vh - 120px);
      border: none; border-radius: 16px; overflow: hidden;
      box-shadow: 0 8px 40px rgba(0,0,0,0.2); display: none;
    }
    #jontri-frame.open { display: block; }
  \`;
  document.head.appendChild(style);

  var bubble = document.createElement("button");
  bubble.id = "jontri-bubble";
  bubble.innerHTML = "💬";
  document.body.appendChild(bubble);

  var frame = document.createElement("iframe");
  frame.id = "jontri-frame";
  frame.src = FRAME_URL;
  document.body.appendChild(frame);

  var isOpen = false;
  function toggle() {
    isOpen = !isOpen;
    frame.classList.toggle("open", isOpen);
    bubble.innerHTML = isOpen ? "✕" : "💬";
  }

  bubble.addEventListener("click", toggle);
  window.addEventListener("message", function(e) {
    if (e.data === "jontri-close") toggle();
  });
})();
`;

  return new NextResponse(js, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

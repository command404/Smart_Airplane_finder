/* chat_widget.js - floating Gemini chat button (bottom-right).
   Served by chatbot.py at /chat-widget.js and loaded by map.html and 3d.html. */
(function () {
  if (window.__flightChat) return;
  window.__flightChat = true;

  const host = document.createElement("div");
  host.style.cssText = "position:fixed;right:20px;bottom:20px;z-index:2147483000;";
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = `
  <style>
    *{box-sizing:border-box;font-family:Arial,sans-serif}
    .fab{width:56px;height:56px;border-radius:50%;border:none;background:#2563eb;color:#fff;font-size:26px;cursor:pointer;box-shadow:0 6px 20px #0008}
    .fab:hover{background:#1d4ed8}
    .box{display:none;position:absolute;right:0;bottom:68px;width:360px;max-width:calc(100vw - 30px);height:480px;max-height:calc(100vh - 110px);
      background:#0a1120;border:1px solid #273449;border-radius:14px;box-shadow:0 10px 40px #000a;flex-direction:column;overflow:hidden;color:#fff}
    .box.open{display:flex}
    .head{padding:12px 14px;background:#111827;border-bottom:1px solid #273449;display:flex;justify-content:space-between;align-items:center;font-weight:bold;font-size:14px}
    .head button{background:none;border:none;color:#94a3b8;font-size:18px;cursor:pointer}
    .msgs{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px}
    .m{max-width:88%;padding:9px 11px;border-radius:10px;font-size:13px;line-height:1.5;word-wrap:break-word}
    .u{align-self:flex-end;background:#2563eb}
    .a{align-self:flex-start;background:#1e293b}
    .e{align-self:flex-start;background:#7f1d1d}
    .m div{min-height:1em}
    .chips{display:flex;flex-wrap:wrap;gap:6px}
    .chip{background:#111827;border:1px solid #334155;color:#cbd5e1;border-radius:14px;padding:5px 10px;font-size:11px;cursor:pointer}
    .row{display:flex;gap:6px;padding:10px;border-top:1px solid #273449}
    input{flex:1;padding:10px;border:1px solid #334155;border-radius:8px;background:#020617;color:#fff;font-size:13px;outline:none}
    input:focus{border-color:#38bdf8}
    .send{padding:0 14px;border:none;border-radius:8px;background:#2563eb;color:#fff;font-weight:bold;cursor:pointer}
    .send:disabled{opacity:.5;cursor:default}
  </style>
  <div class="box" id="box">
    <div class="head"><span>✈ Flight Radar Assistant</span><button id="x" title="Close">×</button></div>
    <div class="msgs" id="msgs"></div>
    <div class="row"><input id="in" placeholder="Ask about flights..." autocomplete="off"><button class="send" id="go">Send</button></div>
  </div>
  <button class="fab" id="fab" title="Ask the flight assistant">💬</button>`;
  document.body.appendChild(host);

  const $ = (id) => root.getElementById(id);
  const box = $("box"), msgs = $("msgs"), input = $("in"), go = $("go");
  const history = [];

  function airport() {
    try { if (typeof currentAirportCode !== "undefined") return currentAirportCode; } catch (e) {}
    const s = document.getElementById("airportSelect");
    return s ? s.value : "LHR";
  }

  // Safe rendering: text only, with **bold** and line breaks.
  function render(el, text) {
    text.split("\n").forEach((line) => {
      const d = document.createElement("div");
      line.split(/\*\*(.+?)\*\*/g).forEach((part, i) => {
        if (i % 2) { const b = document.createElement("strong"); b.textContent = part; d.appendChild(b); }
        else d.appendChild(document.createTextNode(part));
      });
      el.appendChild(d);
    });
  }

  function add(cls, text) {
    const m = document.createElement("div");
    m.className = "m " + cls;
    render(m, text);
    msgs.appendChild(m);
    msgs.scrollTop = msgs.scrollHeight;
    return m;
  }

  function chips() {
    const c = document.createElement("div");
    c.className = "chips";
    ["What's the highest plane right now?", "How many planes are descending?", "Where is BAW186 going?", "Busiest airline in the logs?"]
      .forEach((q) => {
        const b = document.createElement("button");
        b.className = "chip"; b.textContent = q;
        b.onclick = () => { c.remove(); send(q); };
        c.appendChild(b);
      });
    msgs.appendChild(c);
  }

  async function send(text) {
    text = (text || input.value).trim();
    if (!text || go.disabled) return;
    input.value = "";
    add("u", text);
    history.push({ role: "user", content: text });
    go.disabled = true;
    const wait = add("a", "Thinking...");
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, airport: airport() }),
      });
      const data = await r.json().catch(() => ({}));
      wait.remove();
      if (!r.ok || data.error) { add("e", data.error || "Chat failed (HTTP " + r.status + ")."); history.pop(); }
      else { add("a", data.answer); history.push({ role: "assistant", content: data.answer }); }
    } catch (err) {
      wait.remove(); add("e", "Could not reach the server."); history.pop();
    }
    go.disabled = false;
    input.focus();
  }

  $("fab").onclick = () => {
    box.classList.toggle("open");
    if (box.classList.contains("open")) {
      if (!msgs.children.length) { add("a", "Hi! Ask me about live flights, the logged history, routes or airport boards."); chips(); }
      input.focus();
    }
  };
  $("x").onclick = () => box.classList.remove("open");
  go.onclick = () => send();
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });
})();

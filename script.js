// ENDROID AI — GEMINI + WIKIPEDIA + STRONG DECISION LOGIC + WEATHER
// Keep keys.txt in root — never edit this file manually

let API_KEYS = [];
let currentKey = 0;
let failedKeys = new Set();
let chatHistory = [];

const MODEL_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const SYSTEM_PROMPT = `You are Endroid AI — an intelligent, friendly assistant powered by Gemini.
Use the given Wikipedia context as the main truth source.
If context is empty, respond from your own knowledge.
Do NOT use Wikipedia for simple greetings like "hi" or "hello".

Additionally, handle weather queries smartly:
- If the user is asking for local weather, respond with live data from Open-Meteo (use geolocation if allowed or city if mentioned).
- If the user is asking how you know the weather, or where the weather data comes from, reply with a short explanation:
  "I get live weather data from the Open-Meteo service. 
   If you allow location access, I use your device's geolocation (only in your browser) to fetch local weather. 
   No API key is required. You can also ask 'weather in <city>' to get city weather."
- Always check if the message is about weather first.
- Only fetch Wikipedia data if the user’s message is about general knowledge, definitions, biographies, history, or similar factual information.
- For casual chat or greetings, answer naturally without external lookups.`;

// ---------------- LOAD KEYS ----------------
fetch("keys.txt?t=" + Date.now())
  .then(r => r.text())
  .then(text => {
    API_KEYS = text.split(/\r?\n/).map(k => k.trim()).filter(k => k.startsWith("AIzaSy"));
    console.log(`✅ Loaded ${API_KEYS.length} Gemini keys`);
  })
  .catch(() => {
    API_KEYS = [];
    console.error("⚠️ Failed to load keys.txt");
  });

// ---------------- ROTATION ----------------
function getNextKey() {
  if (API_KEYS.length === 0) return "no-key";
  let attempts = 0;
  while (failedKeys.has(currentKey) && attempts < API_KEYS.length) {
    currentKey = (currentKey + 1) % API_KEYS.length;
    attempts++;
  }
  const key = API_KEYS[currentKey % API_KEYS.length];
  currentKey = (currentKey + 1) % API_KEYS.length;
  return key;
}

// ---------------- WIKIPEDIA ----------------
async function wikipediaSearch(query) {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*`;
    const res = await fetch(url);
    const data = await res.json();
    const results = (data.query && data.query.search) ? data.query.search.slice(0, 5) : [];
    let out = [];
    for (let r of results) {
      try {
        const page = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&format=json&pageids=${r.pageid}&origin=*`);
        const pdata = await page.json();
        const txt = pdata.query.pages[r.pageid].extract || "";
        out.push(`📘 ${r.title}\n${txt}`);
      } catch (e) {}
    }
    return out.length ? out.join("\n\n") : "No Wikipedia data found.";
  } catch (e) {
    console.warn("Wikipedia fetch failed:", e);
    return "No Wikipedia data available (fetch failed).";
  }
}

// ---------------- WEATHER ----------------
async function getWeather(city = null) {
  return new Promise((resolve, reject) => {
    const fetchWeather = (lat, lon) => {
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
        .then(r => r.json())
        .then(data => {
          if (!data || !data.current_weather) return resolve("Weather data not available.");
          const cw = data.current_weather;
          resolve(`🌤 Current temperature: ${cw.temperature}°C, wind speed: ${cw.windspeed} km/h, weather code: ${cw.weathercode}`);
        })
        .catch(() => resolve("Failed to fetch weather."));
    };

    if (city) {
      // simple geocoding using Open-Meteo Geo API
      fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`)
        .then(r => r.json())
        .then(data => {
          if (data.results && data.results.length) {
            const loc = data.results[0];
            fetchWeather(loc.latitude, loc.longitude);
          } else {
            resolve(`City "${city}" not found.`);
          }
        }).catch(() => resolve("Failed to fetch city location."));
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        err => resolve("Location access denied or unavailable.")
      );
    } else {
      resolve("Geolocation not supported in this browser.");
    }
  });
}

// ---------------- SMART DECISION LOGIC ----------------
function shouldUseWikipedia(message) {
  if (!message || typeof message !== "string") return false;
  const m = message.trim();
  if (m.length === 0) return false;

  const lower = m.toLowerCase();
  const casual = /^(hi|hello|hey|ok|okay|thanks|thank you|please|yes|no|sure|man|hmm|wow|lol|haha|huh|alright|cool|good|fine|great|awesome|bye|goodbye|yo|sup)$/i;
  if (casual.test(lower)) return false;

  if (m.length <= 4 && !/[?]/.test(m)) return false;

  const strongKeywords = [
    "who is", "what is", "what's", "define", "definition", "wiki", "wikipedia",
    "search", "latest", "news", "released", "release date", "when was", "when did",
    "biography", "born", "age of", "population", "capital of", "how to", "how do i",
    "steps to", "recipe", "ingredients", "stats", "statistics", "convert", "meaning of"
  ];
  for (const k of strongKeywords) if (lower.includes(k)) return true;

  if (/^(who|what|when|where|why|how)\b/i.test(lower)) return true;
  if (/\?/.test(lower)) return true;
  if (m.length >= 60) return true;

  const words = m.split(/\s+/).filter(Boolean);
  if (words.length >= 4) {
    const stopwords = new Set(["the","a","an","in","on","at","for","and","or","of","to","is","are","was","were","be","I","you","it","this","that"]);
    let contentWords = 0;
    for (const w of words) if (!stopwords.has(w.toLowerCase())) contentWords++;
    if (contentWords >= Math.max(1, Math.floor(words.length / 2))) return true;
  }

  return false;
}

// ---------------- GEMINI ----------------
async function geminiReply(prompt, wikiContext) {
  const context = wikiContext ? `Wikipedia context:\n${wikiContext}` : "";
  const body = {
    contents: [
      { role: "user", parts: [{ text: SYSTEM_PROMPT + (context ? "\n\n" + context : "") + "\n\nUser: " + prompt }] }
    ]
  };

  const totalKeys = API_KEYS.length || 1;
  for (let attempt = 0; attempt < totalKeys; attempt++) {
    const key = getNextKey();
    try {
      const res = await fetch(`${MODEL_URL}?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const errText = await res.text();
        if (res.status === 429 || /quota|exhausted/i.test(errText)) {
          failedKeys.add((currentKey - 1 + API_KEYS.length) % API_KEYS.length);
        }
        continue;
      }
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (e) {
      failedKeys.add((currentKey - 1 + API_KEYS.length) % API_KEYS.length);
      continue;
    }
  }
  throw new Error("All keys failed or returned empty.");
}

// ---------------- RENDER / UI ----------------
function renderMarkdown(t) {
  if (!t && t !== "") return "";
  let out = t;
  out = out.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
  out = out.replace(/\*(.*?)\*/g, "<i>$1</i>");
  out = out.replace(/`([^`]+)`/g, '<code style="background:#e0e0e0;padding:2px 6px;border-radius:4px;">$1</code>');
  out = out.replace(/\n/g, "<br>");
  return out;
}

function addMessage(role, text, typing = false) {
  const container = document.getElementById("chatContainer");
  const welcomeEl = document.getElementById("welcomeMessage");
  if (welcomeEl) welcomeEl.remove();
  const div = document.createElement("div");
  div.className = `message ${role}`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;

  if (typing && role === "bot") {
    let i = 0;
    const plain = text;
    const speed = Math.max(6, Math.min(30, Math.floor(1200 / Math.max(1, Math.sqrt(plain.length)))));
    const interval = setInterval(() => {
      i++;
      div.innerHTML = renderMarkdown(plain.slice(0, i));
      container.scrollTop = container.scrollHeight;
      if (i >= plain.length) clearInterval(interval);
    }, speed);
  } else {
    div.innerHTML = renderMarkdown(text);
  }

  chatHistory.push({ role: role === "bot" ? "model" : role, text });
  saveChat();
}

function showRandomWelcome() {
  const container = document.getElementById("chatContainer");
  if (chatHistory.length === 0 && !document.getElementById("welcomeMessage")) {
    const msg = ["Hey there! What can I help with?","Ready when you are.","Ask me anything — I'm all ears.","What's on your mind?","Hello! How can I assist you today?"];
    const div = document.createElement("div");
    div.className = "welcome";
    div.id = "welcomeMessage";
    div.textContent = msg[Math.floor(Math.random() * msg.length)];
    container.appendChild(div);
  }
}

function saveChat() {
  try { localStorage.setItem("endroid_chat", JSON.stringify(chatHistory)); }
  catch (e) { console.warn("saveChat failed", e); }
}

function loadChat() {
  try {
    const saved = localStorage.getItem("endroid_chat");
    if (saved) {
      chatHistory = JSON.parse(saved);
      const container = document.getElementById("chatContainer");
      container.innerHTML = "";
      for (const m of chatHistory) {
        const role = (m.role === "model") ? "bot" : (m.role || "user");
        const div = document.createElement("div");
        div.className = `message ${role}`;
        div.innerHTML = renderMarkdown(m.text);
        container.appendChild(div);
      }
      container.scrollTop = container.scrollHeight;
    }
  } catch (e) { console.warn("loadChat failed", e); }
}

function clearHistory() {
  if (confirm("Clear chat history?")) {
    chatHistory = [];
    saveChat();
    const container = document.getElementById("chatContainer");
    container.innerHTML = '<div class="welcome" id="welcomeMessage"></div>';
    showRandomWelcome();
  }
}

// ---------------- SEND MESSAGE ----------------
async function sendMessage() {
  const input = document.getElementById("messageInput");
  const message = input.value.trim();
  if (!message) return;
  const welcomeEl = document.getElementById("welcomeMessage");
  if (welcomeEl) welcomeEl.remove();
  addMessage("user", message);
  input.value = "";
  const sendBtn = document.getElementById("sendBtn");
  if (sendBtn) sendBtn.disabled = true;

  try {
    // ---------------- GEMINI FIRST ----------------
    addMessage("system", "");
    let wiki = shouldUseWikipedia(message) ? await wikipediaSearch(message) : "";

    let reply = await geminiReply(message, wiki);

    // ---------------- WEATHER LOGIC ----------------
    // If Gemini mentions "fetch local weather" or "Open-Meteo", trigger actual weather fetch
    const weatherKeywords = /local weather|open-meteo|weather in/i;
    if (weatherKeywords.test(reply)) {
      // extract city if mentioned
      const cityMatch = message.match(/weather in ([a-zA-Z\s]+)/i);
      const city = cityMatch ? cityMatch[1].trim() : null;
      const weatherText = await getWeather(city);
      reply = weatherText;
    }

    addMessage("bot", reply, true);
    addMessage("system", "");

  } catch (e) {
    console.error("sendMessage error:", e);
    addMessage("bot", "⚠️ Failed to get a response. Try again later.", true);
  } finally {
    if (sendBtn) sendBtn.disabled = false;
  }
}

// ---------------- EVENTS ----------------
document.getElementById("messageInput").addEventListener("keypress", e => {
  if (e.key === "Enter") sendMessage();
});

window.addEventListener("load", () => {
  loadChat();
  showRandomWelcome();
  const input = document.getElementById("messageInput");
  if (input) input.focus();
});

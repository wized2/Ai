// ENDROID AI — DEEPSEEK (OPENROUTER) + WIKIPEDIA + OPEN-METEO WEATHER + CHAT MEMORY (FINAL VERSION)

// Configuration
const OPENROUTER_API_KEY = "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";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

let chatHistory = [];
const MAX_HISTORY = 8; // Remember last 8 messages for context

const SYSTEM_PROMPT = `You are Endroid AI — an intelligent, friendly assistant powered by DeepSeek.
You have access to Wikipedia for factual information and can fetch live weather data.
You have a great memory and always remember the conversation context from the last ${MAX_HISTORY} messages.

IMPORTANT INSTRUCTIONS:
1. Use Wikipedia context when provided as your primary source for factual information
2. If Wikipedia context is empty, respond from your own knowledge
3. Always maintain conversation continuity by referencing previous messages when relevant
4. When the user's intent requires *real-time local weather*, output the exact token [GET_WEATHER] at the point where weather data should appear
5. Do NOT output [GET_WEATHER] for source/explanation questions
6. Do NOT invent or hallucinate locations
7. Weather codes will be replaced with emojis/descriptions client-side
8. Be concise, helpful, and friendly in all responses`;

// ---------------- CHAT MEMORY MANAGEMENT ----------------
function getRecentContext() {
    // Get last MAX_HISTORY messages for context
    const recent = chatHistory.slice(-MAX_HISTORY);
    return recent.map(msg => ({
        role: msg.role,
        content: msg.text
    }));
}

function addToHistory(role, text) {
    chatHistory.push({ role, text });
    // Keep only last MAX_HISTORY messages for context (but store all in localStorage)
    if (chatHistory.length > MAX_HISTORY * 2) {
        chatHistory = chatHistory.slice(-MAX_HISTORY * 2);
    }
    saveChat();
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
            } catch (e) {
                // ignore individual page fetch errors
            }
        }
        return out.length ? out.join("\n\n") : "No Wikipedia data found.";
    } catch (e) {
        console.warn("Wikipedia fetch failed:", e);
        return "No Wikipedia data available (fetch failed).";
    }
}

// ---------------- HELPER: parse ISO times to index ----------------
function findHourIndex(hourlyTimes, targetIso) {
    const idx = hourlyTimes.indexOf(targetIso);
    if (idx !== -1) return idx;
    // fallback: find nearest by timestamp
    const targetT = Date.parse(targetIso);
    let best = 0;
    let bestDiff = Infinity;
    for (let i = 0; i < hourlyTimes.length; i++) {
        const t = Date.parse(hourlyTimes[i]);
        const d = Math.abs(t - targetT);
        if (d < bestDiff) {
            bestDiff = d;
            best = i;
        }
    }
    return best;
}

// ---------------- WEATHER (Open-Meteo) ----------------
async function getDetailedWeather(lat, lon) {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current_weather=true&hourly=relativehumidity_2m,apparent_temperature,precipitation&timezone=auto`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Weather fetch failed");
        const data = await res.json();

        const cw = data.current_weather;
        const hourly = data.hourly || {};
        const times = hourly.time || [];

        if (!cw) return "⚠️ Weather data unavailable.";

        const idx = findHourIndex(times, cw.time);
        const temp = (cw.temperature !== undefined) ? `${cw.temperature}°C` : "N/A";
        const wind = (cw.windspeed !== undefined) ? `${cw.windspeed} km/h` : "N/A";
        const code = (cw.weathercode !== undefined) ? `${cw.weathercode}` : "N/A";

        const feelsLike = (hourly.apparent_temperature && hourly.apparent_temperature[idx] !== undefined) ? `${hourly.apparent_temperature[idx]}°C` : "N/A";
        const humidity = (hourly.relativehumidity_2m && hourly.relativehumidity_2m[idx] !== undefined) ? `${hourly.relativehumidity_2m[idx]}%` : "N/A";
        const precip = (hourly.precipitation && hourly.precipitation[idx] !== undefined) ? `${hourly.precipitation[idx]} mm` : "N/A";

        // Weather code mapping
        const wc = Number(cw.weathercode || -1);
        const codeMap = {
            0: "☀️ Clear",
            1: "🌤 Mostly clear",
            2: "⛅ Partly cloudy",
            3: "☁️ Overcast",
            45: "🌫 Fog",
            48: "🌫 Depositing rime fog",
            51: "🌦 Light drizzle",
            53: "🌦 Moderate drizzle",
            55: "🌧 Dense drizzle",
            56: "🌧 Freezing drizzle",
            57: "🌧 Freezing drizzle (dense)",
            61: "🌧 Rain",
            63: "🌧 Moderate rain",
            65: "⛈ Heavy rain",
            66: "❄️ Freezing rain",
            67: "❄️ Heavy freezing rain",
            71: "❄️ Snow",
            73: "❄️ Moderate snow",
            75: "❄️ Heavy snow",
            80: "🌧 Rain showers",
            81: "🌧 Moderate showers",
            82: "⛈ Violent showers",
            95: "⛈ Thunderstorm",
            96: "⛈ Thunderstorm with hail",
            99: "⛈ Severe thunderstorm with hail"
        };
        const wcText = codeMap[wc] || `Code ${code}`;

        const narrative =
`Here's the live weather for your location (from Open‑Meteo):
${wcText}
• Temperature: ${temp} (feels like ${feelsLike})
• Humidity: ${humidity}
• Precipitation (hour): ${precip}
• Wind: ${wind}
(Weather code: ${code})`;

        return narrative;
    } catch (e) {
        console.warn("getDetailedWeather error:", e);
        return "⚠️ Could not fetch weather data.";
    }
}

async function geocodeCity(city) {
    try {
        const g = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
        if (!g.ok) throw new Error("Geocode failed");
        const gd = await g.json();
        if (gd && gd.results && gd.results.length) {
            const r = gd.results[0];
            return { lat: r.latitude, lon: r.longitude, name: r.name, country: r.country };
        }
        return null;
    } catch (e) {
        console.warn("geocodeCity error:", e);
        return null;
    }
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
    for (const k of strongKeywords) {
        if (lower.includes(k)) return true;
    }

    const questionStart = /^(who|what|when|where|why|how)\b/i;
    if (questionStart.test(lower)) return true;

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

// ---------------- DEEPSEEK OPENROUTER API ----------------
async function deepseekReply(prompt, wikiContext) {
    try {
        // Get recent conversation context
        const recentContext = getRecentContext();
        
        // Prepare messages array with system prompt first
        const messages = [
            { role: "system", content: SYSTEM_PROMPT }
        ];
        
        // Add Wikipedia context if available
        if (wikiContext && wikiContext !== "No Wikipedia data found." && wikiContext !== "No Wikipedia data available (fetch failed).") {
            messages.push({ 
                role: "system", 
                content: `Wikipedia Context:\n${wikiContext}\n\nUse this information to provide accurate answers.` 
            });
        }
        
        // Add conversation history (last 8 messages)
        messages.push(...recentContext);
        
        // Add current user message
        messages.push({ role: "user", content: prompt });

        const response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Endroid AI - DeepSeek'
            },
            body: JSON.stringify({
                model: "deepseek/deepseek-chat", // You can change to "deepseek/deepseek-coder" for coding
                messages: messages,
                max_tokens: 2000,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('DeepSeek API error:', response.status, errorText);
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.choices && data.choices.length > 0) {
            return data.choices[0].message.content;
        } else {
            throw new Error("No response from DeepSeek");
        }
    } catch (error) {
        console.error('DeepSeek call failed:', error);
        throw error;
    }
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
    // remove welcome if present and chat not empty
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

    // Save to history
    addToHistory(role === "bot" ? "assistant" : "user", text);
}

function showRandomWelcome() {
    const container = document.getElementById("chatContainer");
    if (chatHistory.length === 0 && !document.getElementById("welcomeMessage")) {
        const msg = [
            "Hey there! I'm Endroid AI powered by DeepSeek. What can I help with?",
            "Ready when you are! I have access to Wikipedia and live weather data.",
            "Ask me anything — I remember our last 8 conversations!",
            "What's on your mind? I can fetch real-time info when needed.",
            "Hello! I'm your AI assistant with memory and real-time data access."
        ][Math.floor(Math.random() * 5)];
        const div = document.createElement("div");
        div.className = "welcome";
        div.id = "welcomeMessage";
        div.textContent = msg;
        container.appendChild(div);
    }
}

// ---------------- SAVE / LOAD CHAT ----------------
function saveChat() {
    try {
        localStorage.setItem("endroid_chat", JSON.stringify(chatHistory));
    } catch (e) {
        console.warn("saveChat failed", e);
    }
}

function loadChat() {
    try {
        const saved = localStorage.getItem("endroid_chat");
        if (saved) {
            chatHistory = JSON.parse(saved);
            const container = document.getElementById("chatContainer");
            container.innerHTML = "";
            for (const m of chatHistory) {
                const role = (m.role === "assistant") ? "bot" : (m.role || "user");
                const div = document.createElement("div");
                div.className = `message ${role}`;
                div.innerHTML = renderMarkdown(m.text);
                container.appendChild(div);
            }
            container.scrollTop = container.scrollHeight;
        }
    } catch (e) {
        console.warn("loadChat failed", e);
    }
}

// ---------------- CLEAR HISTORY ----------------
function clearHistory() {
    if (confirm("Clear chat history?")) {
        chatHistory = [];
        saveChat();
        const container = document.getElementById("chatContainer");
        container.innerHTML = '<div class="welcome" id="welcomeMessage"></div>';
        showRandomWelcome();
    }
}

// ---------------- SEND MESSAGE (MAIN) ----------------
async function sendMessage() {
    const input = document.getElementById("messageInput");
    const message = input.value.trim();
    if (!message) return;

    // remove welcome if present
    const welcomeEl = document.getElementById("welcomeMessage");
    if (welcomeEl) welcomeEl.remove();

    addMessage("user", message);
    input.value = "";
    const sendBtn = document.getElementById("sendBtn");
    if (sendBtn) sendBtn.disabled = true;

    try {
        // Decide whether to fetch Wikipedia
        const useWiki = shouldUseWikipedia(message);
        let wiki = "";
        if (useWiki) {
            addMessage("system", "Fetching latest information from Wikipedia...");
            wiki = await wikipediaSearch(message);
        }

        addMessage("system", "Thinking...");
        
        // Get response from DeepSeek
        let reply = await deepseekReply(message, wiki);

        // Check for weather token
        if (reply && reply.includes("[GET_WEATHER]")) {
            addMessage("system", "Fetching live weather data...");
            
            let weatherText = null;
            const cityMatch = message.match(/weather in\s+([a-zA-Z\u00C0-\u017F\s\-']+)/i);
            
            if (cityMatch && cityMatch[1]) {
                const city = cityMatch[1].trim();
                const geo = await geocodeCity(city);
                if (geo) {
                    weatherText = await getDetailedWeather(geo.lat, geo.lon);
                    weatherText = `Weather in ${geo.name}, ${geo.country}:\n` + weatherText;
                } else {
                    weatherText = `⚠️ Couldn't find weather data for "${city}".`;
                }
            } else {
                // Use browser geolocation
                if (!navigator.geolocation) {
                    weatherText = "⚠️ Geolocation not supported in this browser.";
                } else {
                    try {
                        const pos = await new Promise((resolve, reject) => {
                            navigator.geolocation.getCurrentPosition(resolve, reject, { 
                                enableHighAccuracy: false, 
                                maximumAge: 600000 
                            });
                        });
                        const lat = pos.coords.latitude;
                        const lon = pos.coords.longitude;
                        weatherText = await getDetailedWeather(lat, lon);
                    } catch (err) {
                        weatherText = "⚠️ Location permission denied or unavailable.";
                    }
                }
            }

            // Replace weather token with actual data
            reply = reply.split("[GET_WEATHER]").join(weatherText);
            addMessage("bot", reply, true);
            addMessage("system", "");
            if (sendBtn) sendBtn.disabled = false;
            return;
        }

        // Normal flow: no weather token
        addMessage("bot", reply, true);
        addMessage("system", "");

    } catch (e) {
        console.error("sendMessage error:", e);
        addMessage("bot", "⚠️ Failed to get a response. Please try again.", true);
        addMessage("system", "");
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

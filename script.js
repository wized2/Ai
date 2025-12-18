// ENDROID AI — DEEPSEEK (OPENROUTER) + WIKIPEDIA + OPEN-METEO WEATHER + CHAT MEMORY (FIXED VERSION)

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
    // Get last MAX_HISTORY messages for context, but skip system messages
    const recent = chatHistory.slice(-MAX_HISTORY * 2).filter(msg => 
        msg.role === "user" || msg.role === "assistant"
    );
    return recent.slice(-MAX_HISTORY);
}

function addToHistory(role, text) {
    // Only store user and assistant messages in context
    if (role === "user" || role === "assistant") {
        chatHistory.push({ role, text });
    }
    // Keep a larger buffer in localStorage but use less for context
    if (chatHistory.length > 50) {
        chatHistory = chatHistory.slice(-50);
    }
    saveChat();
}

// ---------------- WIKIPEDIA ----------------
async function wikipediaSearch(query) {
    try {
        const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*`;
        const res = await fetch(url);
        const data = await res.json();
        const results = (data.query && data.query.search) ? data.query.search.slice(0, 3) : []; // Reduced to 3 for speed
        let out = [];
        
        if (results.length === 0) return "No Wikipedia data found.";
        
        // Get just the first result for speed
        try {
            const page = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&format=json&pageids=${results[0].pageid}&origin=*`);
            const pdata = await page.json();
            const txt = pdata.query.pages[results[0].pageid]?.extract || "";
            if (txt) {
                // Truncate to 500 chars to save tokens
                out.push(`📘 ${results[0].title}\n${txt.substring(0, 500)}${txt.length > 500 ? '...' : ''}`);
            }
        } catch (e) {
            console.warn("Wikipedia page fetch failed:", e);
        }
        
        return out.length ? out.join("\n\n") : "No Wikipedia data found.";
    } catch (e) {
        console.warn("Wikipedia search failed:", e);
        return ""; // Return empty string instead of error message
    }
}

// ---------------- HELPER: parse ISO times to index ----------------
function findHourIndex(hourlyTimes, targetIso) {
    const idx = hourlyTimes.indexOf(targetIso);
    if (idx !== -1) return idx;
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
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,apparent_temperature,precipitation&timezone=auto`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Weather API failed: ${res.status}`);
        
        const data = await res.json();
        const cw = data.current_weather;
        const hourly = data.hourly || {};
        const times = hourly.time || [];

        if (!cw) return "⚠️ Weather data unavailable.";

        const idx = findHourIndex(times, cw.time);
        const temp = cw.temperature !== undefined ? `${Math.round(cw.temperature)}°C` : "N/A";
        const wind = cw.windspeed !== undefined ? `${Math.round(cw.windspeed)} km/h` : "N/A";
        const code = cw.weathercode !== undefined ? `${cw.weathercode}` : "N/A";

        const feelsLike = hourly.apparent_temperature?.[idx] !== undefined ? `${Math.round(hourly.apparent_temperature[idx])}°C` : temp;
        const humidity = hourly.relativehumidity_2m?.[idx] !== undefined ? `${hourly.relativehumidity_2m[idx]}%` : "N/A";
        const precip = hourly.precipitation?.[idx] !== undefined ? `${hourly.precipitation[idx]} mm` : "0 mm";

        // Weather code mapping
        const wc = Number(cw.weathercode || -1);
        const codeMap = {
            0: "☀️ Clear sky",
            1: "🌤 Mostly clear",
            2: "⛅ Partly cloudy",
            3: "☁️ Overcast",
            45: "🌫 Foggy",
            48: "🌫 Freezing fog",
            51: "🌦 Light drizzle",
            53: "🌦 Moderate drizzle",
            55: "🌧 Heavy drizzle",
            56: "🌧 Freezing drizzle",
            57: "🌧 Heavy freezing drizzle",
            61: "🌧 Light rain",
            63: "🌧 Moderate rain",
            65: "⛈ Heavy rain",
            66: "❄️ Freezing rain",
            67: "❄️ Heavy freezing rain",
            71: "❄️ Light snow",
            73: "❄️ Moderate snow",
            75: "❄️ Heavy snow",
            80: "🌧 Light showers",
            81: "🌧 Moderate showers",
            82: "⛈ Heavy showers",
            95: "⛈ Thunderstorm",
            96: "⛈ Thunderstorm with hail",
            99: "⛈ Severe thunderstorm"
        };
        const wcText = codeMap[wc] || `Weather code: ${code}`;

        return `🌤 **Live Weather Report**\n${wcText}\n• **Temperature**: ${temp} (Feels like ${feelsLike})\n• **Humidity**: ${humidity}\n• **Precipitation**: ${precip}\n• **Wind Speed**: ${wind}`;
    } catch (e) {
        console.warn("Weather fetch error:", e);
        return "⚠️ Could not fetch weather data at the moment.";
    }
}

async function geocodeCity(city) {
    try {
        const g = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
        if (!g.ok) throw new Error("Geocode failed");
        const gd = await g.json();
        if (gd?.results?.length) {
            const r = gd.results[0];
            return { lat: r.latitude, lon: r.longitude, name: r.name, country: r.country };
        }
        return null;
    } catch (e) {
        console.warn("Geocode error:", e);
        return null;
    }
}

// ---------------- SMART DECISION LOGIC ----------------
function shouldUseWikipedia(message) {
    if (!message || typeof message !== "string") return false;
    const m = message.trim();
    if (m.length === 0) return false;

    const lower = m.toLowerCase();
    
    // Skip casual greetings
    const casual = /^(hi|hello|hey|ok|okay|thanks|thank you|please|yes|no|sure|man|hmm|wow|lol|haha|huh|alright|cool|good|fine|great|awesome|bye|goodbye|yo|sup|whats up)$/i;
    if (casual.test(lower)) return false;

    // Quick check for very short messages
    if (m.length <= 3) return false;

    // Strong keywords that need Wikipedia
    const strongKeywords = [
        "who is", "what is", "what's", "define", "definition", "wiki", "wikipedia",
        "search", "latest", "news", "released", "release date", "when was", "when did",
        "biography", "born", "age of", "population", "capital of", "how to", "how do i",
        "steps to", "recipe", "ingredients", "stats", "statistics", "convert", "meaning of",
        "history of", "explain", "tell me about"
    ];
    
    for (const k of strongKeywords) {
        if (lower.includes(k)) return true;
    }

    // Question words
    const questionStart = /^(who|what|when|where|why|how)\b/i;
    if (questionStart.test(lower)) return true;

    // Has question mark
    if (/\?/.test(lower)) return true;

    return false;
}

// ---------------- DEEPSEEK OPENROUTER API (FIXED) ----------------
async function deepseekReply(prompt, wikiContext) {
    try {
        console.log("Calling DeepSeek API...");
        
        // Get conversation context
        const recentContext = getRecentContext();
        
        // Prepare messages array
        let messages = [];
        
        // Add system prompt
        messages.push({
            role: "system",
            content: SYSTEM_PROMPT
        });
        
        // Add Wikipedia context if available and not empty
        if (wikiContext && wikiContext.trim() && !wikiContext.includes("No Wikipedia data")) {
            messages.push({
                role: "system",
                content: `Additional information from Wikipedia:\n${wikiContext}\n\nUse this information to provide accurate answers when relevant.`
            });
        }
        
        // Add conversation history
        recentContext.forEach(msg => {
            messages.push({
                role: msg.role,
                content: msg.text
            });
        });
        
        // Add current user message
        messages.push({
            role: "user",
            content: prompt
        });
        
        console.log("Messages sent to API:", messages.length, "messages");
        
        const response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Endroid AI'
            },
            body: JSON.stringify({
                model: "deepseek/deepseek-chat",
                messages: messages,
                max_tokens: 1500,
                temperature: 0.7,
                stream: false
            })
        });
        
        console.log("API Response status:", response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', response.status, errorText);
            
            // Try to parse error for better message
            let errorMsg = `API Error: ${response.status}`;
            try {
                const errorJson = JSON.parse(errorText);
                errorMsg = errorJson.error?.message || errorText;
            } catch (e) {
                // Keep the default error message
            }
            
            throw new Error(errorMsg);
        }
        
        const data = await response.json();
        console.log("API Response data:", data);
        
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            return data.choices[0].message.content;
        } else if (data.error) {
            throw new Error(data.error.message || "API returned an error");
        } else {
            throw new Error("Unexpected API response format");
        }
        
    } catch (error) {
        console.error('DeepSeek API call failed:', error);
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
    
    // Remove welcome message if present
    const welcomeEl = document.getElementById("welcomeMessage");
    if (welcomeEl) welcomeEl.remove();

    const div = document.createElement("div");
    div.className = `message ${role}`;
    container.appendChild(div);
    
    // Scroll to bottom
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 10);

    if (typing && role === "bot") {
        let i = 0;
        const plain = text;
        const speed = Math.max(10, Math.min(40, Math.floor(1500 / Math.max(1, Math.sqrt(plain.length)))));
        
        div.innerHTML = renderMarkdown("");
        const interval = setInterval(() => {
            i++;
            div.innerHTML = renderMarkdown(plain.slice(0, i));
            
            // Scroll as we type
            container.scrollTop = container.scrollHeight;
            
            if (i >= plain.length) {
                clearInterval(interval);
                // Add to history after typing completes
                addToHistory("assistant", text);
            }
        }, speed);
    } else {
        div.innerHTML = renderMarkdown(text);
        // Add to history immediately for non-typing messages
        if (role === "user") {
            addToHistory("user", text);
        } else if (role === "bot") {
            addToHistory("assistant", text);
        }
    }
}

function showRandomWelcome() {
    const container = document.getElementById("chatContainer");
    if (chatHistory.length === 0 && !document.getElementById("welcomeMessage")) {
        const msg = [
            "Hello! I'm Endroid AI powered by DeepSeek. How can I assist you today?",
            "Hi there! I remember our conversations and can fetch real-time information. What would you like to know?",
            "Ready to help! I have access to Wikipedia and live weather data. Ask me anything!",
            "Welcome! I'm your AI assistant with conversation memory. What's on your mind?",
            "Hey! I can help with questions, provide information from Wikipedia, and give you weather updates!"
        ][Math.floor(Math.random() * 5)];
        
        const div = document.createElement("div");
        div.className = "welcome";
        div.id = "welcomeMessage";
        div.textContent = msg;
        container.appendChild(div);
        
        // Scroll to show welcome
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 100);
    }
}

// ---------------- SAVE / LOAD CHAT ----------------
function saveChat() {
    try {
        localStorage.setItem("endroid_chat", JSON.stringify(chatHistory));
    } catch (e) {
        console.warn("Failed to save chat:", e);
    }
}

function loadChat() {
    try {
        const saved = localStorage.getItem("endroid_chat");
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
                chatHistory = parsed;
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
        }
    } catch (e) {
        console.warn("Failed to load chat:", e);
        chatHistory = [];
    }
}

// ---------------- CLEAR HISTORY ----------------
function clearHistory() {
    if (confirm("Clear all chat history? This cannot be undone.")) {
        chatHistory = [];
        saveChat();
        const container = document.getElementById("chatContainer");
        container.innerHTML = '';
        showRandomWelcome();
    }
}

// ---------------- SEND MESSAGE (MAIN) ----------------
async function sendMessage() {
    const input = document.getElementById("messageInput");
    const message = input.value.trim();
    
    if (!message) return;
    
    // Clear input and disable button
    input.value = "";
    const sendBtn = document.getElementById("sendBtn");
    if (sendBtn) sendBtn.disabled = true;
    
    // Add user message
    addMessage("user", message);
    
    try {
        // Check if we need Wikipedia
        const useWiki = shouldUseWikipedia(message);
        let wiki = "";
        
        if (useWiki) {
            addMessage("system", "🔍 Searching Wikipedia...");
            wiki = await wikipediaSearch(message);
            console.log("Wikipedia result:", wiki ? "Found data" : "No data");
        }
        
        // Show thinking indicator
        addMessage("system", "🤔 Thinking...");
        
        // Get response from DeepSeek
        const reply = await deepseekReply(message, wiki);
        
        // Check for weather token
        if (reply && reply.includes("[GET_WEATHER]")) {
            addMessage("system", "🌤 Fetching weather data...");
            
            let weatherText = "⚠️ Could not fetch weather data.";
            const cityMatch = message.match(/weather (?:in|for)\s+([a-zA-Z\u00C0-\u017F\s\-']+)/i);
            
            if (cityMatch && cityMatch[1]) {
                const city = cityMatch[1].trim();
                const geo = await geocodeCity(city);
                if (geo) {
                    weatherText = await getDetailedWeather(geo.lat, geo.lon);
                } else {
                    weatherText = `⚠️ Could not find location: "${city}"`;
                }
            } else {
                // Try geolocation
                if (navigator.geolocation) {
                    try {
                        const pos = await new Promise((resolve, reject) => {
                            navigator.geolocation.getCurrentPosition(resolve, reject, {
                                enableHighAccuracy: false,
                                timeout: 10000,
                                maximumAge: 600000
                            });
                        });
                        weatherText = await getDetailedWeather(
                            pos.coords.latitude,
                            pos.coords.longitude
                        );
                    } catch (geoError) {
                        weatherText = "⚠️ Please enable location access or specify a city.";
                    }
                } else {
                    weatherText = "⚠️ Please specify a city (e.g., 'weather in London').";
                }
            }
            
            // Replace token with actual weather
            const finalReply = reply.replace("[GET_WEATHER]", weatherText);
            addMessage("bot", finalReply, true);
            
        } else {
            // No weather token, just show reply
            addMessage("bot", reply, true);
        }
        
    } catch (error) {
        console.error("Error in sendMessage:", error);
        
        // Show user-friendly error
        let errorMessage = "⚠️ Failed to get response. ";
        
        if (error.message.includes("401") || error.message.includes("unauthorized")) {
            errorMessage += "API key issue detected.";
        } else if (error.message.includes("429")) {
            errorMessage += "Too many requests. Please wait a moment.";
        } else if (error.message.includes("network")) {
            errorMessage += "Network error. Check your connection.";
        } else {
            errorMessage += "Please try again.";
        }
        
        addMessage("bot", errorMessage, true);
        
    } finally {
        // Re-enable send button
        if (sendBtn) sendBtn.disabled = false;
        
        // Focus input for next message
        setTimeout(() => {
            if (input) input.focus();
        }, 100);
    }
}

// ---------------- EVENT LISTENERS ----------------
document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById("messageInput");
    const sendBtn = document.getElementById("sendBtn");
    
    if (input) {
        input.addEventListener("keypress", function(e) {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        input.addEventListener("input", function() {
            // Enable/disable send button based on input
            if (sendBtn) {
                sendBtn.disabled = !this.value.trim();
            }
        });
        
        input.focus();
    }
    
    if (sendBtn) {
        sendBtn.addEventListener("click", sendMessage);
    }
    
    // Load chat and show welcome
    loadChat();
    showRandomWelcome();
});

// Optional: Add function to test API connection
async function testAPIConnection() {
    try {
        console.log("Testing API connection...");
        const testResponse = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin
            },
            body: JSON.stringify({
                model: "deepseek/deepseek-chat",
                messages: [{ role: "user", content: "Hello" }],
                max_tokens: 10
            })
        });
        
        console.log("API Test Status:", testResponse.status);
        return testResponse.ok;
    } catch (error) {
        console.error("API Test Failed:", error);
        return false;
    }
}

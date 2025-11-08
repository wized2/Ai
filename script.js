// ENDROID AI v4 — FINAL FIXED VERSION
// NO STUCK LOOP • LIVE INTERNET • PROFESSIONAL • UNSTOPPABLE

let API_KEYS = [];
let keysLoaded = false;

fetch('keys.txt?t=' + Date.now())
  .then(r => r.ok ? r.text() : Promise.reject('keys.txt not found'))
  .then(text => {
    API_KEYS = text.split('\n')
      .map(l => l.trim())
      .filter(l => l.startsWith('AIzaSy') && l.length > 30);
    keysLoaded = true;
    console.log(`ENDROID AI v4 LOADED ${API_KEYS.length} KEYS + LIVE INTERNET`);
    if (API_KEYS.length === 0) {
      document.body.innerHTML = `<div style="text-align:center;margin-top:100px;font-family:sans-serif;">
        <h2>keys.txt is empty!</h2><p>Add your Gemini keys (one per line)</p>
      </div>`;
    }
  })
  .catch(err => {
    console.warn('Using fallback key', err);
    API_KEYS = ["AIzaSyBdNZDgXeZmRuMOPdsAE0kVAgVyePnqD0U"];
    keysLoaded = true;
  });

// Wait for keys before allowing messages
let currentKeyIndex = 0;
function getNextKey() {
  if (API_KEYS.length === 0) return null;
  const key = API_KEYS[currentKeyIndex % API_KEYS.length];
  currentKeyIndex++;
  return key;
}

const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const SYSTEM_PROMPT = `You are Endroid AI — a fast, intelligent, and unlimited AI assistant with real-time internet access via Google Search.
You have perfect memory and never run out of quota.
Always be helpful, confident, and concise. Use markdown and cite sources when grounding is used.
Current date: November 08, 2025.`;

const welcomeMessages = [
  "Hello! I'm Endroid AI with live internet access. Ask me anything.",
  "Ready when you are — real-time answers, unlimited power.",
  "Endroid online: fast, smart, and always up to date.",
  "Live Google Search enabled. What would you like to know?",
  "Endroid AI v4 — unlimited and connected to the web."
];

let chatHistory = [];

window.onload = () => {
  loadChat();
  showRandomWelcome();
  document.getElementById('messageInput').focus();
};

function showRandomWelcome() {
  const msg = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
  document.getElementById('welcomeMessage').innerHTML = `<strong style="color:#0066ff;">${msg}</strong>`;
}

function renderMarkdown(text) {
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  text = text.replace(/`(.*?)`/g, '<code style="background:#f0f0f0;padding:2px 6px;border-radius:4px;">$1</code>');
  text = text.replace(/### (.*?)$/gm, '<h3 style="margin:12px 0 4px;color:#0066ff;">$1</h3>');
  text = text.replace(/\n/g, '<br>');
  return text;
}

function addMessage(role, text) {
  const container = document.getElementById('chatContainer');
  if (document.getElementById('welcomeMessage')) document.getElementById('welcomeMessage').remove();
  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.innerHTML = renderMarkdown(text);
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

async function sendMessage() {
  if (!keysLoaded || API_KEYS.length === 0) {
    addMessage('bot', "Keys not loaded yet. Please wait...");
    return;
  }

  const input = document.getElementById('messageInput');
  const message = input.value.trim();
  if (!message) return;

  addMessage('user', message);
  input.value = '';
  document.getElementById('sendBtn').disabled = true;
  hideError();

  const contents = chatHistory.length === 0
    ? [{ role: 'user', parts: [{ text: SYSTEM_PROMPT }] }, { role: 'user', parts: [{ text: message }] }]
    : [...chatHistory.map(m => ({ role: m.role, parts: [{ text: m.text }] })), { role: 'user', parts: [{ text: message }] }];

  const key = getNextKey();
  if (!key) {
    addMessage('bot', "No valid API key available.");
    document.getElementById('sendBtn').disabled = false;
    return;
  }

  try {
    const res = await fetch(`${API_URL}?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        tools: [{ googleSearchRetrieval: {} }],
        safetySettings: [{ category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }]
      })
    });

    if (!res.ok) {
      const err = await res.text();
      if (err.includes('429') || err.includes('RESOURCE_EXHAUSTED')) {
        addMessage('bot', "This key hit quota. Trying next one...");
        setTimeout(sendMessage, 1200);
        return;
      }
      throw new Error(err);
    }

    const data = await res.json();
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error("Empty response");
    }

    const reply = data.candidates[0].content.parts[0].text;
    let citationText = "";
    if (data.candidates[0].groundingMetadata?.groundingChunks?.length > 0) {
      citationText = "\n\nSources:\n";
      data.candidates[0].groundingMetadata.groundingChunks.forEach((chunk, i) => {
        const url = chunk.web?.uri || "Source";
        citationText += `${i+1}. [${url}](${url})\n`;
      });
    }

    const fullReply = reply + citationText;
    chatHistory.push({ role: 'user', text: message });
    chatHistory.push({ role: 'model', text: fullReply });
    saveChat();
    addMessage('bot', fullReply);

  } catch (err) {
    console.error("API Error:", err);
    addMessage('bot', "Network error. Retrying with next key...");
    setTimeout(sendMessage, 1500);
  } finally {
    document.getElementById('sendBtn').disabled = false;
    input.focus();
  }
}

function showError(msg) {
  const el = document.getElementById('error');
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 5000);
}
function hideError() { document.getElementById('error').classList.add('hidden'); }

function clearHistory() {
  if (confirm("Clear chat history?")) {
    chatHistory = [];
    saveChat();
    document.getElementById('chatContainer').innerHTML = '<div class="welcome" id="welcomeMessage"></div>';
    showRandomWelcome();
  }
}

function saveChat() { localStorage.setItem('endroid_chat', JSON.stringify(chatHistory)); }
function loadChat() {
  const saved = localStorage.getItem('endroid_chat');
  if (saved) {
    chatHistory = JSON.parse(saved);
    chatHistory.forEach(m => addMessage(m.role === 'model' ? 'bot' : 'user', m.text));
  }
}

document.getElementById('messageInput').addEventListener('keypress', e => {
  if (e.key === 'Enter') sendMessage();
});

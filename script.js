// ENDROID AI v3 — LIVE INTERNET + UNLIMITED KEYS + PURE ENGLISH
// Professional • Clean • Unstoppable

let API_KEYS = [];
fetch('keys.txt?t=' + Date.now())
  .then(r => r.ok ? r.text() : Promise.reject())
  .then(text => {
    API_KEYS = text.split('\n').map(l => l.trim()).filter(l => l.startsWith('AIzaSy') && l.length > 30);
    console.log(`ENDROID AI v3 READY — ${API_KEYS.length} keys + LIVE internet activated`);
  })
  .catch(() => {
    API_KEYS = ["AIzaSyBdNZDgXeZmRuMOPdsAE0kVAgVyePnqD0U"];
  });

let currentKeyIndex = 0;
let failedKeys = new Set();
function getNextKey() {
  while (failedKeys.has(currentKeyIndex % API_KEYS.length)) {
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  }
  const key = API_KEYS[currentKeyIndex % API_KEYS.length];
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  return key;
}
setInterval(() => location.reload(), 180000);

const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const SYSTEM_PROMPT = `You are Endroid AI — a fast, intelligent, and unlimited AI assistant with real-time internet access via Google Search.
You have perfect memory, beautiful design, and never run out of quota.
Always be helpful, confident, and concise. Use markdown and cite sources when grounding is used.
Current date: November 08, 2025.`;

const welcomeMessages = [
  "Hello! I'm Endroid AI with live internet access. Ask me anything.",
  "Ready when you are — real-time answers, unlimited power.",
  "Endroid online: fast, smart, and always up to date.",
  "Live Google Search enabled. What would you like to know?",
  "Endroid AI v3 — unlimited and connected to the web."
];

let chatHistory = [];
let retryCount = 0;
const MAX_RETRIES = 3;  // Prevent infinite loop

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
  const input = document.getElementById('messageInput');
  const message = input.value.trim();
  if (!message || API_KEYS.length === 0) return;

  addMessage('user', message);
  input.value = '';
  document.getElementById('sendBtn').disabled = true;
  hideError();

  try {
    let contents = [];
    if (chatHistory.length === 0) {
      contents.push({ role: 'user', parts: [{ text: SYSTEM_PROMPT }] });
    }
    chatHistory.forEach(m => contents.push({ role: m.role, parts: [{ text: m.text }] }));
    contents.push({ role: 'user', parts: [{ text: message }] });

    const key = getNextKey();
    const res = await fetch(`${API_URL}?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        tools: [{ googleSearchRetrieval: {} }],  // LIVE INTERNET
        safetySettings: [{ category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }]
      })
    });

    if (!res.ok) {
      const err = await res.text();
      if (err.includes('429') || err.includes('quota')) {
        failedKeys.add((currentKeyIndex - 1 + API_KEYS.length) % API_KEYS.length);
        console.warn(`Key failed — rotating (${failedKeys.size} dead)`);
        retryCount++;
        if (retryCount < MAX_RETRIES) {
          addMessage('bot', "Switching key — please wait...");
          setTimeout(sendMessage, 1000); // Delay retry
          return;
        } else {
          throw new Error("Max retries reached");
        }
      }
      throw new Error(err);
    }

    retryCount = 0; // Reset on success
    const data = await res.json();
    const reply = data.candidates[0].content.parts[0].text;

    let citationText = "";
    if (data.candidates[0].groundingMetadata?.groundingChunks) {
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
    console.error(err);
    retryCount = 0; // Reset on general error
    if (err.message.includes('Max retries')) {
      showError("All keys temporarily exhausted. Try later.");
      addMessage('bot', "All keys on cooldown — check quota or add more.");
    } else {
      showError("Network error. Retrying...");
      addMessage('bot', "Network issue — retrying in 1s...");
      setTimeout(sendMessage, 1000);
    }
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

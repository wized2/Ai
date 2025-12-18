// ENDROID AI — DEEPSEEK via OpenRouter (SIMPLIFIED WORKING VERSION)
// Using verified API method that works

const OPENROUTER_API_KEY = "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";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

let chatHistory = [];
const MAX_HISTORY = 8; // Remember last 8 messages

// Clear, simple system prompt
const SYSTEM_PROMPT = `You are Endroid AI, a helpful assistant powered by DeepSeek.
You remember conversation context and provide useful, accurate responses.
Be friendly and conversational in your tone.`;

// ---------------- CHAT MEMORY ----------------
function getRecentContext() {
    // Get last MAX_HISTORY messages (user + assistant only)
    const recent = chatHistory.filter(msg => 
        msg.role === "user" || msg.role === "assistant"
    ).slice(-MAX_HISTORY);
    return recent;
}

function addToHistory(role, text) {
    // Only store user and assistant messages for context
    if (role === "user" || role === "assistant") {
        chatHistory.push({ role, text });
        
        // Trim history if too long
        if (chatHistory.length > MAX_HISTORY * 2) {
            chatHistory = chatHistory.slice(-MAX_HISTORY * 2);
        }
        
        saveChat();
    }
}

// ---------------- DEEPSEEK API (VERIFIED WORKING METHOD) ----------------
async function getDeepSeekReply(userMessage) {
    try {
        // Get recent conversation context
        const recentContext = getRecentContext();
        
        // Build messages array exactly as OpenRouter expects
        const messages = [];
        
        // 1. Add system message first
        messages.push({
            role: "system",
            content: SYSTEM_PROMPT
        });
        
        // 2. Add conversation history (if any)
        recentContext.forEach(msg => {
            messages.push({
                role: msg.role,
                content: msg.text
            });
        });
        
        // 3. Add current user message
        messages.push({
            role: "user",
            content: userMessage
        });
        
        console.log("Sending to OpenRouter API:", {
            messageCount: messages.length,
            lastUserMessage: userMessage.substring(0, 50) + "..."
        });
        
        // Make API call using the EXACT format that worked in your test
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
                max_tokens: 1000,
                temperature: 0.7,
                stream: false
            })
        });
        
        console.log("API Response Status:", response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error("API Error Details:", {
                status: response.status,
                statusText: response.statusText,
                error: errorText
            });
            
            // Provide helpful error messages based on status code
            if (response.status === 401) {
                throw new Error("API key is invalid or expired. Please check your OpenRouter API key.");
            } else if (response.status === 429) {
                throw new Error("Too many requests. Please wait a moment and try again.");
            } else if (response.status === 400) {
                // Most likely: malformed request or invalid parameters
                try {
                    const errorData = JSON.parse(errorText);
                    throw new Error(`Bad request: ${errorData.error?.message || "Check your request format"}`);
                } catch {
                    throw new Error("Bad request format. The API didn't understand our request.");
                }
            } else {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }
        }
        
        const data = await response.json();
        console.log("API Response Data:", data);
        
        // Extract the response text
        if (data.choices && data.choices[0] && data.choices[0].message) {
            return data.choices[0].message.content;
        } else {
            console.error("Unexpected API response structure:", data);
            throw new Error("Received unexpected response format from API");
        }
        
    } catch (error) {
        console.error("DeepSeek API call failed:", error);
        throw error;
    }
}

// ---------------- UI FUNCTIONS ----------------
function renderMarkdown(text) {
    if (!text) return "";
    
    let html = text
        .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
        .replace(/\*(.*?)\*/g, "<i>$1</i>")
        .replace(/`([^`]+)`/g, '<code style="background:#e0e0e0;padding:2px 6px;border-radius:4px;">$1</code>')
        .replace(/\n/g, "<br>");
    
    return html;
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
        // Typing animation
        let i = 0;
        const plainText = text;
        const speed = 20; // ms per character
        
        div.innerHTML = "";
        const interval = setInterval(() => {
            if (i < plainText.length) {
                i++;
                div.innerHTML = renderMarkdown(plainText.substring(0, i));
                container.scrollTop = container.scrollHeight;
            } else {
                clearInterval(interval);
                // Add to history after typing completes
                addToHistory("assistant", text);
            }
        }, speed);
    } else {
        // Display immediately
        div.innerHTML = renderMarkdown(text);
        
        // Add to history
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
        const messages = [
            "Hello! I'm Endroid AI, powered by DeepSeek. How can I help you today?",
            "Hi there! I'm ready to chat. What's on your mind?",
            "Welcome! I remember our conversations and can help with various topics.",
            "Hey! I'm your AI assistant. Feel free to ask me anything!",
            "Ready to assist! I'm here to help with your questions and tasks."
        ];
        
        const msg = messages[Math.floor(Math.random() * messages.length)];
        const div = document.createElement("div");
        div.className = "welcome";
        div.id = "welcomeMessage";
        div.textContent = msg;
        container.appendChild(div);
        
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 100);
    }
}

// ---------------- CHAT STORAGE ----------------
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
                if (container) {
                    container.innerHTML = "";
                    
                    parsed.forEach(msg => {
                        const role = msg.role === "assistant" ? "bot" : msg.role;
                        const div = document.createElement("div");
                        div.className = `message ${role}`;
                        div.innerHTML = renderMarkdown(msg.text);
                        container.appendChild(div);
                    });
                    
                    container.scrollTop = container.scrollHeight;
                }
            }
        }
    } catch (e) {
        console.warn("Failed to load chat:", e);
        chatHistory = [];
    }
}

function clearHistory() {
    if (confirm("Clear all chat history? This will start a new conversation.")) {
        chatHistory = [];
        saveChat();
        const container = document.getElementById("chatContainer");
        if (container) {
            container.innerHTML = "";
            showRandomWelcome();
        }
    }
}

// ---------------- MAIN SEND FUNCTION ----------------
async function sendMessage() {
    const input = document.getElementById("messageInput");
    const sendBtn = document.getElementById("sendBtn");
    
    if (!input || !sendBtn) {
        console.error("Required UI elements not found!");
        return;
    }
    
    const message = input.value.trim();
    if (!message) return;
    
    // Clear input and disable button
    input.value = "";
    sendBtn.disabled = true;
    
    // Add user message to UI
    addMessage("user", message);
    
    try {
        // Show "typing" indicator
        addMessage("system", "Thinking...");
        
        // Get response from DeepSeek
        const reply = await getDeepSeekReply(message);
        
        // Remove "thinking" indicator and add bot response
        const systemMessages = document.querySelectorAll('.message.system');
        if (systemMessages.length > 0) {
            systemMessages[systemMessages.length - 1].remove();
        }
        
        addMessage("bot", reply, true);
        
    } catch (error) {
        console.error("Error in sendMessage:", error);
        
        // Remove "thinking" indicator
        const systemMessages = document.querySelectorAll('.message.system');
        if (systemMessages.length > 0) {
            systemMessages[systemMessages.length - 1].remove();
        }
        
        // Show user-friendly error
        let errorMsg = "Sorry, I encountered an error. ";
        
        if (error.message.includes("API key")) {
            errorMsg += "There's an issue with the API key. Please check if it's valid.";
        } else if (error.message.includes("Too many requests")) {
            errorMsg += "Please wait a moment before trying again.";
        } else if (error.message.includes("Bad request")) {
            errorMsg += "There was a problem with the request format.";
        } else if (error.message.includes("network")) {
            errorMsg += "Network error. Please check your internet connection.";
        } else {
            errorMsg += "Please try again.";
        }
        
        addMessage("bot", errorMsg, true);
        
    } finally {
        // Re-enable send button
        sendBtn.disabled = false;
        
        // Focus input for next message
        setTimeout(() => {
            if (input) input.focus();
        }, 100);
    }
}

// ---------------- INITIALIZATION ----------------
document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners
    const input = document.getElementById("messageInput");
    const sendBtn = document.getElementById("sendBtn");
    
    if (input) {
        // Enter key to send (Shift+Enter for new line)
        input.addEventListener("keydown", function(e) {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        // Enable/disable send button based on input
        input.addEventListener("input", function() {
            if (sendBtn) {
                sendBtn.disabled = !this.value.trim();
            }
        });
        
        // Focus the input
        setTimeout(() => input.focus(), 500);
    }
    
    if (sendBtn) {
        sendBtn.addEventListener("click", sendMessage);
    }
    
    // Load previous chat and show welcome
    loadChat();
    showRandomWelcome();
    
    console.log("Endroid AI initialized with DeepSeek via OpenRouter");
});

// ---------------- API TEST FUNCTION ----------------
// You can run this in browser console to test the API
async function testApiConnection() {
    console.log("Testing API connection...");
    
    try {
        const testResponse = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "deepseek/deepseek-chat",
                messages: [
                    { role: "user", content: "Say 'API test successful' if you can read this." }
                ],
                max_tokens: 20
            })
        });
        
        if (testResponse.ok) {
            const data = await testResponse.json();
            console.log("✅ API Test Successful!", data.choices[0].message.content);
            return true;
        } else {
            console.error("❌ API Test Failed:", testResponse.status, await testResponse.text());
            return false;
        }
    } catch (error) {
        console.error("❌ API Test Error:", error);
        return false;
    }
            }

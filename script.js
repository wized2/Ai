// ============================================================================
// ENDROID AI - COMPLETE SCRIPT.JS
// Using OpenRouter API with DeepSeek model
// ============================================================================

// Configuration
const OPENROUTER_API_KEY = "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";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// State management
let conversationHistory = [];
const MAX_HISTORY = 8;

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function callOpenRouterAPI(userMessage) {
    console.log("🔧 API Debug: Starting API call with message:", userMessage.substring(0, 50) + "...");
    
    try {
        // Build the messages array
        const messages = buildMessagesArray(userMessage);
        
        // Create request body
        const requestBody = {
            model: "deepseek/deepseek-chat",
            messages: messages,
            max_tokens: 1000,
            temperature: 0.7,
            stream: false
        };
        
        console.log("📤 API Debug: Sending request to OpenRouter...");
        
        // Make API call
        const response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin || 'http://localhost',
                'X-Title': 'Endroid AI'
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log(`📥 API Debug: Response Status - ${response.status} ${response.statusText}`);
        
        // Handle errors
        if (!response.ok) {
            await handleAPIError(response);
            return;
        }
        
        // Parse successful response
        const data = await response.json();
        console.log("✅ API Debug: Success! Received response");
        
        if (data.choices && data.choices[0] && data.choices[0].message) {
            return data.choices[0].message.content;
        } else {
            throw new Error("Invalid response format from API");
        }
        
    } catch (error) {
        console.error("🔥 API Call Failed:", error);
        throw error;
    }
}

function buildMessagesArray(userMessage) {
    const messages = [];
    
    // System prompt
    messages.push({
        role: "system",
        content: "You are Endroid AI, a helpful and friendly assistant. " +
                 "You remember conversation context and provide accurate, useful responses. " +
                 "Be conversational and engaging in your replies."
    });
    
    // Add conversation history
    const recentHistory = conversationHistory
        .filter(msg => msg.role === "user" || msg.role === "assistant")
        .slice(-MAX_HISTORY);
    
    recentHistory.forEach(msg => {
        messages.push({
            role: msg.role,
            content: msg.text
        });
    });
    
    // Add current user message
    messages.push({
        role: "user",
        content: userMessage
    });
    
    return messages;
}

async function handleAPIError(response) {
    let errorMessage = "";
    
    try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        
        // Map common OpenRouter errors to user-friendly messages
        const errorMap = {
            401: "Invalid API key. Please check your OpenRouter API key.",
            402: "Insufficient credits. Please add funds to your OpenRouter account.",
            429: "Rate limit exceeded. Free tier allows 50 requests/day. Please wait or upgrade.",
            404: "Model not found. The 'deepseek/deepseek-chat' model might be unavailable.",
            400: "Bad request. There might be an issue with the request format."
        };
        
        if (errorMap[response.status]) {
            errorMessage = errorMap[response.status];
        }
        
    } catch (e) {
        errorMessage = `HTTP ${response.status}: ${await response.text()}`;
    }
    
    throw new Error(errorMessage);
}

// ============================================================================
// UI FUNCTIONS
// ============================================================================

function addMessageToUI(role, text) {
    const container = document.getElementById("chatContainer");
    
    // Remove welcome message if this is the first real message
    const welcomeEl = document.getElementById("welcomeMessage");
    if (welcomeEl && container.contains(welcomeEl) && (role === 'user' || role === 'assistant')) {
        welcomeEl.remove();
    }
    
    // Create message element
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${role === 'assistant' ? 'bot' : role}`;
    
    // Format text (basic markdown support)
    const formattedText = formatMessageText(text);
    messageDiv.innerHTML = formattedText;
    
    // Add to container
    container.appendChild(messageDiv);
    
    // Scroll to bottom
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 50);
    
    // Save to history (but not system messages)
    if (role === 'user' || role === 'assistant') {
        conversationHistory.push({ role, text });
        saveToStorage();
    }
    
    console.log(`💬 UI: Added ${role} message`);
}

function formatMessageText(text) {
    if (!text) return "";
    
    return text
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/\*(.*?)\*/g, '<i>$1</i>')
        .replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.1);padding:2px 6px;border-radius:4px;font-family:monospace;">$1</code>')
        .replace(/\n/g, '<br>');
}

function showTypingIndicator() {
    const container = document.getElementById("chatContainer");
    const typingDiv = document.createElement("div");
    typingDiv.className = "message bot";
    typingDiv.id = "typingIndicator";
    typingDiv.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;">
            <div class="typing-dots">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
            <span>Endroid AI is thinking...</span>
        </div>
    `;
    container.appendChild(typingDiv);
    
    // Add typing animation styles
    if (!document.querySelector('#typing-styles')) {
        const style = document.createElement('style');
        style.id = 'typing-styles';
        style.textContent = `
            .typing-dots { display: flex; gap: 4px; }
            .dot {
                width: 8px; height: 8px; background: var(--md-sys-color-primary);
                border-radius: 50%; animation: typing-bounce 1.4s infinite;
            }
            .dot:nth-child(2) { animation-delay: 0.2s; }
            .dot:nth-child(3) { animation-delay: 0.4s; }
            @keyframes typing-bounce {
                0%, 60%, 100% { transform: translateY(0); }
                30% { transform: translateY(-6px); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Scroll to show typing indicator
    container.scrollTop = container.scrollHeight;
}

function hideTypingIndicator() {
    const typingDiv = document.getElementById("typingIndicator");
    if (typingDiv) {
        typingDiv.remove();
    }
}

function showError(message) {
    const errorDiv = document.getElementById("error");
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove("hidden");
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorDiv.classList.add("hidden");
        }, 5000);
    }
    console.error("❌ Error:", message);
}

// ============================================================================
// STORAGE FUNCTIONS
// ============================================================================

function saveToStorage() {
    try {
        localStorage.setItem("endroid_conversation", JSON.stringify(conversationHistory));
    } catch (e) {
        console.warn("Could not save to localStorage:", e);
    }
}

function loadFromStorage() {
    try {
        const saved = localStorage.getItem("endroid_conversation");
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
                conversationHistory = parsed;
                
                // Display all saved messages
                const container = document.getElementById("chatContainer");
                container.innerHTML = "";
                
                parsed.forEach(msg => {
                    const uiRole = msg.role === "assistant" ? "bot" : msg.role;
                    addMessageToUI(msg.role, msg.text);
                });
                
                console.log("📂 Loaded", parsed.length, "messages from storage");
            }
        }
    } catch (e) {
        console.warn("Could not load from localStorage:", e);
        conversationHistory = [];
    }
}

function clearHistory() {
    if (confirm("Clear all chat history? This cannot be undone.")) {
        conversationHistory = [];
        localStorage.removeItem("endroid_conversation");
        
        const container = document.getElementById("chatContainer");
        container.innerHTML = '<div class="welcome" id="welcomeMessage">What can I help with?</div>';
        
        console.log("🗑️ Chat history cleared");
    }
}

// ============================================================================
// MAIN MESSAGE HANDLING
// ============================================================================

async function sendMessage() {
    console.log("🚀 sendMessage() called");
    
    const input = document.getElementById("messageInput");
    const sendBtn = document.getElementById("sendBtn");
    
    if (!input || !sendBtn) {
        console.error("Input or button not found!");
        return;
    }
    
    const userMessage = input.value.trim();
    if (!userMessage) {
        console.log("Empty message, ignoring");
        return;
    }
    
    console.log("User message:", userMessage);
    
    // Clear input and disable button
    input.value = "";
    sendBtn.disabled = true;
    
    // Add user message to UI
    addMessageToUI("user", userMessage);
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        console.log("Calling API...");
        
        // Call the API
        const aiResponse = await callOpenRouterAPI(userMessage);
        
        console.log("Got response:", aiResponse.substring(0, 100) + "...");
        
        // Hide typing indicator
        hideTypingIndicator();
        
        // Add AI response to UI
        addMessageToUI("assistant", aiResponse);
        
    } catch (error) {
        console.error("sendMessage error:", error);
        
        // Hide typing indicator
        hideTypingIndicator();
        
        // Show user-friendly error in chat
        let userFriendlyError = "I encountered an error. ";
        
        if (error.message.includes("API key") || error.message.includes("401")) {
            userFriendlyError += "Please check your OpenRouter API key.";
        } else if (error.message.includes("credits") || error.message.includes("402")) {
            userFriendlyError += "Your OpenRouter account needs more credits.";
        } else if (error.message.includes("rate") || error.message.includes("429")) {
            userFriendlyError += "Rate limit reached. Free tier: 50 requests/day.";
        } else if (error.message.includes("network")) {
            userFriendlyError += "Network error. Please check your connection.";
        } else {
            userFriendlyError += error.message.substring(0, 100);
        }
        
        addMessageToUI("assistant", userFriendlyError);
        showError(error.message);
        
    } finally {
        // Re-enable send button
        sendBtn.disabled = false;
        
        // Focus input for next message
        setTimeout(() => {
            if (input) input.focus();
        }, 100);
    }
}

// ============================================================================
// INITIALIZATION & EVENT LISTENERS
// ============================================================================

function setupEventListeners() {
    const input = document.getElementById("messageInput");
    const sendBtn = document.getElementById("sendBtn");
    const clearBtn = document.getElementById("clearBtn");
    
    if (input) {
        // Enter to send (Shift+Enter for new line)
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
        
        // Focus input field
        setTimeout(() => {
            input.focus();
            console.log("🎯 Input field focused");
        }, 500);
    }
    
    if (sendBtn) {
        sendBtn.addEventListener("click", sendMessage);
        sendBtn.disabled = true; // Initially disabled
    }
    
    if (clearBtn) {
        clearBtn.addEventListener("click", clearHistory);
    }
}

function initializeApp() {
    console.log("🎬 Initializing Endroid AI...");
    
    // Load previous conversation
    loadFromStorage();
    
    // Set up event listeners
    setupEventListeners();
    
    // Test API connection (optional)
    setTimeout(() => {
        console.log("🔧 App initialized. Ready to send messages.");
        console.log("💡 Tips: Open browser console (F12) to see debug messages");
        console.log("🔑 Using API key:", OPENROUTER_API_KEY.substring(0, 10) + "...");
    }, 1000);
}

// ============================================================================
// UTILITY FUNCTIONS (for debugging)
// ============================================================================

async function testAPIConnection() {
    console.log("🧪 Testing API connection...");
    
    try {
        const testResponse = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "deepseek/deepseek-chat",
                messages: [{ role: "user", content: "Say 'API test successful' if you can read this." }],
                max_tokens: 20
            })
        });
        
        if (testResponse.ok) {
            const data = await testResponse.json();
            console.log("✅ API Connection Test: PASSED", data.choices[0].message.content);
            return true;
        } else {
            const errorText = await testResponse.text();
            console.error("❌ API Connection Test: FAILED", testResponse.status, errorText);
            return false;
        }
    } catch (error) {
        console.error("❌ API Connection Test: ERROR", error);
        return false;
    }
}

function showDebugInfo() {
    console.log("=== DEBUG INFO ===");
    console.log("API Key (first 10 chars):", OPENROUTER_API_KEY.substring(0, 10) + "...");
    console.log("API URL:", OPENROUTER_URL);
    console.log("Conversation History Length:", conversationHistory.length);
    console.log("LocalStorage Available:", typeof localStorage !== "undefined");
    console.log("==================");
}

// ============================================================================
// START THE APPLICATION
// ============================================================================

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Make utility functions available in console
window.testAPI = testAPIConnection;
window.debugInfo = showDebugInfo;
window.clearChat = clearHistory;

console.log("📝 Endroid AI script loaded");

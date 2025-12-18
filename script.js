// ============================================
// ENDROID AI - INTEGRATED SCRIPT.JS
// Combines your working API logic with new Material 3 UI
// ============================================

// Configuration - Use your working API key
const OPENROUTER_API_KEY = "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";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// State management
let conversationHistory = [];
const MAX_HISTORY = 8;

// System prompt for DeepSeek
const SYSTEM_PROMPT = `You are Endroid AI, a helpful and friendly assistant powered by DeepSeek.
You remember conversation context and provide useful, accurate responses.
Be conversational and engaging in your replies.`;

// ============================================
// API FUNCTIONS (From your working script)
// ============================================

async function callDeepSeekAPI(userMessage) {
    console.log("🤖 API: Calling DeepSeek...");
    
    try {
        // Build messages array with conversation context
        const messages = buildMessagesArray(userMessage);
        
        // Prepare request body
        const requestBody = {
            model: "deepseek/deepseek-chat",
            messages: messages,
            max_tokens: 1000,
            temperature: 0.7,
            stream: false
        };
        
        console.log("📤 API: Sending request...");
        
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
        
        console.log(`📥 API: Response status - ${response.status}`);
        
        // Handle errors
        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ API Error:", errorText);
            
            let errorMessage = `API Error: ${response.status}`;
            if (response.status === 401) errorMessage = "Invalid API key";
            if (response.status === 429) errorMessage = "Rate limit exceeded";
            if (response.status === 402) errorMessage = "Insufficient credits";
            
            throw new Error(errorMessage);
        }
        
        // Parse successful response
        const data = await response.json();
        console.log("✅ API: Success!");
        
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
    
    // Add system prompt
    messages.push({
        role: "system",
        content: SYSTEM_PROMPT
    });
    
    // Add conversation history (last MAX_HISTORY messages)
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

// ============================================
// CHAT HISTORY MANAGEMENT
// ============================================

function addToHistory(role, text) {
    // Only store user and assistant messages
    if (role === "user" || role === "assistant") {
        conversationHistory.push({ role, text });
        
        // Keep history manageable
        if (conversationHistory.length > MAX_HISTORY * 2) {
            conversationHistory = conversationHistory.slice(-MAX_HISTORY * 2);
        }
        
        saveToStorage();
    }
}

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
                
                // Display saved messages using new UI functions
                const container = document.getElementById("chatContainer");
                const welcomeEl = document.getElementById("welcomeMessage");
                
                // Hide welcome if we have history
                if (parsed.length > 0 && welcomeEl && container.contains(welcomeEl)) {
                    welcomeEl.style.display = 'none';
                }
                
                // Add each message to UI
                parsed.forEach(msg => {
                    if (msg.role === "assistant") {
                        // Use new UI function for bot messages
                        if (window.addMessageToUI) {
                            window.addMessageToUI(msg.role, msg.text, false);
                        }
                    } else if (msg.role === "user") {
                        if (window.addMessageToUI) {
                            window.addMessageToUI(msg.role, msg.text, false);
                        }
                    }
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
        const welcomeEl = document.getElementById("welcomeMessage");
        
        // Clear container and show welcome
        container.innerHTML = '';
        
        if (welcomeEl) {
            welcomeEl.style.display = 'flex';
            container.appendChild(welcomeEl);
        } else {
            // Create welcome if it doesn't exist
            const welcomeDiv = document.createElement('div');
            welcomeDiv.className = 'welcome-container';
            welcomeDiv.id = 'welcomeMessage';
            welcomeDiv.innerHTML = `
                <span class="material-symbols-outlined welcome-icon">psychology</span>
                <h1 class="welcome-title">Hello, I'm Endroid</h1>
                <p class="welcome-subtitle">Your AI assistant powered by DeepSeek. Ask me anything!</p>
            `;
            container.appendChild(welcomeDiv);
        }
        
        console.log("🗑️ Chat history cleared");
    }
}

// ============================================
// MAIN MESSAGE HANDLING
// ============================================

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
    
    // Add user message to UI using new function
    if (window.addMessageToUI) {
        window.addMessageToUI("user", userMessage, false);
    }
    
    // Save to history
    addToHistory("user", userMessage);
    
    // Show typing indicator using new function
    if (window.addMessageToUI) {
        window.addMessageToUI("assistant", "", true);
    }
    
    try {
        console.log("Calling API...");
        
        // Call the API
        const aiResponse = await callDeepSeekAPI(userMessage);
        
        console.log("Got response:", aiResponse.substring(0, 100) + "...");
        
        // Remove typing indicator using new function
        if (window.removeTypingIndicator) {
            window.removeTypingIndicator();
        }
        
        // Add AI response to UI using new function
        if (window.addMessageToUI) {
            window.addMessageToUI("assistant", aiResponse, false);
        }
        
        // Save to history
        addToHistory("assistant", aiResponse);
        
    } catch (error) {
        console.error("sendMessage error:", error);
        
        // Remove typing indicator
        if (window.removeTypingIndicator) {
            window.removeTypingIndicator();
        }
        
        // Show error in UI using new function
        let userFriendlyError = "I encountered an error. ";
        
        if (error.message.includes("API key") || error.message.includes("401")) {
            userFriendlyError += "Please check your OpenRouter API key.";
        } else if (error.message.includes("credits") || error.message.includes("402")) {
            userFriendlyError += "Your OpenRouter account needs more credits.";
        } else if (error.message.includes("rate") || error.message.includes("429")) {
            userFriendlyError += "Rate limit reached. Free tier allows 50 requests/day.";
        } else if (error.message.includes("network")) {
            userFriendlyError += "Network error. Please check your connection.";
        } else {
            userFriendlyError += error.message.substring(0, 100);
        }
        
        // Use new UI function for error
        if (window.addMessageToUI) {
            window.addMessageToUI("assistant", userFriendlyError, false);
        }
        
        // Also show in error box
        if (window.showErrorInUI) {
            window.showErrorInUI(error.message);
        }
        
    } finally {
        // Re-enable send button
        sendBtn.disabled = false;
        
        // Reset textarea height
        if (input) {
            input.style.height = 'auto';
        }
        
        // Focus input for next message
        setTimeout(() => {
            if (input) input.focus();
        }, 100);
    }
}

// ============================================
// EVENT HANDLERS
// ============================================

function setupEventListeners() {
    const input = document.getElementById("messageInput");
    const sendBtn = document.getElementById("sendBtn");
    const clearBtn = document.getElementById("clearBtn");
    
    // Send message on Enter (but allow Shift+Enter for new line)
    if (input) {
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
        
        // Auto-resize textarea (complementing the one in HTML)
        input.addEventListener("input", function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
        
        // Focus input on load
        setTimeout(() => {
            if (input) input.focus();
        }, 500);
    }
    
    // Send button click
    if (sendBtn) {
        sendBtn.addEventListener("click", sendMessage);
        sendBtn.disabled = true; // Initially disabled until there's input
    }
    
    // Clear history button
    if (clearBtn) {
        clearBtn.addEventListener("click", clearHistory);
    }
}

// ============================================
// INITIALIZATION
// ============================================

function initializeApp() {
    console.log("🎬 Initializing Endroid AI...");
    
    // Load previous conversation from storage
    loadFromStorage();
    
    // Set up event listeners
    setupEventListeners();
    
    console.log("✅ Endroid AI initialized and ready!");
}

// ============================================
// START THE APPLICATION
// ============================================

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM already loaded
    initializeApp();
}

// Make functions available globally for debugging
window.testAPI = async function() {
    console.log("🧪 Testing API connection...");
    try {
        const testResponse = await callDeepSeekAPI("Say 'API test successful' if you can read this.");
        console.log("✅ API Test Successful:", testResponse.substring(0, 50));
        return true;
    } catch (error) {
        console.error("❌ API Test Failed:", error);
        return false;
    }
};

window.debugInfo = function() {
    console.log("=== DEBUG INFO ===");
    console.log("Conversation History:", conversationHistory.length, "messages");
    console.log("API Key Configured:", OPENROUTER_API_KEY ? "Yes" : "No");
    console.log("UI Functions Available:", {
        addMessageToUI: typeof window.addMessageToUI !== 'undefined',
        showErrorInUI: typeof window.showErrorInUI !== 'undefined',
        removeTypingIndicator: typeof window.removeTypingIndicator !== 'undefined'
    });
    console.log("==================");
};

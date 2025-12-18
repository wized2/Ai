// ENDROID AI — DEEPSEEK OPENROUTER (WORKING VERSION)
// Using 100% exact method that worked in your test

const API_KEY = "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";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Simple memory for conversation
let conversationHistory = [];

// -----------------------------------------------------------
// EXACT WORKING API METHOD FROM YOUR TEST VERSION
// -----------------------------------------------------------
async function callDeepSeekAPI(userMessage) {
    console.log("🤖 API CALL STARTED:", userMessage.substring(0, 50) + "...");
    
    try {
        // STEP 1: Build the EXACT request body that worked
        const requestBody = {
            model: "deepseek/deepseek-chat",
            messages: [
                {
                    role: "system",
                    content: "You are Endroid AI, a helpful and friendly assistant. Respond in a conversational way."
                },
                {
                    role: "user",
                    content: userMessage
                }
            ],
            max_tokens: 1000
        };
        
        console.log("📤 Sending request:", requestBody);
        
        // STEP 2: Make the EXACT API call (same as working test)
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Endroid AI'
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log("📥 Response status:", response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ API ERROR:", errorText);
            
            // Show specific error in UI
            let errorMsg = "";
            if (response.status === 401) {
                errorMsg = "API key error. Please check your API key.";
            } else if (response.status === 429) {
                errorMsg = "Too many requests. Please wait a moment.";
            } else if (response.status === 400) {
                errorMsg = "Bad request format. Please try a different message.";
            } else {
                errorMsg = `Server error: ${response.status}`;
            }
            
            showError(errorMsg);
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log("✅ API SUCCESS:", data);
        
        // STEP 3: Extract response exactly as in working test
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            return data.choices[0].message.content;
        } else {
            throw new Error("No valid response from API");
        }
        
    } catch (error) {
        console.error("🔥 CATCH BLOCK ERROR:", error);
        throw error;
    }
}

// -----------------------------------------------------------
// SIMPLE UI FUNCTIONS
// -----------------------------------------------------------
function showError(message) {
    const errorDiv = document.getElementById('error');
    if (errorDiv) {
        errorDiv.textContent = `Error: ${message}`;
        errorDiv.classList.remove('hidden');
        setTimeout(() => errorDiv.classList.add('hidden'), 5000);
    }
    console.error("UI Error:", message);
}

function addMessageToUI(role, text) {
    const container = document.getElementById("chatContainer");
    const welcomeEl = document.getElementById("welcomeMessage");
    
    // Remove welcome message if this is first real message
    if (welcomeEl && (role === 'user' || role === 'bot')) {
        welcomeEl.remove();
    }
    
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${role}`;
    
    // Simple formatting
    let formattedText = text
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/\*(.*?)\*/g, '<i>$1</i>')
        .replace(/\n/g, '<br>');
    
    messageDiv.innerHTML = formattedText;
    container.appendChild(messageDiv);
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
    
    // Save to history
    if (role === 'user' || role === 'bot') {
        conversationHistory.push({ role, text });
        saveToStorage();
    }
}

function showTypingIndicator() {
    const container = document.getElementById("chatContainer");
    const typingDiv = document.createElement("div");
    typingDiv.className = "message bot typing";
    typingDiv.id = "typingIndicator";
    typingDiv.innerHTML = "Endroid AI is thinking...";
    container.appendChild(typingDiv);
    container.scrollTop = container.scrollHeight;
}

function hideTypingIndicator() {
    const typingDiv = document.getElementById("typingIndicator");
    if (typingDiv) {
        typingDiv.remove();
    }
}

// -----------------------------------------------------------
// STORAGE FUNCTIONS
// -----------------------------------------------------------
function saveToStorage() {
    try {
        localStorage.setItem("endroid_conversation", JSON.stringify(conversationHistory));
    } catch (e) {
        console.warn("Could not save to localStorage");
    }
}

function loadFromStorage() {
    try {
        const saved = localStorage.getItem("endroid_conversation");
        if (saved) {
            conversationHistory = JSON.parse(saved);
            
            // Display all saved messages
            const container = document.getElementById("chatContainer");
            container.innerHTML = '';
            
            conversationHistory.forEach(msg => {
                addMessageToUI(msg.role, msg.text);
            });
        }
    } catch (e) {
        console.warn("Could not load from localStorage");
    }
}

function clearHistory() {
    if (confirm("Clear all chat history?")) {
        conversationHistory = [];
        localStorage.removeItem("endroid_conversation");
        
        const container = document.getElementById("chatContainer");
        container.innerHTML = '<div class="welcome" id="welcomeMessage">What can I help with?</div>';
    }
}

// -----------------------------------------------------------
// MAIN SEND FUNCTION (SIMPLIFIED)
// -----------------------------------------------------------
async function sendMessage() {
    console.log("🚀 sendMessage() called");
    
    const input = document.getElementById("messageInput");
    const sendBtn = document.getElementById("sendBtn");
    
    if (!input || !sendBtn) {
        console.error("Input or button not found!");
        return;
    }
    
    const userMessage = input.value.trim();
    if (!userMessage) return;
    
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
        
        // Call the API with EXACT working method
        const aiResponse = await callDeepSeekAPI(userMessage);
        
        console.log("Got response:", aiResponse.substring(0, 100) + "...");
        
        // Hide typing indicator
        hideTypingIndicator();
        
        // Add AI response to UI
        addMessageToUI("bot", aiResponse);
        
    } catch (error) {
        console.error("sendMessage error:", error);
        
        // Hide typing indicator
        hideTypingIndicator();
        
        // Show error in chat
        addMessageToUI("bot", "I'm having trouble responding right now. Please try again or check your API key.");
        
        // Don't show error popup since we're showing in chat
    } finally {
        // Re-enable send button
        sendBtn.disabled = false;
        
        // Focus input
        setTimeout(() => {
            if (input) input.focus();
        }, 100);
    }
}

// -----------------------------------------------------------
// INITIALIZATION & EVENT LISTENERS
// -----------------------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    console.log("🎯 DOM Loaded - Initializing Endroid AI");
    
    // Load previous conversation
    loadFromStorage();
    
    // Set up input event listeners
    const input = document.getElementById("messageInput");
    const sendBtn = document.getElementById("sendBtn");
    
    if (input) {
        // Enter to send (Shift+Enter for new line)
        input.addEventListener("keydown", function(e) {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        // Enable/disable send button
        input.addEventListener("input", function() {
            if (sendBtn) {
                sendBtn.disabled = !this.value.trim();
            }
        });
        
        // Focus input field
        setTimeout(() => input.focus(), 500);
    }
    
    if (sendBtn) {
        sendBtn.addEventListener("click", sendMessage);
    }
    
    console.log("✅ Endroid AI initialized successfully");
    
    // Test the API connection on startup (optional)
    setTimeout(testConnection, 1000);
});

// -----------------------------------------------------------
// TEST FUNCTION (Run in browser console if needed)
// -----------------------------------------------------------
async function testConnection() {
    console.log("🔧 Testing API connection...");
    
    try {
        const testResponse = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "deepseek/deepseek-chat",
                messages: [{ role: "user", content: "Say 'Hello' if you can hear me." }],
                max_tokens: 10
            })
        });
        
        if (testResponse.ok) {
            console.log("✅ API Connection Test: PASSED");
            return true;
        } else {
            console.error("❌ API Connection Test: FAILED", testResponse.status);
            const errorText = await testResponse.text();
            console.error("Error details:", errorText);
            return false;
        }
    } catch (error) {
        console.error("❌ API Connection Test: ERROR", error);
        return false;
    }
}

// Global function to test from console
window.testAPI = testConnection;

// ================================================================
//  PARTICLE SYSTEM
// ================================================================
class ParticleSystem {
    constructor() {
        this.canvas = document.getElementById('particleCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.running = false;
        this.animationId = null;
        this.config = { type: 'none', count: 60, color: '#ffffff', speed: 1, size: 3 };
        this._resize();
        window.addEventListener('resize', () => this._resize());
    }
    _resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    start(config) {
        this.stop();
        this.config = Object.assign({}, this.config, config || {});
        if (this.config.type === 'none' || !this.config.count) {
            this.canvas.classList.remove('active');
            return;
        }
        this.particles = [];
        const count = Math.min(this.config.count || 60, 300);
        const color = this.config.color || '#ffffff';
        const size = this.config.size || 3;
        const speed = this.config.speed || 1;

        for (let i = 0; i < count; i++) {
            let p = {
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: 0, vy: 0,
                size: size * (0.5 + Math.random() * 0.8),
                opacity: 0.3 + Math.random() * 0.7,
                color: color,
                phase: Math.random() * Math.PI * 2,
                wobble: 0.5 + Math.random() * 0.5,
            };
            switch (this.config.type) {
                case 'snow':
                    p.vy = (0.5 + Math.random() * 1.5) * speed;
                    p.vx = (Math.random() - 0.5) * 0.3 * speed;
                    p.wobble = 0.3 + Math.random() * 0.7;
                    p.size = size * (0.5 + Math.random() * 0.8);
                    p.opacity = 0.4 + Math.random() * 0.6;
                    break;
                case 'stars':
                    p.vy = 0; p.vx = 0;
                    p.size = size * (0.3 + Math.random() * 0.7);
                    p.opacity = 0.2 + Math.random() * 0.8;
                    p.twinkleSpeed = 0.5 + Math.random() * 1.5;
                    p.twinkleOffset = Math.random() * Math.PI * 2;
                    break;
                case 'confetti':
                    p.vy = (1 + Math.random() * 2) * speed;
                    p.vx = (Math.random() - 0.5) * 1.5 * speed;
                    p.size = size * (0.6 + Math.random() * 0.8);
                    p.rotation = Math.random() * Math.PI * 2;
                    p.rotSpeed = (Math.random() - 0.5) * 0.1;
                    p.opacity = 0.6 + Math.random() * 0.4;
                    p.color = `hsl(${Math.random() * 360}, 80%, 60%)`;
                    break;
                case 'bubbles':
                    p.vy = -(0.3 + Math.random() * 0.8) * speed;
                    p.vx = (Math.random() - 0.5) * 0.5 * speed;
                    p.size = size * (0.5 + Math.random() * 1.2);
                    p.opacity = 0.2 + Math.random() * 0.3;
                    p.color = color;
                    p.wobble = 0.5 + Math.random() * 0.5;
                    break;
                case 'rain':
                    p.vy = (3 + Math.random() * 5) * speed;
                    p.vx = (Math.random() - 0.5) * 0.5 * speed;
                    p.size = size * (0.3 + Math.random() * 0.5);
                    p.opacity = 0.2 + Math.random() * 0.3;
                    p.color = color;
                    p.length = size * (3 + Math.random() * 4);
                    break;
                default:
                    p.vy = (0.5 + Math.random() * 1.5) * speed;
                    p.vx = (Math.random() - 0.5) * 0.3 * speed;
            }
            this.particles.push(p);
        }
        this.canvas.classList.add('active');
        this.running = true;
        this._loop();
    }
    stop() {
        this.running = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.canvas.classList.remove('active');
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    _loop() {
        if (!this.running) return;
        this.animationId = requestAnimationFrame(() => this._loop());
        this._update();
        this._draw();
    }
    _update() {
        const w = this.canvas.width, h = this.canvas.height;
        const type = this.config.type;
        for (const p of this.particles) {
            p.x += p.vx || 0;
            p.y += p.vy || 0;
            if (type === 'snow') {
                p.x += Math.sin(p.phase + p.y * 0.01) * 0.3 * p.wobble;
                if (p.y > h + 20) { p.y = -20; p.x = Math.random() * w; }
                if (p.x > w + 20) p.x = -20;
                if (p.x < -20) p.x = w + 20;
            } else if (type === 'stars') {
                // handled in draw
            } else if (type === 'confetti') {
                p.rotation += p.rotSpeed || 0;
                if (p.y > h + 20) { p.y = -20; p.x = Math.random() * w; }
                if (p.x > w + 20) p.x = -20;
                if (p.x < -20) p.x = w + 20;
            } else if (type === 'bubbles') {
                p.x += Math.sin(p.phase + p.y * 0.02) * 0.5 * p.wobble;
                if (p.y < -20) { p.y = h + 20; p.x = Math.random() * w; }
                if (p.x > w + 20) p.x = -20;
                if (p.x < -20) p.x = w + 20;
            } else if (type === 'rain') {
                if (p.y > h + 20) { p.y = -20; p.x = Math.random() * w; }
                if (p.x > w + 20) p.x = -20;
                if (p.x < -20) p.x = w + 20;
            } else {
                if (p.y > h + 20) { p.y = -20; p.x = Math.random() * w; }
                if (p.x > w + 20) p.x = -20;
                if (p.x < -20) p.x = w + 20;
            }
            if (p.x > w + 50) p.x = -50;
            if (p.x < -50) p.x = w + 50;
            if (p.y > h + 50) p.y = -50;
            if (p.y < -50) p.y = h + 50;
        }
    }
    _draw() {
        const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;
        ctx.clearRect(0, 0, w, h);
        const type = this.config.type;
        for (const p of this.particles) {
            let opacity = p.opacity || 0.6;
            if (type === 'stars') {
                const twinkle = 0.5 + 0.5 * Math.sin(Date.now() * 0.002 * (p.twinkleSpeed || 1) + (p.twinkleOffset || 0));
                opacity = p.opacity * (0.3 + 0.7 * twinkle);
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * (0.5 + 0.5 * twinkle), 0, Math.PI * 2);
                ctx.fillStyle = p.color || '#ffffff';
                ctx.globalAlpha = opacity;
                ctx.fill();
                ctx.globalAlpha = 1;
                continue;
            }
            if (type === 'rain') {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x + p.vx * 3, p.y + p.length || p.size * 4);
                ctx.strokeStyle = p.color || '#ffffff';
                ctx.globalAlpha = opacity * 0.6;
                ctx.lineWidth = p.size * 0.5 || 1;
                ctx.stroke();
                ctx.globalAlpha = 1;
                continue;
            }
            if (type === 'confetti') {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation || 0);
                ctx.globalAlpha = opacity;
                ctx.fillStyle = p.color || '#ff6b6b';
                const s = p.size || 3;
                ctx.fillRect(-s/2, -s/4, s, s/2);
                ctx.globalAlpha = 1;
                ctx.restore();
                continue;
            }
            if (type === 'bubbles') {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size || 3, 0, Math.PI * 2);
                ctx.strokeStyle = p.color || '#ffffff';
                ctx.globalAlpha = opacity * 0.5;
                ctx.lineWidth = 0.5;
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(p.x - p.size * 0.2, p.y - p.size * 0.2, p.size * 0.2, 0, Math.PI * 2);
                ctx.fillStyle = p.color || '#ffffff';
                ctx.globalAlpha = opacity * 0.15;
                ctx.fill();
                ctx.globalAlpha = 1;
                continue;
            }
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size || 3, 0, Math.PI * 2);
            ctx.fillStyle = p.color || '#ffffff';
            ctx.globalAlpha = opacity || 0.6;
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }
}

// ================================================================
//  CHAT MANAGER
// ================================================================
const STORAGE_KEY = 'endroid_chats_v2';
const MAX_CHATS = 8;

const chatManager = {
    chats: [],
    activeId: null,
    _nextId: 1,
    init() {
        this.load();
        if (this.chats.length === 0) this.createChat('New Chat');
        if (!this.activeId && this.chats.length > 0) this.activeId = this.chats[0].id;
        this.save();
        return this;
    },
    createChat(title) {
        if (this.chats.length >= MAX_CHATS) return null;
        const chat = {
            id: 'chat_' + (this._nextId++),
            title: title || 'New Chat',
            messages: [],
            pinned: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        this.chats.push(chat);
        this.activeId = chat.id;
        this.save();
        return chat;
    },
    deleteChat(id) {
        const idx = this.chats.findIndex(c => c.id === id);
        if (idx === -1) return false;
        this.chats.splice(idx, 1);
        if (this.activeId === id) {
            this.activeId = this.chats.length > 0 ? this.chats[0].id : null;
        }
        if (this.chats.length === 0) this.createChat('New Chat');
        this.save();
        return true;
    },
    renameChat(id, newTitle) {
        const chat = this.getChat(id);
        if (!chat || !newTitle.trim()) return false;
        chat.title = newTitle.trim();
        chat.updatedAt = Date.now();
        this.save();
        return true;
    },
    togglePin(id) {
        const chat = this.getChat(id);
        if (!chat) return false;
        chat.pinned = !chat.pinned;
        chat.updatedAt = Date.now();
        this.save();
        return true;
    },
    getChat(id) { return this.chats.find(c => c.id === id) || null; },
    getActive() { return this.getChat(this.activeId); },
    switchTo(id) {
        if (this.getChat(id)) {
            this.activeId = id;
            this.save();
            return true;
        }
        return false;
    },
    addMessage(chatId, role, text) {
        const chat = this.getChat(chatId);
        if (!chat) return false;
        chat.messages.push({ role, text });
        chat.updatedAt = Date.now();
        this.save();
        return true;
    },
    clearMessages(chatId) {
        const chat = this.getChat(chatId);
        if (!chat) return false;
        chat.messages = [];
        chat.updatedAt = Date.now();
        this.save();
        return true;
    },
    save() {
        try {
            const data = { chats: this.chats, activeId: this.activeId, nextId: this._nextId };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch(e) { console.warn('Save failed:', e); }
    },
    load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) { this._migrateOld(); return; }
            const data = JSON.parse(raw);
            this.chats = data.chats || [];
            this.activeId = data.activeId || null;
            this._nextId = data.nextId || 1;
            this.chats.forEach(c => {
                if (!c.messages) c.messages = [];
                if (typeof c.pinned !== 'boolean') c.pinned = false;
                if (!c.createdAt) c.createdAt = Date.now();
                if (!c.updatedAt) c.updatedAt = Date.now();
            });
            if (this.chats.length === 0) this.createChat('New Chat');
            if (!this.getChat(this.activeId) && this.chats.length > 0) this.activeId = this.chats[0].id;
        } catch(e) {
            console.warn('Load failed:', e);
            this.chats = [];
            this.activeId = null;
            this._nextId = 1;
            this.createChat('New Chat');
        }
    },
    _migrateOld() {
        try {
            const oldRaw = localStorage.getItem('endroid_conversation');
            if (!oldRaw) return;
            const oldHistory = JSON.parse(oldRaw);
            if (!Array.isArray(oldHistory) || oldHistory.length === 0) return;
            const chat = {
                id: 'chat_' + (this._nextId++),
                title: 'Chat',
                messages: oldHistory,
                pinned: false,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
            this.chats = [chat];
            this.activeId = chat.id;
            this.save();
            localStorage.removeItem('endroid_conversation');
        } catch(e) { console.warn('Migration failed:', e); }
    },
    getSortedChats() {
        const pinned = this.chats.filter(c => c.pinned);
        const unpinned = this.chats.filter(c => !c.pinned);
        pinned.sort((a,b) => a.title.localeCompare(b.title));
        unpinned.sort((a,b) => b.updatedAt - a.updatedAt);
        return [...pinned, ...unpinned];
    },
    getTitle(chat) {
        if (!chat) return 'Chat';
        if (chat.title && chat.title.trim()) return chat.title.trim();
        const firstUser = chat.messages.find(m => m.role === 'user');
        if (firstUser) {
            const snippet = firstUser.text.slice(0, 30);
            return snippet + (firstUser.text.length > 30 ? '…' : '');
        }
        return 'New Chat';
    },
    getPreview(chat) {
        if (!chat || chat.messages.length === 0) return 'Empty chat';
        const last = chat.messages[chat.messages.length - 1];
        if (!last) return 'Empty chat';
        const snippet = last.text.slice(0, 40);
        return snippet + (last.text.length > 40 ? '…' : '');
    }
};

// ================================================================
//  THEME ENGINE
// ================================================================
const ThemeEngine = {
    _appliedTheme: null,
    _styleTag: null,
    _defaultVariables: {},
    _particleSystem: null,
    _svgContainer: null,

    init() {
        this._styleTag = document.getElementById('dynamicThemeStyle');
        if (!this._styleTag) {
            const tag = document.createElement('style');
            tag.id = 'dynamicThemeStyle';
            document.head.appendChild(tag);
            this._styleTag = tag;
        }
        this._particleSystem = new ParticleSystem();
        this._svgContainer = document.getElementById('svgBackground');
        const root = document.documentElement;
        const styles = getComputedStyle(root);
        const vars = [
            '--md-sys-color-primary', '--md-sys-color-on-primary',
            '--md-sys-color-primary-container', '--md-sys-color-on-primary-container',
            '--md-sys-color-secondary', '--md-sys-color-on-secondary',
            '--md-sys-color-secondary-container', '--md-sys-color-on-secondary-container',
            '--md-sys-color-tertiary', '--md-sys-color-on-tertiary',
            '--md-sys-color-tertiary-container', '--md-sys-color-on-tertiary-container',
            '--md-sys-color-surface', '--md-sys-color-surface-dim',
            '--md-sys-color-surface-bright', '--md-sys-color-surface-container',
            '--md-sys-color-surface-container-high', '--md-sys-color-surface-container-highest',
            '--md-sys-color-surface-container-low', '--md-sys-color-surface-container-lowest',
            '--md-sys-color-on-surface', '--md-sys-color-on-surface-variant',
            '--md-sys-color-outline', '--md-sys-color-outline-variant',
            '--md-sys-color-inverse-surface', '--md-sys-color-inverse-on-surface',
            '--md-sys-color-error', '--md-sys-color-on-error',
            '--md-sys-color-error-container', '--md-sys-color-on-error-container',
            '--md-sys-color-scrim',
        ];
        vars.forEach(v => {
            const val = styles.getPropertyValue(v).trim();
            if (val) this._defaultVariables[v] = val;
        });
        return this;
    },

    apply(themeData) {
        if (!themeData || typeof themeData !== 'object') return false;
        const { cssVariables, css, name, mode, particles, svgBackground } = themeData;
        const root = document.documentElement;

        if (mode === 'dark') {
            document.body.classList.remove('theme-light');
            document.body.classList.add('theme-dark');
            const icon = document.getElementById('themeIcon');
            if (icon) { icon.setAttribute('data-lucide', 'sun'); if (typeof lucide !== 'undefined') lucide.createIcons(); }
        } else if (mode === 'light') {
            document.body.classList.remove('theme-dark');
            document.body.classList.add('theme-light');
            const icon = document.getElementById('themeIcon');
            if (icon) { icon.setAttribute('data-lucide', 'moon'); if (typeof lucide !== 'undefined') lucide.createIcons(); }
        }

        if (cssVariables && typeof cssVariables === 'object') {
            Object.entries(cssVariables).forEach(([key, value]) => {
                if (key.startsWith('--') && value) {
                    root.style.setProperty(key, value);
                }
            });
        }

        if (css && typeof css === 'string' && css.trim()) {
            this._styleTag.textContent = css;
        } else {
            this._styleTag.textContent = '';
        }

        // SVG Background - force full screen
        if (svgBackground && typeof svgBackground === 'string' && svgBackground.trim()) {
            // Ensure SVG has proper viewBox and sizing
            let svgContent = svgBackground;
            // Inject viewBox if missing
            if (!svgContent.includes('viewBox')) {
                svgContent = svgContent.replace('<svg', '<svg viewBox="0 0 100 100"');
            }
            // Ensure width and height are 100%
            svgContent = svgContent.replace(/width="[^"]*"/g, 'width="100%"');
            svgContent = svgContent.replace(/height="[^"]*"/g, 'height="100%"');
            this._svgContainer.innerHTML = svgContent;
            this._svgContainer.classList.add('active');
        } else {
            this._svgContainer.innerHTML = '';
            this._svgContainer.classList.remove('active');
        }

        if (particles && particles.type && particles.type !== 'none') {
            const pConfig = {
                type: particles.type,
                count: particles.count || 60,
                color: particles.color || '#ffffff',
                speed: particles.speed || 1,
                size: particles.size || 3,
            };
            this._particleSystem.start(pConfig);
        } else {
            this._particleSystem.stop();
        }

        this._appliedTheme = {
            name: name || 'Custom Theme',
            cssVariables: cssVariables || {},
            css: css || '',
            mode: mode || 'light',
            particles: particles || null,
            svgBackground: svgBackground || null,
        };

        try {
            localStorage.setItem('endroid_applied_theme', JSON.stringify(themeData));
        } catch(e) { console.warn('Theme save failed:', e); }

        return true;
    },

    reset() {
        const root = document.documentElement;
        Object.entries(this._defaultVariables).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
        this._styleTag.textContent = '';
        this._particleSystem.stop();
        this._svgContainer.innerHTML = '';
        this._svgContainer.classList.remove('active');
        this._appliedTheme = null;
        try { localStorage.removeItem('endroid_applied_theme'); } catch(e) {}
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
        const currentTheme = localStorage.getItem('endroid-theme') || 'system';
        if (currentTheme === 'dark' || (currentTheme === 'system' && prefersDark.matches)) {
            document.body.classList.remove('theme-light');
            document.body.classList.add('theme-dark');
        } else {
            document.body.classList.remove('theme-dark');
            document.body.classList.add('theme-light');
        }
        return true;
    },

    getAppliedTheme() { return this._appliedTheme; },
    isApplied() { return this._appliedTheme !== null; },

    getThemePrompt(userPrompt) {
        return `You are a UI theme generator for a chat application. Based on the user's description, generate a complete visual theme.

Return ONLY valid JSON in this exact format, with no additional text or markdown:

{
  "mode": "dark" | "light",
  "name": "Theme Name",
  "cssVariables": {
    "--md-sys-color-primary": "#HEX",
    "--md-sys-color-on-primary": "#HEX",
    "--md-sys-color-primary-container": "#HEX",
    "--md-sys-color-on-primary-container": "#HEX",
    "--md-sys-color-secondary": "#HEX",
    "--md-sys-color-on-secondary": "#HEX",
    "--md-sys-color-secondary-container": "#HEX",
    "--md-sys-color-on-secondary-container": "#HEX",
    "--md-sys-color-tertiary": "#HEX",
    "--md-sys-color-on-tertiary": "#HEX",
    "--md-sys-color-tertiary-container": "#HEX",
    "--md-sys-color-on-tertiary-container": "#HEX",
    "--md-sys-color-surface": "#HEX",
    "--md-sys-color-surface-dim": "#HEX",
    "--md-sys-color-surface-bright": "#HEX",
    "--md-sys-color-surface-container": "#HEX",
    "--md-sys-color-surface-container-high": "#HEX",
    "--md-sys-color-surface-container-highest": "#HEX",
    "--md-sys-color-surface-container-low": "#HEX",
    "--md-sys-color-surface-container-lowest": "#HEX",
    "--md-sys-color-on-surface": "#HEX",
    "--md-sys-color-on-surface-variant": "#HEX",
    "--md-sys-color-outline": "#HEX",
    "--md-sys-color-outline-variant": "#HEX",
    "--md-sys-color-inverse-surface": "#HEX",
    "--md-sys-color-inverse-on-surface": "#HEX",
    "--md-sys-color-error": "#HEX",
    "--md-sys-color-on-error": "#HEX",
    "--md-sys-color-error-container": "#HEX",
    "--md-sys-color-on-error-container": "#HEX",
    "--md-sys-color-scrim": "#HEX"
  },
  "css": "/* Additional CSS for background animations, gradients, effects */",
  "particles": {
    "type": "snow" | "stars" | "confetti" | "bubbles" | "rain" | "none",
    "count": 50-200,
    "color": "#HEX",
    "speed": 0.5-2,
    "size": 2-8
  },
  "svgBackground": "<svg viewBox='0 0 100 100' width='100%' height='100%' xmlns='http://www.w3.org/2000/svg'>...</svg>"
}

IMPORTANT SVG RULES:
- The svgBackground MUST be a complete SVG element with viewBox, width="100%", height="100%"
- Use viewBox="0 0 100 100" for a responsive design
- Make the SVG cover the entire screen
- Use shapes that tile or expand to fill the viewBox
- Avoid hardcoded pixel sizes - use percentages or viewBox coordinates
- The SVG should look beautiful as a full-screen background

RULES:
1. mode: choose 'dark' for night, space, dark themes. choose 'light' for bright, sunny, icy, pastel themes.
2. If user mentions: snow, winter, cold, icy, Christmas, frost → particles.type = 'snow'
3. If user mentions: stars, night, space, galaxy, cosmic → particles.type = 'stars'
4. If user mentions: celebration, party, festive, new year → particles.type = 'confetti'
5. If user mentions: ocean, underwater, beach, mermaid → particles.type = 'bubbles'
6. If user mentions: rain, storm, gloomy, monsoon → particles.type = 'rain'
7. Default: particles.type = 'none'
8. The "css" field can include @keyframes for background animations, gradients, etc.
9. All hex values must be 6 characters. Use #RRGGBB format.
10. Ensure WCAG AA contrast for readability.
11. The SVG background should be aesthetically pleasing and match the theme.

User's theme request: ${userPrompt}`;
    }
};

// ================================================================
//  MARKDOWN RENDERER
// ================================================================
function renderMarkdown(text) {
    if (!text || typeof text !== 'string') return '';

    let processedText = text;
    const codeBlocks = [];
    const inlineCodeBlocks = [];

    processedText = processedText.replace(/```(\w+)?\n([\s\S]*?)```/g, function(match, language, code) {
        const id = 'code-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const lang = language || 'text';
        const escapedCode = escapeHtml(code);

        let langLabel;
        if (lang === 'js' || lang === 'javascript') {
            langLabel = `
                <span class="lang-label">
                    <span class="terminal-icon-box">
                        <i data-lucide="terminal" class="lucide"></i>
                    </span>
                    JavaScript
                </span>
            `;
        } else {
            langLabel = `<span class="lang-label">${lang}</span>`;
        }

        let buttonsHtml = '';
        if (lang === 'js' || lang === 'javascript') {
            buttonsHtml += `
                <button class="run-js-btn" data-code-id="${id}" title="Run this JavaScript code">
                    <i data-lucide="play" class="lucide"></i>
                </button>
            `;
        }
        buttonsHtml += `
            <button class="copy-code-btn" data-code-id="${id}" title="Copy code">
                <i data-lucide="copy" class="lucide"></i>
            </button>
        `;

        const html = `
            <div class="code-block" data-lang="${lang}">
                <div class="code-block-header">
                    <span>${langLabel}</span>
                    <span class="action-buttons">${buttonsHtml}</span>
                </div>
                <pre><code id="${id}" class="language-${lang}">${escapedCode}</code></pre>
                ${(lang === 'js' || lang === 'javascript') ? `<div class="js-output" id="output-${id}" style="display:none;"></div>` : ''}
            </div>`;
        codeBlocks.push({ id, html, rawCode: code });
        return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
    });

    processedText = processedText.replace(/`([^`]+)`/g, function(match, code) {
        const id = 'inline-code-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        inlineCodeBlocks.push({ id, code });
        return `__INLINE_CODE_${inlineCodeBlocks.length - 1}__`;
    });

    processedText = processedText.replace(/(?:\|.*\|.*\n)(?:\|?:?-+:?\|.*\n)+(?:\|.*\|.*\n)+/g, function(match) {
        const rows = match.trim().split('\n').filter(row => row.trim());
        if (rows.length < 2) return match;
        let tableHtml = '<table>\n<thead>\n<tr>\n';
        const headerRow = rows[0].trim();
        const headers = headerRow.split('|').filter(cell => cell.trim() !== '').map(cell => cell.trim());
        headers.forEach(header => {
            tableHtml += `<th>${processMarkdownInCell(header)}</th>\n`;
        });
        tableHtml += '</tr>\n</thead>\n<tbody>\n';
        for (let i = 2; i < rows.length; i++) {
            const row = rows[i].trim();
            if (row.includes('---') || row.includes('===')) continue;
            const cells = row.split('|').filter(cell => cell.trim() !== '').map(cell => cell.trim());
            if (cells.length > 0) {
                tableHtml += '<tr>\n';
                cells.forEach(cell => {
                    tableHtml += `<td>${processMarkdownInCell(cell)}</td>\n`;
                });
                tableHtml += '</tr>\n';
            }
        }
        tableHtml += '</tbody>\n</table>';
        return tableHtml;
    });

    processedText = processedText.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, function(match, alt, url) {
        return `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" style="max-width:100%; border-radius:12px; margin:6px 0; box-shadow: var(--md-elevation-level1);" />`;
    });

    processedText = processBasicMarkdown(processedText);
    processedText = processLists(processedText);

    inlineCodeBlocks.forEach((block, index) => {
        processedText = processedText.replace(`__INLINE_CODE_${index}__`, `<code>${escapeHtml(block.code)}</code>`);
    });

    processedText = processParagraphs(processedText);

    codeBlocks.forEach((block, index) => {
        processedText = processedText.replace(`__CODE_BLOCK_${index}__`, block.html);
    });

    return processedText;
}

function processMarkdownInCell(text) {
    if (!text) return '';
    let processed = text;
    processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
    processed = processed.replace(/`([^`]+)`/g, '<code>$1</code>');
    processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    processed = escapeHtml(processed);
    processed = processed.replace(/&lt;(\/?)(strong|em|code|a\b[^&]*?)&gt;/g, '<$1$2>');
    return processed;
}

function processBasicMarkdown(text) {
    let processed = text;
    processed = processed.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    processed = processed.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    processed = processed.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
    processed = processed.replace(/^>\s*(.+)$/gm, '<blockquote>$1</blockquote>');
    processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    return processed;
}

function processLists(text) {
    const lines = text.split('\n');
    let resultLines = [];
    let inList = false;
    let listType = 'ul';
    let listItems = [];
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (line.match(/^\s*[-*+]\s+/)) {
            if (!inList) { inList = true; listType = 'ul'; }
            const content = line.replace(/^\s*[-*+]\s+/, '');
            listItems.push(`<li>${content}</li>`);
        } else if (line.match(/^\s*\d+\.\s+/)) {
            if (!inList) { inList = true; listType = 'ol'; }
            const content = line.replace(/^\s*\d+\.\s+/, '');
            listItems.push(`<li>${content}</li>`);
        } else {
            if (inList && listItems.length > 0) {
                resultLines.push(`<${listType}>${listItems.join('')}</${listType}>`);
                inList = false;
                listItems = [];
            }
            resultLines.push(line);
        }
    }
    if (inList && listItems.length > 0) {
        resultLines.push(`<${listType}>${listItems.join('')}</${listType}>`);
    }
    return resultLines.join('\n');
}

function processParagraphs(text) {
    const lines = text.split('\n');
    const resultLines = [];
    let currentParagraph = [];
    for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine === '') {
            if (currentParagraph.length > 0) {
                resultLines.push(`<p>${currentParagraph.join('<br>')}</p>`);
                currentParagraph = [];
            }
        } else if (line.startsWith('<') && (line.endsWith('>') || line.includes('</'))) {
            if (currentParagraph.length > 0) {
                resultLines.push(`<p>${currentParagraph.join('<br>')}</p>`);
                currentParagraph = [];
            }
            resultLines.push(line);
        } else {
            currentParagraph.push(line);
        }
    }
    if (currentParagraph.length > 0) {
        resultLines.push(`<p>${currentParagraph.join('<br>')}</p>`);
    }
    return resultLines.join('\n');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ================================================================
//  SANDBOXED JS RUNNER
// ================================================================
const JS_RUN_TIMEOUT_MS = 5000;
const activeFrames = new Map();

function buildSandboxDoc(code) {
    return `<!DOCTYPE html><html><head></head><body><script>
        (function () {
            const send = (type, payload) => {
                try { parent.postMessage({ __jsRunner: true, type, payload }, '*'); }
                catch (e) {}
            };
            ['log','info','warn','error'].forEach((level) => {
                console[level] = (...args) => {
                    send('console', {
                        level,
                        text: args.map(a => {
                            if (a instanceof Error) return a.stack || a.message;
                            if (typeof a === 'object' && a !== null) {
                                try { return JSON.stringify(a, null, 2); }
                                catch (e) { return String(a); }
                            }
                            return String(a);
                        }).join(' ')
                    });
                };
            });
            window.addEventListener('error', (e) => {
                send('error', { message: e.message, stack: e.error && e.error.stack });
            });
            window.addEventListener('unhandledrejection', (e) => {
                const reason = e.reason;
                send('error', {
                    message: 'Unhandled promise rejection: ' + (reason && reason.message ? reason.message : String(reason)),
                    stack: reason && reason.stack
                });
            });
            send('ready', {});
            (async () => {
                try {
                    const result = await (async () => {
                        ${code}
                    })();
                    if (result !== undefined) {
                        send('result', {
                            text: typeof result === 'object'
                                ? JSON.stringify(result, null, 2)
                                : String(result)
                        });
                    }
                    send('done', {});
                } catch (err) {
                    send('error', { message: err.message, stack: err.stack });
                    send('done', {});
                }
            })();
        })();
    <\/script></body></html>`;
}

function stopRun(codeId) {
    const entry = activeFrames.get(codeId);
    if (!entry) return;
    clearTimeout(entry.timer);
    if (entry.frame && entry.frame.parentNode) entry.frame.remove();
    activeFrames.delete(codeId);
}

function runJsInSandbox(codeId, rawCode, outputEl, runBtn) {
    stopRun(codeId);
    outputEl.style.display = 'block';
    outputEl.innerHTML = '';
    outputEl.dataset.state = 'running';

    const statusLine = document.createElement('div');
    statusLine.className = 'js-output-status';
    statusLine.textContent = 'Running…';
    outputEl.appendChild(statusLine);

    const consoleLines = [];
    let finished = false;
    let timedOut = false;
    let sandboxReady = false;

    const frame = document.createElement('iframe');
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.style.cssText = 'position:absolute;width:0;height:0;border:0;opacity:0;pointer-events:none;';

    if (runBtn) {
        runBtn.disabled = true;
        runBtn.classList.add('running');
    }

    function render() {
        outputEl.innerHTML = '';
        if (consoleLines.length) {
            const label = document.createTextNode('Output:\n');
            outputEl.appendChild(label);
            consoleLines.forEach(line => {
                const pre = document.createElement('pre');
                pre.textContent = line.text;
                if (line.level === 'error') pre.style.color = 'var(--md-sys-color-error)';
                else if (line.level === 'warn') pre.style.color = '#b8860b';
                outputEl.appendChild(pre);
            });
        }
        if (!consoleLines.length && finished && !timedOut) {
            outputEl.innerHTML = 'ℹ️ Code executed successfully but no output was produced. Use <code>console.log()</code> to display results.';
        }
        if (timedOut) {
            const warn = document.createElement('div');
            warn.style.color = 'var(--md-sys-color-error)';
            warn.innerHTML = sandboxReady ?
                `<strong>Stopped:</strong> execution exceeded ${JS_RUN_TIMEOUT_MS / 1000}s (likely an infinite loop) and was terminated.` :
                `<strong>⚠️ Sandbox failed to start.</strong> Try a hard refresh — the app may be running a cached version.`;
            outputEl.appendChild(warn);
        }
    }

    function onMessage(e) {
        const data = e.data;
        if (!data || !data.__jsRunner) return;
        if (e.source !== frame.contentWindow) return;

        if (data.type === 'ready') {
            sandboxReady = true;
        } else if (data.type === 'console') {
            consoleLines.push(data.payload);
            render();
        } else if (data.type === 'result') {
            consoleLines.push({ level: 'log', text: '↳ ' + data.payload.text });
            render();
        } else if (data.type === 'error') {
            finished = true;
            if (statusLine.parentNode) statusLine.remove();
            outputEl.innerHTML = `<strong style="color:var(--md-sys-color-error);">Error:</strong><br><pre>${escapeHtml(data.payload.message)}</pre>`;
            cleanup();
        } else if (data.type === 'done') {
            finished = true;
            if (statusLine.parentNode) statusLine.remove();
            render();
            cleanup();
        }
    }

    function cleanup() {
        window.removeEventListener('message', onMessage);
        const entry = activeFrames.get(codeId);
        if (entry) clearTimeout(entry.timer);
        activeFrames.delete(codeId);
        if (frame.parentNode) frame.remove();
        if (runBtn) {
            runBtn.disabled = false;
            runBtn.classList.remove('running');
        }
    }

    window.addEventListener('message', onMessage);
    frame.srcdoc = buildSandboxDoc(rawCode);
    document.body.appendChild(frame);

    const timer = setTimeout(() => {
        if (finished) return;
        timedOut = true;
        finished = true;
        if (statusLine.parentNode) statusLine.remove();
        render();
        cleanup();
    }, JS_RUN_TIMEOUT_MS);

    activeFrames.set(codeId, { frame, timer });
}

document.addEventListener('click', function(e) {
    const btn = e.target.closest('.run-js-btn');
    if (!btn) return;
    if (btn.disabled) return;

    const codeId = btn.getAttribute('data-code-id');
    const codeEl = document.getElementById(codeId);
    const outputEl = document.getElementById(`output-${codeId}`);
    if (!codeEl || !outputEl) return;

    const rawCode = codeEl.textContent;
    runJsInSandbox(codeId, rawCode, outputEl, btn);
});

document.addEventListener('click', function(e) {
    const btn = e.target.closest('.copy-code-btn');
    if (!btn) return;
    const codeId = btn.getAttribute('data-code-id');
    if (!codeId) return;
    const codeEl = document.getElementById(codeId);
    if (!codeEl) return;
    const text = codeEl.textContent;
    navigator.clipboard.writeText(text).then(() => {
        btn.innerHTML = `<i data-lucide="check" class="lucide"></i>`;
        btn.classList.add('copied');
        if (typeof lucide !== 'undefined') lucide.createIcons();
        setTimeout(() => {
            btn.innerHTML = `<i data-lucide="copy" class="lucide"></i>`;
            btn.classList.remove('copied');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }, 2000);
    }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch(e) {}
        document.body.removeChild(ta);
        btn.innerHTML = `<i data-lucide="check" class="lucide"></i>`;
        btn.classList.add('copied');
        if (typeof lucide !== 'undefined') lucide.createIcons();
        setTimeout(() => {
            btn.innerHTML = `<i data-lucide="copy" class="lucide"></i>`;
            btn.classList.remove('copied');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }, 2000);
    });
});

// ================================================================
//  THEME (light/dark toggle)
// ================================================================
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
let currentTheme = localStorage.getItem('endroid-theme') || 'system';

function applyTheme(theme) {
    document.body.classList.remove('theme-light', 'theme-dark');
    const icon = document.getElementById('themeIcon');
    if (theme === 'dark' || (theme === 'system' && prefersDark.matches)) {
        document.body.classList.add('theme-dark');
        if (icon) {
            icon.setAttribute('data-lucide', 'sun');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    } else {
        document.body.classList.add('theme-light');
        if (icon) {
            icon.setAttribute('data-lucide', 'moon');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    }
    currentTheme = theme;
    localStorage.setItem('endroid-theme', theme);
}
applyTheme(currentTheme);
prefersDark.addEventListener('change', () => {
    if (currentTheme === 'system') applyTheme('system');
});

// ================================================================
//  UI CONTROLLER
// ================================================================
const WORKER_URL = 'https://ai.endroid.workers.dev/api/v1/';
let webSearchEnabled = false;
let themeModeEnabled = false;

const UI = {
    chatContainer: document.getElementById('chatContainer'),
    welcomeEl: document.getElementById('welcomeMessage'),
    chatList: document.getElementById('chatList'),
    sidebar: document.getElementById('sidebar'),
    overlay: document.getElementById('sidebarOverlay'),
    dropdown: document.getElementById('dropdownMenu'),
    modalOverlay: document.getElementById('modalOverlay'),
    modalTitle: document.getElementById('modalTitle'),
    modalMessage: document.getElementById('modalMessage'),
    modalInput: document.getElementById('modalInput'),
    modalConfirm: document.getElementById('modalConfirm'),
    modalCancel: document.getElementById('modalCancel'),
    input: document.getElementById('messageInput'),
    sendBtn: document.getElementById('sendBtn'),
    error: document.getElementById('error'),
    plusBtn: document.getElementById('plusBtn'),
    popoverPanel: document.getElementById('popoverPanel'),
    modeChip: document.getElementById('modeChip'),
    modeLabel: document.getElementById('modeLabel'),
    modeSelectPanel: document.getElementById('modeSelectPanel'),
    webSearchToggle: document.getElementById('webSearchToggle'),
    webSearchIndicator: document.getElementById('webSearchIndicator'),
    themeModeToggle: document.getElementById('themeModeToggle'),
    themeModeIndicator: document.getElementById('themeModeIndicator'),
    resetThemePopover: document.getElementById('resetThemePopover'),
    activeChips: document.getElementById('activeChips'),
    sidebarToggle: document.getElementById('sidebarToggle'),

    _typingId: null,
    _dropdownTargetId: null,
    _errorTimer: null,
    _currentMode: 'chat',
    _isProcessing: false,

    init() {
        ThemeEngine.init();
        this._bindEvents();
        this.render();
        this._restoreThemeFromStorage();
        this._syncUIState();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    _restoreThemeFromStorage() {
        try {
            const saved = localStorage.getItem('endroid_applied_theme');
            if (saved) {
                const data = JSON.parse(saved);
                if (data && (data.cssVariables || data.mode)) {
                    ThemeEngine.apply(data);
                }
            }
        } catch(e) { console.warn('Theme restore failed:', e); }
    },

    _syncUIState() {
        const isImage = (this._currentMode === 'image');
        this.modeChip.classList.toggle('active', isImage);
        this.modeLabel.textContent = isImage ? 'Image' : 'Chat';
        const icon = this.modeChip.querySelector('.lucide');
        if (icon) {
            icon.setAttribute('data-lucide', isImage ? 'image' : 'zap');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
        this.modeSelectPanel.querySelectorAll('.mode-option').forEach(opt => {
            opt.classList.toggle('active-opt', opt.dataset.mode === this._currentMode);
        });
        this.webSearchIndicator.textContent = webSearchEnabled ? 'On' : 'Off';
        this.webSearchToggle.classList.toggle('active', webSearchEnabled);
        this.themeModeIndicator.textContent = themeModeEnabled ? 'On' : 'Off';
        this.themeModeToggle.classList.toggle('active', themeModeEnabled);
        this.sendBtn.disabled = !this.input.value.trim() || this._isProcessing;
        this._updateActiveChips();
    },

    _updateActiveChips() {
        const container = this.activeChips;
        container.innerHTML = '';
        if (this._currentMode === 'image') {
            const chip = document.createElement('div');
            chip.className = 'active-chip image-chip';
            chip.innerHTML = `<i data-lucide="image" class="chip-icon lucide"></i> Image <button class="chip-close" data-mode="image">×</button>`;
            container.appendChild(chip);
        }
        if (webSearchEnabled) {
            const chip = document.createElement('div');
            chip.className = 'active-chip web-chip';
            chip.innerHTML = `<i data-lucide="globe" class="chip-icon lucide"></i> Web <button class="chip-close" data-mode="web">×</button>`;
            container.appendChild(chip);
        }
        if (themeModeEnabled) {
            const chip = document.createElement('div');
            chip.className = 'active-chip theme-chip';
            chip.innerHTML = `<i data-lucide="palette" class="chip-icon lucide"></i> Theme <button class="chip-close" data-mode="theme">×</button>`;
            container.appendChild(chip);
        }
        container.querySelectorAll('.chip-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = btn.dataset.mode;
                if (mode === 'image') this._currentMode = 'chat';
                else if (mode === 'web') webSearchEnabled = false;
                else if (mode === 'theme') themeModeEnabled = false;
                this._syncUIState();
                this._recreateIcons();
                this.input.focus();
            });
        });
        this._recreateIcons();
    },

    _bindEvents() {
        this.sidebarToggle.addEventListener('click', () => this.openSidebar());
        document.getElementById('sidebarClose').addEventListener('click', () => this.closeSidebar());
        this.overlay.addEventListener('click', () => this.closeSidebar());

        document.getElementById('newChatBtn').addEventListener('click', () => {
            this.closeSidebar();
            this.newChat();
        });

        this.modalCancel.addEventListener('click', () => this.closeModal());
        this.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) this.closeModal();
        });
        this.modalConfirm.addEventListener('click', () => this._handleModalConfirm());

        document.addEventListener('click', (e) => {
            const target = e.target.closest('.dropdown-menu') || e.target.closest('.chat-menu-btn');
            if (!target) this.closeDropdown();
        });
        document.getElementById('dropdownPin').addEventListener('click', () => {
            const id = this._dropdownTargetId;
            if (!id) return;
            chatManager.togglePin(id);
            this.closeDropdown();
            this.render();
            this.renderChat(chatManager.activeId);
            this._recreateIcons();
        });
        document.getElementById('dropdownRename').addEventListener('click', () => {
            const id = this._dropdownTargetId;
            if (!id) return;
            const chat = chatManager.getChat(id);
            if (chat) {
                this.closeDropdown();
                this.openRenameModal(id, chatManager.getTitle(chat));
            }
        });
        document.getElementById('dropdownDelete').addEventListener('click', () => {
            const id = this._dropdownTargetId;
            if (!id) return;
            const chat = chatManager.getChat(id);
            if (chat) {
                this.closeDropdown();
                this.openDeleteModal(id, chatManager.getTitle(chat));
            }
        });

        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        this.input.addEventListener('input', () => {
            this.sendBtn.disabled = !this.input.value.trim() || this._isProcessing;
            this.input.style.height = 'auto';
            const newHeight = Math.min(this.input.scrollHeight, 100);
            this.input.style.height = newHeight + 'px';
        });
        this.sendBtn.disabled = true;

        document.getElementById('themeToggle').addEventListener('click', () => {
            const isDark = document.body.classList.contains('theme-dark');
            applyTheme(isDark ? 'light' : 'dark');
        });

        this.plusBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.popoverPanel.classList.toggle('open');
        });
        document.addEventListener('click', (e) => {
            if (!this.popoverPanel.contains(e.target) && e.target !== this.plusBtn) {
                this.popoverPanel.classList.remove('open');
            }
        });

        this.modeChip.addEventListener('click', (e) => {
            e.stopPropagation();
            this.modeSelectPanel.classList.toggle('open');
        });
        document.addEventListener('click', (e) => {
            if (!this.modeSelectPanel.contains(e.target) && e.target !== this.modeChip) {
                this.modeSelectPanel.classList.remove('open');
            }
        });
        this.modeSelectPanel.querySelectorAll('.mode-option').forEach(opt => {
            opt.addEventListener('click', () => {
                this._currentMode = opt.dataset.mode;
                this.modeSelectPanel.classList.remove('open');
                this._syncUIState();
                this._recreateIcons();
                this.input.focus();
            });
        });

        this.webSearchToggle.addEventListener('click', () => {
            if (this._currentMode === 'image') {
                this.showError('Web search is disabled in Image mode.');
                return;
            }
            webSearchEnabled = !webSearchEnabled;
            if (webSearchEnabled) themeModeEnabled = false;
            this._syncUIState();
            this._recreateIcons();
            this.popoverPanel.classList.remove('open');
        });

        this.themeModeToggle.addEventListener('click', () => {
            themeModeEnabled = !themeModeEnabled;
            if (themeModeEnabled) {
                webSearchEnabled = false;
                this._currentMode = 'chat';
            }
            this._syncUIState();
            this._recreateIcons();
            this.popoverPanel.classList.remove('open');
            this.input.focus();
        });

        this.resetThemePopover.addEventListener('click', () => {
            this.popoverPanel.classList.remove('open');
            this._resetTheme();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.popoverPanel.classList.remove('open');
                this.modeSelectPanel.classList.remove('open');
                this.closeSidebar();
                this.closeDropdown();
                this.closeModal();
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                this.toggleSidebar();
            }
        });
    },

    _recreateIcons() {
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    openSidebar() {
        this.sidebar.classList.add('open');
        this.overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
        this.render();
        this._recreateIcons();
    },
    closeSidebar() {
        this.sidebar.classList.remove('open');
        this.overlay.classList.remove('open');
        document.body.style.overflow = '';
        this.closeDropdown();
    },
    toggleSidebar() {
        if (this.sidebar.classList.contains('open')) this.closeSidebar();
        else this.openSidebar();
    },

    openDropdown(chatId, btnElement) {
        this.closeDropdown();
        this._dropdownTargetId = chatId;
        const rect = btnElement.getBoundingClientRect();
        const dropdown = this.dropdown;
        const chat = chatManager.getChat(chatId);
        if (chat) {
            const pinLabel = chat.pinned ? 'Unpin' : 'Pin';
            document.getElementById('dropdownPin').innerHTML =
                `<i data-lucide="${chat.pinned ? 'pin-off' : 'pin'}" class="lucide" style="width:18px;height:18px;stroke-width:1.8;"></i> ${pinLabel}`;
        }
        dropdown.style.left = Math.min(rect.left - 140 + rect.width, window.innerWidth - 170) + 'px';
        dropdown.style.top = (rect.bottom + 6) + 'px';
        dropdown.classList.add('open');
        this._recreateIcons();
    },
    closeDropdown() {
        this.dropdown.classList.remove('open');
        this._dropdownTargetId = null;
    },

    openModal(title, message, confirmText, isDanger, callback) {
        this.modalTitle.textContent = title;
        this.modalMessage.textContent = message;
        this.modalInput.classList.add('hidden');
        this.modalConfirm.textContent = confirmText || 'Confirm';
        this.modalConfirm.className = isDanger ? 'btn-danger' : 'btn-primary';
        this.modalOverlay.classList.add('open');
        this._modalCallback = callback || null;
    },
    openRenameModal(chatId, currentTitle) {
        this.modalTitle.textContent = 'Rename Chat';
        this.modalMessage.textContent = 'Enter a new name for this chat:';
        this.modalInput.classList.remove('hidden');
        this.modalInput.value = currentTitle;
        this.modalInput.select();
        this.modalConfirm.textContent = 'Save';
        this.modalConfirm.className = 'btn-primary';
        this.modalOverlay.classList.add('open');
        this._modalCallback = (value) => {
            if (value && value.trim()) {
                chatManager.renameChat(chatId, value.trim());
                this.render();
                this.renderChat(chatManager.activeId);
                this._recreateIcons();
            }
        };
        setTimeout(() => this.modalInput.focus(), 50);
    },
    openDeleteModal(chatId, chatTitle) {
        this.openModal(
            'Delete Chat',
            `Are you sure you want to delete "${chatTitle}"? This cannot be undone.`,
            'Delete',
            true,
            () => {
                chatManager.deleteChat(chatId);
                this.render();
                this.renderChat(chatManager.activeId);
                this._recreateIcons();
            }
        );
    },
    closeModal() {
        this.modalOverlay.classList.remove('open');
        this._modalCallback = null;
    },
    _handleModalConfirm() {
        const cb = this._modalCallback;
        const inputVal = this.modalInput.value;
        if (cb) {
            if (!this.modalInput.classList.contains('hidden')) cb(inputVal);
            else cb(true);
        }
        this.closeModal();
    },

    render() {
        this._renderChatList();
        document.querySelectorAll('.chat-item').forEach(el => {
            el.classList.toggle('active', el.dataset.chatId === chatManager.activeId);
        });
        this._recreateIcons();
    },

    _renderChatList() {
        const container = this.chatList;
        const sorted = chatManager.getSortedChats();
        if (sorted.length === 0) {
            container.innerHTML = `<div class="chat-list-empty">No chats yet.<br>Click "New Chat" to start.</div>`;
            return;
        }
        let html = '';
        sorted.forEach(chat => {
            const title = chatManager.getTitle(chat);
            const preview = chatManager.getPreview(chat);
            const isActive = chat.id === chatManager.activeId;
            const pinIcon = chat.pinned ? `<i data-lucide="pin" class="pin-icon lucide" style="width:14px;height:14px;stroke-width:2;"></i>` : '';
            html += `
                <div class="chat-item ${isActive ? 'active' : ''}" data-chat-id="${chat.id}">
                    <div class="chat-info">
                        <div class="chat-title">${this._escapeHtml(title)}</div>
                        <div class="chat-meta">
                            ${pinIcon}
                            <span>${this._escapeHtml(preview)}</span>
                        </div>
                    </div>
                    <button class="chat-menu-btn" data-chat-id="${chat.id}" aria-label="Chat menu">
                        <i data-lucide="more-vertical" class="lucide" style="width:18px;height:18px;stroke-width:1.8;"></i>
                    </button>
                </div>
            `;
        });
        container.innerHTML = html;

        container.querySelectorAll('.chat-item').forEach(el => {
            const id = el.dataset.chatId;
            el.addEventListener('click', (e) => {
                if (e.target.closest('.chat-menu-btn')) return;
                if (id) {
                    chatManager.switchTo(id);
                    this.render();
                    this.renderChat(id);
                    this.closeSidebar();
                    this.input.focus();
                    this._recreateIcons();
                }
            });
            const menuBtn = el.querySelector('.chat-menu-btn');
            if (menuBtn) {
                menuBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const cid = menuBtn.dataset.chatId || id;
                    if (cid) this.openDropdown(cid, menuBtn);
                });
            }
        });
        this._recreateIcons();
    },

    renderChat(chatId) {
        const container = this.chatContainer;
        const chat = chatManager.getChat(chatId);
        container.innerHTML = '';
        const welcomeEl = document.getElementById('welcomeMessage');
        if (welcomeEl) container.appendChild(welcomeEl);

        if (!chat || chat.messages.length === 0) {
            if (welcomeEl) welcomeEl.style.display = 'flex';
            this._recreateIcons();
            return;
        }
        if (welcomeEl) welcomeEl.style.display = 'none';

        chat.messages.forEach(msg => {
            this._addMessageToDOM(msg.role, msg.text, false);
        });
        container.scrollTop = container.scrollHeight;
        this._recreateIcons();
    },

    _addMessageToDOM(role, text, isTyping) {
        const container = this.chatContainer;
        const welcomeEl = document.getElementById('welcomeMessage');

        if (welcomeEl && container.contains(welcomeEl) && (role === 'user' || role === 'assistant')) {
            welcomeEl.style.display = 'none';
        }

        if (isTyping && role === 'assistant') {
            this._removeTypingIndicator();
            const typingDiv = document.createElement('div');
            typingDiv.className = 'message bot typing';
            typingDiv.id = 'typingIndicator';
            typingDiv.innerHTML = `
                <div class="typing-indicator">
                    <div class="typing-spinner">
                        <i data-lucide="loader-circle" class="lucide" style="width:22px;height:22px;stroke-width:2;"></i>
                    </div>
                    <span class="typing-text">Aariz is thinking</span>
                </div>
            `;
            container.appendChild(typingDiv);
            this._typingId = 'typingIndicator';
            container.scrollTop = container.scrollHeight;
            this._recreateIcons();
            return typingDiv;
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role === 'assistant' ? 'bot' : role}`;

        if (role === 'assistant') {
            const renderedHtml = renderMarkdown(text);
            messageDiv.innerHTML = renderedHtml;
            setTimeout(() => { this._recreateIcons(); }, 0);
        } else {
            messageDiv.textContent = text;
        }

        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
        this._recreateIcons();
        return messageDiv;
    },

    _removeTypingIndicator() {
        const el = document.getElementById('typingIndicator');
        if (el) { el.remove(); this._typingId = null; }
    },

    newChat() {
        if (chatManager.chats.length >= MAX_CHATS) {
            this.showError(`Maximum ${MAX_CHATS} chats allowed. Delete one to create a new chat.`);
            return;
        }
        const chat = chatManager.createChat('New Chat');
        if (chat) {
            this.render();
            this.renderChat(chat.id);
            this.input.focus();
            this._recreateIcons();
            setTimeout(() => { this.openRenameModal(chat.id, 'New Chat'); }, 200);
        }
    },

    async sendMessage() {
        const input = this.input;
        const text = input.value.trim();
        if (!text || this._isProcessing) return;

        const active = chatManager.getActive();
        if (!active) {
            this.showError('No active chat. Create a new chat first.');
            return;
        }

        input.value = '';
        input.style.height = 'auto';
        this._isProcessing = true;
        this.sendBtn.disabled = true;

        if (themeModeEnabled) {
            await this._handleThemeGeneration(text, active);
            this._isProcessing = false;
            this.sendBtn.disabled = !this.input.value.trim() || this._isProcessing;
            setTimeout(() => input.focus(), 100);
            this.render();
            this._recreateIcons();
            return;
        }

        this._addMessageToDOM('user', text, false);
        chatManager.addMessage(active.id, 'user', text);
        this.render();

        if (this._currentMode === 'image') {
            this._addMessageToDOM('assistant', '', true);
            try {
                const enhanced = await this._getEnhancedPrompt(text);
                this._removeTypingIndicator();
                this._addMessageToDOM('assistant', '', true);
                const imageUrl = `https://api.omegatech.app/api/ai/flux?prompt=${encodeURIComponent(enhanced)}`;
                const finalMessage = `Here is image:\n\n![Generated Image](${imageUrl})`;
                this._removeTypingIndicator();
                this._addMessageToDOM('assistant', finalMessage, false);
                chatManager.addMessage(active.id, 'assistant', finalMessage);
            } catch (err) {
                this._removeTypingIndicator();
                const errMsg = this._friendlyError(err);
                this._addMessageToDOM('assistant', errMsg, false);
                chatManager.addMessage(active.id, 'assistant', errMsg);
                this.showError(err.message);
            } finally {
                this._isProcessing = false;
                this.sendBtn.disabled = !this.input.value.trim() || this._isProcessing;
                setTimeout(() => input.focus(), 100);
                this.render();
                this._recreateIcons();
            }
        } else {
            this._addMessageToDOM('assistant', '', true);
            try {
                const response = await this._callAPI(text, active.id);
                this._removeTypingIndicator();
                this._addMessageToDOM('assistant', response, false);
                chatManager.addMessage(active.id, 'assistant', response);
            } catch (err) {
                this._removeTypingIndicator();
                const errMsg = this._friendlyError(err);
                this._addMessageToDOM('assistant', errMsg, false);
                chatManager.addMessage(active.id, 'assistant', errMsg);
                this.showError(err.message);
            } finally {
                this._isProcessing = false;
                this.sendBtn.disabled = !this.input.value.trim() || this._isProcessing;
                setTimeout(() => input.focus(), 100);
                this.render();
                this._recreateIcons();
            }
        }
    },

    async _handleThemeGeneration(prompt, active) {
        this._addMessageToDOM('user', prompt, false);
        chatManager.addMessage(active.id, 'user', prompt);
        this.render();

        this._addMessageToDOM('assistant', '', true);
        try {
            const systemPrompt = ThemeEngine.getThemePrompt(prompt);
            const response = await this._callAPI(systemPrompt, active.id, true);

            this._removeTypingIndicator();

            let themeData = null;
            try {
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    themeData = JSON.parse(jsonMatch[0]);
                } else {
                    themeData = JSON.parse(response);
                }
            } catch (parseErr) {
                console.warn('Failed to parse theme JSON:', parseErr);
                const errMsg = 'Sorry, I couldn\'t generate a valid theme. Please try again with a more specific description.';
                this._addMessageToDOM('assistant', errMsg, false);
                chatManager.addMessage(active.id, 'assistant', errMsg);
                return;
            }

            if (!themeData || typeof themeData !== 'object') {
                throw new Error('Invalid theme data');
            }

            const applied = ThemeEngine.apply(themeData);
            if (!applied) {
                throw new Error('Failed to apply theme');
            }

            const themeName = themeData.name || 'Custom Theme';
            const mode = themeData.mode || 'light';
            let particleEmoji = '';
            if (themeData.particles && themeData.particles.type && themeData.particles.type !== 'none') {
                const emojis = { snow: '❄️', stars: '✨', confetti: '🎉', bubbles: '🫧', rain: '🌧️' };
                particleEmoji = emojis[themeData.particles.type] || '✨';
            }
            const successMsg = `🎨 **Theme Applied: ${themeName}** ${particleEmoji}\n\nMode: **${mode === 'dark' ? '🌙 Dark' : '☀️ Light'}**\nTo reset, click the **+** button and select "Reset Theme".`;
            this._addMessageToDOM('assistant', successMsg, false);
            chatManager.addMessage(active.id, 'assistant', successMsg);

            themeModeEnabled = false;
            this._syncUIState();
            this._recreateIcons();

        } catch (err) {
            this._removeTypingIndicator();
            const errMsg = this._friendlyError(err);
            this._addMessageToDOM('assistant', errMsg, false);
            chatManager.addMessage(active.id, 'assistant', errMsg);
            this.showError(err.message);
        } finally {
            this._isProcessing = false;
            this.sendBtn.disabled = !this.input.value.trim() || this._isProcessing;
            setTimeout(() => this.input.focus(), 100);
            this.render();
            this._recreateIcons();
        }
    },

    _resetTheme() {
        ThemeEngine.reset();
        const container = this.chatContainer;
        const note = document.createElement('div');
        note.className = 'theme-notification';
        note.innerHTML = `
            <span>↩️ Default theme restored</span>
            <button class="notif-dismiss">×</button>
        `;
        const welcome = container.querySelector('#welcomeMessage');
        if (welcome) {
            container.insertBefore(note, welcome.nextSibling);
        } else {
            container.prepend(note);
        }
        note.querySelector('.notif-dismiss').addEventListener('click', () => note.remove());
        setTimeout(() => { if (note.parentNode) note.remove(); }, 4000);
        this._recreateIcons();
        const active = chatManager.getActive();
        if (active) {
            const resetMsg = '🔄 Theme reset to default.';
            this._addMessageToDOM('assistant', resetMsg, false);
            chatManager.addMessage(active.id, 'assistant', resetMsg);
        }
    },

    async _getEnhancedPrompt(userPrompt) {
        const instruction = `Enhance this prompt for image generation. Return ONLY the enhanced prompt, with no additional text, no markdown, no code fences, no explanations: ${userPrompt}`;
        const response = await this._callAPI(instruction, null, true);
        return response.trim();
    },

    async _callAPI(userMessage, chatId, skipHistory = false) {
        let history = [];
        if (!skipHistory && chatId) {
            const chat = chatManager.getChat(chatId);
            if (chat) {
                const recent = chat.messages.slice(-8);
                history = recent.map(msg => ({
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    content: msg.text
                }));
            }
        }
        const payload = {
            prompt: userMessage,
            web_search: webSearchEnabled && !themeModeEnabled && this._currentMode !== 'image',
            history: history,
        };
        const resp = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!resp.ok) {
            let err = `Worker error: ${resp.status}`;
            if (resp.status === 401) err = 'Unauthorized - check your worker';
            if (resp.status === 429) err = 'Rate limit exceeded';
            if (resp.status >= 500) err = 'Worker server error';
            throw new Error(err);
        }
        return await resp.text();
    },

    _friendlyError(err) {
        const msg = err.message || '';
        if (msg.includes('401')) return 'Authentication failed. Please check your worker.';
        if (msg.includes('429')) return 'Rate limit reached. Please try again later.';
        if (msg.includes('network')) return 'Network error. Please check your connection.';
        return `I encountered an error: ${msg}`;
    },

    showError(msg) {
        const el = this.error;
        el.textContent = msg;
        el.classList.remove('hidden');
        clearTimeout(this._errorTimer);
        this._errorTimer = setTimeout(() => el.classList.add('hidden'), 5000);
    },

    _escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// ================================================================
//  BOOT
// ================================================================
document.addEventListener('DOMContentLoaded', function() {
    chatManager.init();
    UI.init();
    UI.renderChat(chatManager.activeId);
    UI.input.focus();
    if (typeof lucide !== 'undefined') lucide.createIcons();

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('SW registered:', reg.scope))
                .catch(err => console.error('SW registration failed:', err));
        });
    }

    let deferredPrompt;
    const installBanner = document.getElementById('installBanner');
    const installBtn = document.getElementById('installBtn');
    const dismissBtn = document.getElementById('dismissInstall');
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (installBanner) installBanner.classList.remove('hidden');
    });
    if (installBtn) {
        installBtn.addEventListener('click', () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') console.log('User installed');
                    deferredPrompt = null;
                    if (installBanner) installBanner.classList.add('hidden');
                });
            }
        });
    }
    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
            if (installBanner) installBanner.classList.add('hidden');
        });
    }
});

# Aariz

**Aariz** is a mobile-first AI chat app by **Project Endroid** (Mudasir Wazir).

**Live:** https://wized2.github.io/Ai/

## Features

- Clear system identity and response rules (short, useful, mobile-readable)
- Chat history in `localStorage` (migrates from older Endroid keys)
- Light / dark / system theme
- Optional web search and image modes (via worker + Flux)
- Theme-generation mode for the UI itself
- PWA installable
- Request abort / stop, timeouts tuned for mobile
- Reduced particle load on small screens and `prefers-reduced-motion`

## Stack

- Vanilla HTML / CSS / JS
- Lucide icons
- API worker: `https://ai.endroid.workers.dev/api/v1/`

## System instructions (client)

Every chat request sends a full **Aariz** system prompt (`system`, `system_instruction`, `instructions`) so the worker can pin identity even if only one field is read.

## License

MIT — see `LICENSE`.

# 🎮 FiveM Loading Screen

A modern, animated loading screen for FiveM servers — built with vanilla HTML, CSS and JavaScript. No frameworks, no dependencies.

---

## ✨ Features

- Animated background slideshow with smooth transitions
- Real-time loading progress synced with FiveM's `loadFraction`
- Live loading steps (Initializing engine, Loading shaders, etc.)
- Web Audio API visualizer (real frequency bars)
- Custom animated cursor
- Music player with volume control + localStorage persistence
- Side panel overlays: **Patch Notes**, **Base Rules**, **Staff**
- Info tips bar with rotation
- Fully configurable via `config.lua`

---

## 📁 Structure

```
loading-screen/
├── index.html
├── script.js
├── styles.css
├── config.lua
├── fxmanifest.lua
└── assets/
    ├── image/
    │   ├── bg1.jpg ... bgN.jpg   ← background slides
    │   └── server-logo.png
    └── music/
        └── remix-theme-music.mp3
```

---

## ⚙️ Configuration

Everything is in `config.lua`:

```lua
Config.DiscordInvite = "DISCORD.GG/YOURSERVER"

Config.InfoTips = {
    "Your tip here",
    ...
}

Config.PatchNotes = {
    { version = "v1.0.0", entries = { "Entry 1", "Entry 2" } }
}

Config.BaseRules = {
    "Rule 1",
    "Rule 2",
    ...
}

Config.Staff = {
    { role = "owner",   name = "YourName" },
    { role = "dev",     name = "YourName" },
    { role = "admin",   name = "YourName" },
    { role = "mod",     name = "YourName" },
    { role = "support", name = "YourName" }
}
```

---

## 🖼️ Adding Backgrounds

Drop your images in `assets/image/` named `bg1.jpg`, `bg2.jpg`, etc.  
The script auto-discovers them up to `bg20.jpg`.

---

## 🎵 Music

Replace `assets/music/remix-theme-music.mp3` with your own track.  
Volume is saved in `localStorage` between sessions.

**Controls:**
- `SPACE` or `M` — pause / resume
- `↑` / `↓` — volume up / down
- Click `−` / `+` buttons on the player

---

## 🚀 Installation

1. Drop the `loading-screen` folder into your FiveM `resources/` directory
2. Add to your `server.cfg`:
```
ensure loading-screen
```
3. Edit `config.lua` with your server info
4. Replace logo, backgrounds and music with your own assets

---

## 🔧 fxmanifest.lua

```lua
fx_version 'cerulean'
game 'gta5'

loadscreen 'index.html'
loadscreen_cursor 'yes'
loadscreen_manual_shutdown 'yes'
```

> `loadscreen_manual_shutdown 'yes'` keeps the screen visible until the server sends the shutdown signal — recommended for a smoother experience.

---

## 📜 License

Free to use and modify. Credit appreciated but not required.

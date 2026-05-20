# Termpad

A lightweight desktop terminal launcher. Define named profiles — each a list of shell commands — and launch them with one click. All commands run in a real PTY inside a built-in xterm terminal.

---

## How it works

**Profiles** are saved collections of shell commands that run top-to-bottom in a single shell session. Because commands share a process, things like `cd`, `export`, and `source` carry across commands naturally.

**Groups** let you bundle multiple profiles together so they all launch at once, each in its own terminal tab.

**The terminal panel** is a full xterm.js terminal wired to a real PTY — you get color, cursor movement, and interactive programs (vim, htop, etc.) just as you would in a normal terminal. Each tab has a close button and can be split into multiple independent panes.

**Aliases** defined in a profile (or globally in App Settings) are silently injected into the shell at launch so you can type them directly — no clicking required. Supports bash, zsh, and fish.

**Variables** used in commands via `{{name}}` syntax can have pre-defined defaults in the profile's Variables section. If all variables have defaults, launch skips the prompt entirely.

### Under the hood

```
Electron window
  └─ Embedded HTTP server (server.js)
       ├─ Serves the UI (public/)
       └─ REST + SSE API
            ├─ POST /api/sessions   → spawns a pty running your commands
            ├─ GET  /api/sessions/:id/events  → streams output line-by-line
            ├─ POST /api/shells     → opens a persistent interactive shell
            └─ POST /api/shells/:id/input     → sends keystrokes to the shell
```

Profiles are stored in your OS user-data directory (`~/.config/Termpad/profiles.json` on Linux) so they survive updates.

---

## Install

### Linux

```bash
curl -fsSL https://raw.githubusercontent.com/pkp2024/termpad/main/install.sh | bash
```

- Downloads the latest AppImage, installs it to `~/.local/bin/`
- Creates a `.desktop` entry so it appears in your app launcher automatically

Open it from your app menu by searching **Termpad**, or from the terminal:

```bash
termpad
```

> If `~/.local/bin` is not on your `PATH`, add this to `~/.bashrc` or `~/.zshrc`:
> ```bash
> export PATH="$HOME/.local/bin:$PATH"
> ```

### macOS

```bash
curl -fsSL https://raw.githubusercontent.com/pkp2024/termpad/main/install.sh | bash
```

- Downloads the latest `.dmg` and copies `Termpad.app` to `/Applications/`

Open it from Launchpad or run:

```bash
open "/Applications/Termpad.app"
```

---

## Build from source

**Prerequisites:** Node.js 18+, npm

```bash
git clone https://github.com/pkp2024/termpad.git
cd termpad
npm install

# Run in Electron
npm run desktop

# Build a distributable
npm run dist
```

---

## Usage

1. Click **New profile** in the sidebar
2. Give it a name and add your commands (use `{{varName}}` for dynamic values)
3. Optionally add **Variables** with defaults so launch skips the prompt
4. Optionally add **Aliases** that will be available to type directly in the shell
5. Toggle **Stop on first error** if you want the run to abort on a non-zero exit
6. Click **Launch** — output streams into the terminal panel on the right
7. Use **New group** to bundle profiles and launch them all at once in separate tabs
8. Click **App Settings** at the bottom of the sidebar to configure global aliases

You can also launch a profile directly from the terminal:

```bash
termpad "My Profile"
```

Or open a shell in a specific directory:

```bash
termpad --cwd /path/to/project
```

---

## Changelog

### v1.20.0

- **Redesigned profile manager** — Commands section is now the primary section, promoted to the top with a teal accent border and highlighted header; Stop on first error moved inside the Commands section where it belongs
- **Section count badges** — Commands, Variables, and Aliases headers display a live count badge showing how many items are defined
- **Native window title** — the active profile or group name is shown in the OS window title bar instead of consuming UI space
- **Compact terminal header** — tabs bar and toolbar reduced to slim single-row bars; decorative window-control dots removed
- **Improved contrast** — borders, surface layers, and muted text are all lighter for better visual depth and readability
- **Collapsed action bar** — Save and Launch buttons moved into a compact strip at the top of the editor panel; large profile-name heading removed

### v1.19.0

- **Profile manager in separate window** — clicking ☰ in the terminal toolbar opens the profile manager in its own window; if already open, brings it to the front without interrupting the terminal
- **Script mode variables** — `{{variable}}` placeholders in script mode commands now prompt correctly at launch and support pre-defined defaults, matching list mode behaviour
- **Group launch script variables** — profiles using script mode inside a group now have their variables resolved before launch, same as list mode profiles
- **Closeable tabs** — each terminal tab has an × button (visible on hover) to close it; closing the last tab opens a fresh one automatically

### v1.18.0

- **Profile variables section** — define `{{variable}}` names and optional default values directly in the profile editor; launch skips the prompt for any variable that has a default
- **Global aliases** — App Settings (sidebar footer) hosts a global alias list injected into every profile's shell at launch; profile-level aliases take precedence on name conflicts
- **Shell alias injection** — profile and global aliases are loaded silently via `bash --init-file`, `ZDOTDIR` (zsh), or `-C` (fish) so they work when typed directly in the terminal
- **Closeable terminal tabs** — each tab has an × button that appears on hover; closing the last tab opens a fresh one automatically

### v1.15.0

- **Update banner: copy install command** — "Copy install command" button copies the one-liner to clipboard so updating is a single paste into any terminal

### v1.14.0

- **Update banner** — shows a notification bar when a newer version is available; prompts restart when update is downloaded (AppImage with FUSE) or directs to the install script (extracted mode)

### v1.13.0

- **YAML theme editor** — toggle between the swatch picker and a YAML editor to fine-tune any theme color; changes apply live to the terminal
- **Custom themes** — save any YAML configuration as a named theme that appears in the swatch picker alongside built-in themes
- **MRU swatch slots** — the 4 visible swatches always show your most recently used themes; a "More ▾" dropdown lists all themes and promotes any selection into the visible slots
- **Script mode** — toggle any profile's commands between the list UI and a free-form script textarea; both modes stay in sync
- **Delete custom themes** — hover a custom theme in the "More ▾" dropdown to reveal a delete button

### v1.12.0

- **Collapsible profile editor sections** — Appearance, Logging, and Commands sections collapse independently to reduce clutter
- **Collapsible sidebar sections** — Profiles and Groups sections collapse independently with scroll overflow when space is tight
- **Profile manager toggle** — close the profile manager panel without closing the app; reopen it with the ☰ button in the terminal toolbar
- **Terminal windows survive manager close** — terminal sessions continue running after the profile manager window is closed
- **CLI profile launch** — pass a profile name as an argument (`termpad "My Profile"`) to launch it directly; falls back to the manager if not found
- **`--cwd` CLI flag** — `termpad --cwd /path` opens an interactive shell in the given directory

### v1.11.0

- **Per-profile appearance** — each profile stores its own theme, font, and log format settings independently
- **Per-pane split direction** — split any terminal pane right or down with dedicated toolbar buttons and a right-click context menu

### v1.10.0

- **Terminal copy** — select text in any pane to copy it to the clipboard
- **Auto-updates** — the app checks for new releases on startup and shows a banner when one is available

### v1.9.0

- **Nautilus integration** — right-click any folder in the file manager to open it in Termpad via an "Open in Termpad" context menu entry

### v1.8.0

- **Split terminal** — divide the terminal panel into multiple panes, each running its own independent shell or profile
- **Profile variables** — use `{{VAR}}` placeholders in commands; a prompt collects values before launch

### v1.7.0 and earlier

- **Cross-platform builds** — Linux AppImage and macOS DMG distributed via GitHub Releases with a GitHub Actions workflow
- **One-line installer** — `curl | bash` install script for Linux and macOS with automatic FUSE handling on Linux
- **Group launch** — bundle multiple profiles into a group; launching opens each in its own tab
- **Renamed to Termpad** — previously called "Warp Profiles"

#!/usr/bin/env bash
set -euo pipefail

REPO="pkp2024/warp-like"
APP_NAME="warp-profiles"
INSTALL_DIR="$HOME/.local/bin"
DESKTOP_DIR="$HOME/.local/share/applications"
ICON_DIR="$HOME/.local/share/icons"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

info()  { echo -e "${BLUE}[*]${NC} $1"; }
ok()    { echo -e "${GREEN}[✓]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1" >&2; exit 1; }

[ "$(uname -s)" = "Linux" ] || error "This installer only supports Linux."
command -v curl >/dev/null || error "curl is required but not installed."

info "Fetching latest release from GitHub..."
LATEST=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest")
DOWNLOAD_URL=$(echo "$LATEST" | grep -o '"browser_download_url": *"[^"]*\.AppImage"' | grep -o 'https://[^"]*' | head -1)
VERSION=$(echo "$LATEST" | grep -o '"tag_name": *"[^"]*"' | grep -o '"[^"]*"$' | tr -d '"')

[ -n "$DOWNLOAD_URL" ] || error "Could not find an AppImage in the latest release."

info "Installing Warp Profiles ${VERSION}..."

mkdir -p "$INSTALL_DIR" "$DESKTOP_DIR" "$ICON_DIR"

APPIMAGE_PATH="$INSTALL_DIR/${APP_NAME}.AppImage"
curl -fsSL --progress-bar "$DOWNLOAD_URL" -o "$APPIMAGE_PATH"
chmod +x "$APPIMAGE_PATH"

# Create symlink so it's available as a plain command
ln -sf "$APPIMAGE_PATH" "$INSTALL_DIR/${APP_NAME}"

# Desktop entry (adds it to app launcher — no manual steps needed)
cat > "$DESKTOP_DIR/${APP_NAME}.desktop" <<EOF
[Desktop Entry]
Name=Warp Profiles
Comment=A Warp-like terminal profile launcher
Exec=${APPIMAGE_PATH} --no-sandbox
Icon=${APP_NAME}
Type=Application
Categories=Utility;TerminalEmulator;
StartupNotify=true
EOF

# Refresh desktop database if available
if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$DESKTOP_DIR" 2>/dev/null || true
fi

# Warn if ~/.local/bin is not on PATH
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
  echo ""
  echo "  Add this to your ~/.bashrc or ~/.zshrc to use the CLI:"
  echo "    export PATH=\"\$HOME/.local/bin:\$PATH\""
fi

echo ""
ok "Warp Profiles ${VERSION} installed successfully!"
echo "  App launcher: search for 'Warp Profiles' in your app menu"
echo "  CLI:          ${APP_NAME}"

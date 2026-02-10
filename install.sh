#!/bin/bash
set -e

APP_NAME="Vaxtly"
REPO="vaxtly/vaxtly"

# Detect architecture
ARCH=$(uname -m)
if [[ "$ARCH" == "arm64" ]]; then
    ARCH_LABEL="arm64"
elif [[ "$ARCH" == "x86_64" ]]; then
    ARCH_LABEL="x64"
else
    echo "Unsupported architecture: $ARCH"
    exit 1
fi

# Get latest version from GitHub releases
echo "Fetching latest version..."
LATEST_TAG=$(curl -s "https://api.github.com/repos/$REPO/releases/latest" | grep '"tag_name"' | sed -E 's/.*"v(.*)".*/\1/')

if [[ -z "$LATEST_TAG" ]]; then
    echo "Failed to fetch latest version."
    exit 1
fi

DMG_NAME="${APP_NAME}-${LATEST_TAG}-${ARCH_LABEL}.dmg"
DOWNLOAD_URL="https://github.com/$REPO/releases/download/v${LATEST_TAG}/${DMG_NAME}"

echo "Installing ${APP_NAME} v${LATEST_TAG} (${ARCH_LABEL})..."

# Download DMG
TEMP_DMG=$(mktemp /tmp/${APP_NAME}-XXXXXX.dmg)
echo "Downloading ${DMG_NAME}..."
curl -L -o "$TEMP_DMG" "$DOWNLOAD_URL"

# Mount DMG
echo "Mounting disk image..."
MOUNT_POINT=$(hdiutil attach "$TEMP_DMG" -nobrowse -quiet | tail -1 | awk '{print $3}')

# Close app if running
if pgrep -x "$APP_NAME" > /dev/null 2>&1; then
    echo "Closing running instance..."
    pkill -x "$APP_NAME" || true
    sleep 1
fi

# Copy to Applications
echo "Installing to /Applications..."
rm -rf "/Applications/${APP_NAME}.app"
cp -R "${MOUNT_POINT}/${APP_NAME}.app" /Applications/

# Remove quarantine
xattr -cr "/Applications/${APP_NAME}.app"

# Unmount DMG
echo "Cleaning up..."
hdiutil detach "$MOUNT_POINT" -quiet
rm -f "$TEMP_DMG"

echo ""
echo "${APP_NAME} v${LATEST_TAG} installed successfully!"
echo "Opening ${APP_NAME}..."
open "/Applications/${APP_NAME}.app"

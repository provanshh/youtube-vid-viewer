# Linkee Tabs Bridge

This is a minimal Chrome extension bridge for the dashboard's Opened tabs panel.

## Load unpacked

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select the `chrome-extension` folder.

## What it does

- Injects a small content script on matching pages.
- Relays a tabs request to the background service worker.
- Returns the current window's tabs so the dashboard can render them.
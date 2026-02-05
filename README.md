# ChatGPT Marker 🏷️  
Bookmark and quickly navigate important messages in long ChatGPT conversations.

ChatGPT Marker is a Chrome extension that lets you bookmark key messages directly inside ChatGPT and jump back to them instantly using a floating bookmarks panel.  
It’s built to work reliably with ChatGPT’s single-page app (SPA) behavior, frequent DOM re-renders, and dynamic message loading.

---

## ✨ Features

- **Inline “Mark” button**  
  Adds a `Mark` button directly into ChatGPT’s existing message action bar.

- **Per-conversation bookmarks**  
  Bookmarks are scoped to each ChatGPT conversation and never mix across chats.

- **Floating launcher button**  
  A persistent, draggable bookmarks launcher in the bottom-right corner.

- **Bookmarks panel**
  - Message preview text
  - Timestamp of when the bookmark was added
  - One-click jump to the message
  - Remove individual bookmarks or clear all

- **Smart scroll & highlight**  
  Smoothly scrolls to the bookmarked message and briefly highlights it.

- **SPA-safe & re-render resilient**  
  Designed to survive ChatGPT’s frequent DOM updates.

---

## 🧠 How It Works

1. The extension runs as a **content script** inside the ChatGPT webpage.
2. It scans the DOM for message containers and assigns each message a stable ID.
3. A `Mark` button is injected into ChatGPT’s native message action bar.
4. Bookmarks are stored per conversation using `chrome.storage.local`.
5. A floating launcher toggles a panel listing all saved bookmarks.
6. Clicking a bookmark resolves the target message, scrolls to it, and highlights it.
7. A `MutationObserver` keeps everything in sync as ChatGPT re-renders the page.

---

## 🗂️ Storage Design

### Per-conversation storage

Bookmarks are stored using keys like:

---

## Screenshots
The bookmark panel:
![Launcher and panel](<Screenshot 2026-02-05 at 12.44.35 PM.png>)

The mark label:
![Inline mark button](<Screenshot 2026-02-05 at 12.45.22 PM.png>)
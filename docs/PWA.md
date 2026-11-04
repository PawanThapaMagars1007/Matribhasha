# Progressive web app and offline behavior

The client includes a web manifest, a scalable SVG icon, a service worker, an offline fallback page, and a small update prompt. When installed, it can reopen the public app shell while disconnected. Route chunks and hashed static assets can be cached after they are loaded.

The service worker does not cache `/api/`, authentication/session cookies, learner progress, private messages, discussions, restricted cultural records, or media/audio. It does not claim offline course completion or progress synchronization. Learning actions still require the server; the learner must reconnect before recording progress.

The client prompts when a replacement worker is ready. A user action activates it and reloads the app. Test install/update behavior on actual HTTPS origins and target devices. Localhost is treated as a secure context by browsers; production installation requires HTTPS.

No downloaded learning packs or background synchronization are implemented. The static SVG icon is scalable; platform-specific store/launcher icon behavior should be checked on supported devices.

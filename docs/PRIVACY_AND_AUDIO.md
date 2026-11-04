# Privacy and audio

Published audio is served only when it has passed review, includes attribution, and records speaker consent. Listening exercises further require published, verified exercise and assessment records.

Speaking practice calls the browser microphone API only after the learner presses **Start recording**. The client creates a temporary local playback URL; no recording bytes or transcript are sent to the API. Learners can replay and delete the local recording. Leaving the speaking page stops active microphone tracks and releases the temporary URL. The server stores only language/variety, a reviewed target reference or prompt, a self-assessment, and timestamp. It does not claim automated pronunciation scoring.

Tutor conversations are private to the authenticated account. Tutor requests contain only the user's typed message and retrieved snippets from approved content. If a provider key is configured, those texts are sent to that configured provider; otherwise the local verified-content fallback is used. Never put provider keys in client environment variables or expose them in responses/logs.

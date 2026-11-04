# Optional AI tutor

The tutor is optional and uses a backend-only, OpenAI-compatible chat-completions endpoint. Configure these variables in the server environment:

- `TUTOR_API_KEY` — provider credential; never place it in Vite/client variables.
- `TUTOR_API_BASE_URL` — optional endpoint base; defaults to `https://api.openai.com/v1`.
- `TUTOR_MODEL` — optional model name; defaults to `gpt-4o-mini`.

When no key is configured, the tutor uses a basic fallback: it searches published, verified vocabulary and grammar for the selected language and returns matching excerpts. When no verified material matches, it says so instead of making up a translation or rule. Provider calls are limited to 8 per minute, max 1,000 input characters and 350 generated tokens; requests time out after 12 seconds. Retrieved/user text is treated as data, the model gets no tools or administrative access, and generated messages are labelled as practice suggestions rather than official content.

Tutor conversations are private to the signed-in owner. AI output does not change, verify, or publish Matribhasha records. Do not enable a provider until its data-handling terms are acceptable for your deployment. Provider failure falls back to reviewed-content mode.

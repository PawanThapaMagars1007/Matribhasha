# Accessibility status

The React UI uses semantic page and form elements in many workflows, labels for common fields, screen-reader status/error regions on several flows, visible `:focus-visible` styling, scalable text, and a reduced-motion override. Audio uses native playback controls. The interface language setting updates the document language for English and Nepali and the stylesheet includes script-appropriate system fallbacks.

An app-level error boundary gives users a reload path instead of a blank screen. Lazy loading and offline notices use status text. The offline page is standalone and has a keyboard-visible button focus.

## Known gaps

- No axe, Lighthouse accessibility, screen-reader, switch, or independent WCAG 2.2 AA audit has been run.
- Color contrast and target size have not been measured for every screen. Some legacy pages need a keyboard and mobile review.
- Not every image has verified alt text; current cultural media is not privately uploaded through the app.
- Most page content remains English even after selecting Nepali; only shared navigation/chrome strings have a central English/Nepali catalog. Translation completeness reports only that catalog, not the full application.
- Right-to-left layout is not implemented. The document stays left-to-right for current English and Nepali interfaces; do not infer direction from a learned-content language.

Before launch, test login, learning, assessments, culture, contributions, and administration at narrow mobile widths and with keyboard-only navigation and a screen reader. Fix all blocking findings and document any community-specific script/font limitations.

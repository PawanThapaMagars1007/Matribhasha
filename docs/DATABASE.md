# Database design — Phase 2

MongoDB stores independently managed languages, varieties, and writing systems. All records use Mongoose timestamps, explicit publication state, an active flag, and verification metadata where linguistic claims are made.

## Collections and relationships

- **User** keeps account and Phase 1 preferences. `nativeLanguages`, `knownLanguages`, and `learningLanguages` are separate arrays of `Language` references. `interfaceLanguage` remains independent. `preferredVarieties` stores a language/variety pair and is validated against the variety's parent language when saved.
- **Language** holds names, aliases, description, optional ISO code, region tags, an optional reviewed family claim, availability, resources, provenance, publication state, and references to scripts and varieties. Language records are not oversized course documents; learning modules can reference the language later.
- **LanguageVariety** belongs to one parent language, has its own names, regions, aliases, availability, scripts, provenance, and publication state. Boundaries need not imply standardization.
- **Script** is independent from languages and varieties. Its language and variety associations are references, so one script can serve multiple languages and one language can use multiple scripts. Direction, Unicode range, font requirements, and verification are optional.

```text
User.preferences ──< known/native/learning ──> Language
User.preferences ──< preferredVarieties ──> (Language, LanguageVariety)
Language ──< LanguageVariety
Language >──< Script
LanguageVariety >──< Script
```

## Validation and indexes

Language names and variety names are required. Nonempty language codes are unique; the code field is optional because not every record has a verified code. Variety names are unique within a parent language; script names are unique. Search indexes cover language names and aliases. Compound publication and parent indexes support catalog queries. Public endpoints require active, published records. Legacy Phase 1 `isPublished` records remain readable; writing status synchronizes that compatibility field.

Unreviewed records may be prepared as drafts, but publishing a language or script requires verified status. Never fill family, code, native name, or script associations from guesswork. Preserve Unicode exactly as submitted.

## Development seed

`server/src/seed/languages.js` exports a small draft-only seed set. It adds no native names, codes, families, or script associations; its explicit development provenance requires expert verification. Seed records are not visible through public catalog endpoints. Run `npm run seed --prefix server` with a configured MongoDB URI. The script is idempotent by language name.

## Future learning data

Alphabet categories, characters, pronunciation recordings, lessons, and progress are deliberately not implemented in Phase 2. Future records should reference language, optional variety, and script and allow language-specific character categories. They must retain verification, source, contributor consent, and revision provenance.

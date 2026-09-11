# Learning studio and content curation

The learning interface uses warm paper surfaces, crimson actions, and a quieter reading layout. CeptCheck uses a custom lens/check mark, distinct from the question's featured badge. Motion is limited to short state transitions and respects reduced-motion preferences. The home page's learning-loop controls are interactive, not autoplay.

## Publishing content independently

Question sources remain in the author's standalone Content Lab. The public Content Manager accepts a `question-bundle` containing multiple questions. The server validates and builds a candidate snapshot before activation. Platform deployment continues to reuse that persistent library; account records are never part of a content upload.

Optional `highlightedTerms: ["term-id", ...]` on a question identifies concepts to prioritize. The term must also have an explicit `[[term:term-id|label]]` reference in that question. The term library collects these selections into “Concepts in focus.” Available lessons link to their pages; missing lessons remain labeled upcoming. No empty lessons are generated. The metadata round-trips through the Lab and formal platform and requires no platform release when selections change.

The KV Cache collection is identified by its existing `KV-CACHE-` question IDs. `/learn?track=kv-cache` filters that collection, while `/learn` retains all published questions. Study navigation stays within the collection. Question order IDs remain stable; the reading progress shows the actual position within the collection.

The content author's `TAG_AUDIT.md` records the individual taxonomy decisions. `PRIORITY_TERMS.md` records the first bilingual term-authoring collection. Neither the drafted questions nor these author notes are copied into the platform's Git sample library.

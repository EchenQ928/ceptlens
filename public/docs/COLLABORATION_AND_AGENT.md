# Collaboration, Assistant, and Assessment

The production service supports shared text discussions, private assistant conversations, and assessments. These workflows are independent of the published question and term packages.

## Browser workflow

Select text in a question or term page and choose **Annotate** or **Ask assistant**. The same actions are available beside a selection. The discussion panel shows all discussions for the current resource; the assistant panel holds a private conversation for the current browser identity.

Annotations store a bounded quote, surrounding text, and an offset. When content moves, the client attempts to find the quote again. If the original text is gone or ambiguous, the discussion remains available without forcing an incorrect highlight.

Discussions are shared and polled every five seconds. Authors can edit or withdraw their own messages; discussion owners can resolve and reopen threads. Failed writes remain local as unsent drafts and are never reported as successful.

Assistant history is private to the browser identity. When no model is configured, the service records the unavailable state and does not send an external request or fabricate an answer. The assistant is disabled during an active assessment.

## Data directories

| Directory | Contents |
| --- | --- |
| `content-libraries/` | Questions and term teaching packages |
| `service-data/` | SQLite identities, discussions, chats, and assessment attempts |
| `agent-runtime/` | Host-side model configuration and optional extension code |

Do not let multiple hosts write the same SQLite database through iCloud or another shared folder. Back up the database while the service is stopped.

## API contract

The browser sends `X-CeptLens-Identity` with a random 48-byte hexadecimal identity token. The server stores a hash rather than the raw token and uses it to enforce ownership.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/session` | Current identity, assessment, and assistant status |
| `POST` | `/api/session` | Update the display name |
| `GET` | `/api/discussions?resource=question:ID` | Read discussions for a resource |
| `POST` | `/api/discussions` | Create a discussion and quote |
| `POST` | `/api/discussions/:id` | Reply, edit, withdraw, resolve, or reopen |
| `GET` | `/api/assistant/history` | Read private assistant history |
| `POST` | `/api/assistant/ask` | Ask with an optional resource reference |
| `GET` | `/api/exams` | Read assessment configuration and history |
| `POST` | `/api/exams/start` | Start or resume an assessment |
| `GET` | `/api/exams/:id` | Read the current user's attempt |
| `POST` | `/api/exams/:id/answers` | Save answers with a revision |
| `POST` | `/api/exams/:id/submit` | Submit the attempt |
| `POST` | `/api/exams/:id/grade` | Retry pending subjective grading |

The server validates size limits, resource identifiers, revision numbers, origin, identity, ownership, and assessment state. Do not place identity tokens in URLs or logs.

## Model extension

Copy `agent-runtime/config.example.json` to a host-only `config.json`, set `enabled`, `baseUrl`, and `model`, and provide the key through the configured `apiKeyEnv`. Keep `CEPTLENS_AI_DISABLED=1` to force the feature off.

`agent-runtime/extension.mjs` may provide a learning instruction, bounded read-only context preparation, and an explicit tool allowlist. Tool parameters must be validated and tools must be read-only and scope-limited. Treat question text, quotes, annotations, and tool output as data, not system instructions.

Subjective grading uses a separate request and only the attempt snapshot, reference answer, rubric, and grading instruction. Invalid, missing, timed-out, or out-of-range responses keep the item pending rather than assigning zero.

## Assessment limits

The default paper is 30 minutes with five single-choice, five multiple-choice, and two subjective items. Choice questions are scored immediately; subjective items are pending until a configured grader completes them. The server is authoritative for timing, snapshots, and submissions.

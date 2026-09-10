import { Link } from "react-router-dom";

const termLinkPattern = /\[\[term:([a-z0-9-]+)\|([^\]]+)\]\]/g;

export function RichText({ text }: { text: string }) {
  const parts: Array<string | { id: string; label: string }> = [];
  let cursor = 0;

  for (const match of text.matchAll(termLinkPattern)) {
    const index = match.index ?? 0;
    if (index > cursor) {
      parts.push(text.slice(cursor, index));
    }
    parts.push({ id: match[1], label: match[2] });
    cursor = index + match[0].length;
  }

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return (
    <>
      {parts.map((part, index) =>
        typeof part === "string" ? (
          <span key={`${part}-${index}`}>{part}</span>
        ) : (
          <Link className="term-link" key={`${part.id}-${index}`} to={`/terms/${part.id}`}>
            {part.label}
          </Link>
        )
      )}
    </>
  );
}

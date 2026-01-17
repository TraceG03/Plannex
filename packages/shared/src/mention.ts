export type Mention = {
  raw: string;
  /**
   * The identifier in the mention, without leading @.
   * MVP: treat as email (preferred) or username.
   */
  identifier: string;
  index: number;
  length: number;
};

// Matches:
// - @email@example.com
// - @user.name
// Avoids matching inside words by requiring start or whitespace/punct before @.
const MENTION_RE =
  /(^|[\s([{<"'`.,;:!?])@([a-zA-Z0-9_.+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}|[a-zA-Z0-9_.\-]{2,32})/g;

export function parseMentions(body: string): Mention[] {
  const results: Mention[] = [];
  if (!body) return results;

  let match: RegExpExecArray | null;
  while ((match = MENTION_RE.exec(body)) !== null) {
    const prefix = match[1] ?? "";
    const identifier = match[2] ?? "";
    const raw = `@${identifier}`;
    const index = match.index + prefix.length;
    results.push({ raw, identifier, index, length: raw.length });
  }
  return results;
}


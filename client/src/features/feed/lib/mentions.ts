export interface ActiveMentionRange {
  start: number;
  end: number;
  query: string;
}

const mentionQueryPattern = /^[A-Za-z0-9_]{0,50}$/;

export function getActiveMentionRange(
  text: string,
  cursorPosition: number,
): ActiveMentionRange | null {
  const beforeCursor = text.slice(0, cursorPosition);
  const atIndex = beforeCursor.lastIndexOf("@");

  if (atIndex < 0) {
    return null;
  }

  if (atIndex > 0 && /[A-Za-z0-9_]/.test(beforeCursor[atIndex - 1])) {
    return null;
  }

  const query = beforeCursor.slice(atIndex + 1);
  if (!mentionQueryPattern.test(query)) {
    return null;
  }

  return {
    start: atIndex,
    end: cursorPosition,
    query,
  };
}

export function applyMentionSelection(
  text: string,
  range: ActiveMentionRange,
  username: string,
): { nextText: string; nextCursorPosition: number } {
  const replacement = `@${username} `;
  const nextText =
    text.slice(0, range.start) +
    replacement +
    text.slice(range.end);

  return {
    nextText,
    nextCursorPosition: range.start + replacement.length,
  };
}

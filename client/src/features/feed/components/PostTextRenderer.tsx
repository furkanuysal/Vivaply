import { Fragment, type ReactNode } from "react";
import { Link } from "react-router-dom";

interface PostTextRendererProps {
  text: string;
  contentLinkTitle?: string;
  contentLinkPath?: string | null;
}

const mentionPattern = /(^|[^A-Za-z0-9_])@([A-Za-z0-9_]{1,50})/g;

export default function PostTextRenderer({
  text,
  contentLinkTitle,
  contentLinkPath,
}: PostTextRendererProps) {
  if (
    contentLinkTitle &&
    contentLinkPath &&
    text.includes(contentLinkTitle)
  ) {
    const titleIndex = text.indexOf(contentLinkTitle);
    const before = text.slice(0, titleIndex);
    const after = text.slice(titleIndex + contentLinkTitle.length);

    return (
      <>
        {renderMentionSegments(before, "before")}
        <Link
          to={contentLinkPath}
          className="font-medium text-skin-primary transition hover:text-skin-secondary"
          onClick={(event) => event.stopPropagation()}
        >
          {contentLinkTitle}
        </Link>
        {renderMentionSegments(after, "after")}
      </>
    );
  }

  return <>{renderMentionSegments(text, "text")}</>;
}

function renderMentionSegments(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(mentionPattern)) {
    const prefix = match[1] ?? "";
    const username = match[2];
    const matchIndex = match.index ?? 0;
    const mentionStart = matchIndex + prefix.length;

    if (mentionStart > lastIndex) {
      nodes.push(
        <Fragment key={`${keyPrefix}-text-${lastIndex}`}>
          {text.slice(lastIndex, mentionStart)}
        </Fragment>,
      );
    }

    nodes.push(
      <Link
        key={`${keyPrefix}-mention-${mentionStart}`}
        to={`/${username}`}
        className="font-medium text-skin-primary transition hover:text-skin-secondary hover:underline"
        onClick={(event) => event.stopPropagation()}
      >
        @{username}
      </Link>,
    );

    lastIndex = mentionStart + username.length + 1;
  }

  if (lastIndex < text.length) {
    nodes.push(
      <Fragment key={`${keyPrefix}-tail-${lastIndex}`}>
        {text.slice(lastIndex)}
      </Fragment>,
    );
  }

  return nodes;
}

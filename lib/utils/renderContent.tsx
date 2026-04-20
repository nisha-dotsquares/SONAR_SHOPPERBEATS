import React from "react";

export function renderContent(content?: string) {
  if (!content) return null;

  // Detect HTML tags
  const isHtml = /<\/?[a-z][\s\S]*>/i.test(content);

  if (isHtml) {
    return (
      <div
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // Plain text fallback
  return <p>{content}</p>;
}

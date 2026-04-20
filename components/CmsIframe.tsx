"use client";

import { useEffect, useRef } from "react";

interface ShadowDomContentProps {
  content: string;
}

export default function ShadowDomContent({ content }: ShadowDomContentProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const resize = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;

      const body = doc.body;
      const html = doc.documentElement;

      if (!body || !html) return;

      const height = Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.scrollHeight,
        html.offsetHeight
      );

      iframe.style.height = `${height + 0}px`;
    };

    const observer = new ResizeObserver(resize);
    const observeBody = () => {
      if (iframe.contentDocument?.body) {
        observer.observe(iframe.contentDocument.body);
      }
    };

    observeBody();

    const timers = [
      setTimeout(resize, 100),
      setTimeout(resize, 500),
      setTimeout(resize, 1000),
    ];

    return () => {
      timers.forEach(clearTimeout);
      observer.disconnect();
    };
  }, [content]);

  return (
    <iframe
      key={content}
      ref={iframeRef}
      onLoad={() => {
        // Trigger resize on load
        const iframe = iframeRef.current;
        if (iframe) {
          const doc = iframe.contentDocument;
          if (doc) {
            const body = doc.body;
            const html = doc.documentElement;
            if (body && html) {
              const height = Math.max(
                body.scrollHeight,
                body.offsetHeight,
                html.scrollHeight,
                html.offsetHeight
              );
              iframe.style.height = `${height + 0}px`;
            }
          }
        }
      }}
      scrolling="no"
      className="w-full border-0"
      style={{ minHeight: "300px" }}
      srcDoc={`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      html, body {
        margin: 0;
        overflow: hidden;
      }
    </style>
  </head>
  <body>
    ${content}
  </body>
</html>`}
    />
  );
}

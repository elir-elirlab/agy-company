// Markdown rendering component supporting GFM, code blocks, tables, and Obsidian wiki-links
import React, { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

/**
 * Preprocess Obsidian-specific Markdown syntax before passing to marked.
 * Converts [[Wiki-links]] to custom styled span badges.
 */
function preprocessObsidianMarkdown(markdown: string): string {
  if (!markdown) return '';

  // Transform Obsidian [[Note Title]] and [[Note Title|Alias]] into badges
  let processed = markdown.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, alias) => {
    const label = alias || target;
    return `<span class="obsidian-link" title="Obsidian Link: ${target}">🔗 ${label}</span>`;
  });

  // Transform Obsidian Callouts: > [!type] Title into styled callout blocks
  processed = processed.replace(
    /^>\s*\[!([a-zA-Z]+)\]\s*(.*)$/gm,
    (_, type, title) => {
      const displayTitle = title.trim() || type.toUpperCase();
      return `> <strong class="callout-title">[${displayTitle}]</strong>\n>`;
    }
  );

  return processed;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content, className = '' }) => {
  const renderedHtml = useMemo(() => {
    if (!content) return '';

    try {
      // Configure marked with GitHub Flavored Markdown and automatic line breaks
      marked.setOptions({
        gfm: true,
        breaks: true
      });

      const preprocessed = preprocessObsidianMarkdown(content);
      const rawHtml = marked.parse(preprocessed) as string;

      // Sanitize HTML using DOMPurify (Apache-2.0) to prevent XSS attacks
      return DOMPurify.sanitize(rawHtml, {
        ADD_ATTR: ['target', 'rel', 'class', 'title']
      });
    } catch (err) {
      console.error('Failed to parse markdown:', err);
      return `<p class="text-rose-400">Failed to render markdown content.</p>`;
    }
  }, [content]);

  return (
    <div
      className={`markdown-body ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};

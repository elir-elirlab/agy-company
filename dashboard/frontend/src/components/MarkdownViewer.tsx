// Markdown rendering component supporting GFM, code blocks, tables, Obsidian wiki-links, and Mermaid diagrams
import React, { useMemo, useEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

// Configure marked extension to intercept 'mermaid' code blocks and wrap them in a container
marked.use({
  renderer: {
    code({ text, lang }: { text: string; lang?: string }) {
      if (lang === 'mermaid') {
        // Return a container with class 'mermaid' for dynamic SVG rendering by Mermaid
        return `<div class="mermaid-container"><div class="mermaid">${text}</div></div>`;
      }
      return false; // Fall back to default code block rendering
    },
  },
});

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
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Effect to process and render any Mermaid diagrams after DOM updates
  useEffect(() => {
    if (!containerRef.current) return;

    // Find all unprocessed Mermaid blocks in the rendered markdown container
    const mermaidNodes = containerRef.current.querySelectorAll<HTMLElement>(
      '.mermaid:not([data-processed="true"])'
    );
    if (mermaidNodes.length === 0) return;

    let isCancelled = false;

    // Dynamically import Mermaid to reduce initial bundle size and split code
    import('mermaid')
      .then((m) => {
        if (isCancelled) return;
        const mermaid = m.default || m;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'strict',
          fontFamily: 'inherit',
          suppressErrorRendering: true,
        });

        mermaidNodes.forEach(async (el, idx) => {
          const code = el.textContent || '';
          const id = `mermaid-svg-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;

          try {
            const { svg } = await mermaid.render(id, code.trim());
            if (isCancelled) return;
            el.innerHTML = svg;
            el.setAttribute('data-processed', 'true');
          } catch (renderError) {
            if (isCancelled) return;
            console.warn('Failed to render Mermaid diagram:', renderError);
            el.setAttribute('data-processed', 'error');

            // Fallback UI: show a gentle warning badge and display the raw code in a pre block
            el.innerHTML = `
              <div class="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200 text-left space-y-1.5 my-2">
                <div class="font-semibold flex items-center gap-1.5 text-amber-400">
                  <span>⚠️ Mermaid Diagram Syntax Error</span>
                </div>
                <pre class="overflow-x-auto text-slate-300 font-mono bg-slate-900/80 p-2.5 rounded-lg text-xs leading-relaxed"></pre>
              </div>
            `;
            const pre = el.querySelector('pre');
            if (pre) pre.textContent = code.trim();
          }
        });
      })
      .catch((err) => {
        console.error('Failed to load Mermaid module:', err);
      });

    return () => {
      isCancelled = true;
    };
  }, [renderedHtml]);

  return (
    <div
      ref={containerRef}
      className={`markdown-body ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};

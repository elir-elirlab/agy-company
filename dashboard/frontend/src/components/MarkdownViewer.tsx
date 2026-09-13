// Markdown rendering component supporting GFM, code blocks, tables, Obsidian wiki-links, Mermaid diagrams, and LaTeX math
import React, { useMemo, useEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import katex from 'katex';
import 'katex/dist/katex.min.css';

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

/**
 * Preprocess LaTeX math expressions before passing to marked.
 * Converts $$...$$ (block math) and $...$ (inline math) into KaTeX-rendered HTML.
 * Math expressions are wrapped in container elements so they survive DOMPurify sanitization.
 *
 * Processing order matters:
 *   1. Block math ($$...$$) first — to avoid inner $...$ being matched as inline math
 *   2. Inline math ($...$) second
 */
function preprocessMathExpressions(markdown: string): string {
  if (!markdown) return '';

  let processed = markdown;

  // Step 1: Replace block math $$...$$ (can span multiple lines)
  // Regex explanation: \$\$ matches literal $$, ([\s\S]+?) captures the LaTeX non-greedy, \$\$ matches closing $$
  processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => {
    try {
      // Render block math in display mode (centered, larger) using KaTeX
      const html = katex.renderToString(tex.trim(), {
        displayMode: true,
        throwOnError: false,      // Show error message instead of crashing
        output: 'html',           // Produce HTML output (not MathML)
        trust: false,             // Disable potentially unsafe commands
      });
      // Wrap in a div with class 'math-block' for styling and to mark as processed
      return `<div class="math-block">${html}</div>`;
    } catch (err) {
      // If KaTeX fails, show the raw LaTeX in a styled error container
      console.warn('KaTeX block rendering failed:', err);
      return `<div class="math-block math-error">$$${tex}$$</div>`;
    }
  });

  // Step 2: Replace inline math $...$ (single line only, non-greedy)
  // Regex explanation:
  //   (?<!\$)  — negative lookbehind: don't match if preceded by $ (avoids matching $$)
  //   \$       — literal opening $
  //   ([^\$\n]+?) — capture LaTeX content (no $ or newline, non-greedy)
  //   \$       — literal closing $
  //   (?!\$)   — negative lookahead: don't match if followed by $ (avoids matching $$)
  processed = processed.replace(/(?<!\$)\$([^\$\n]+?)\$(?!\$)/g, (_, tex) => {
    try {
      // Render inline math (same line, normal size) using KaTeX
      const html = katex.renderToString(tex.trim(), {
        displayMode: false,
        throwOnError: false,
        output: 'html',
        trust: false,
      });
      // Wrap in a span with class 'math-inline' for styling
      return `<span class="math-inline">${html}</span>`;
    } catch (err) {
      console.warn('KaTeX inline rendering failed:', err);
      return `<span class="math-inline math-error">$${tex}$</span>`;
    }
  });

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

      // Preprocess math expressions first (before Obsidian syntax) so that
      // $$ delimiters are converted to KaTeX HTML before any other transformations
      const mathProcessed = preprocessMathExpressions(content);
      const preprocessed = preprocessObsidianMarkdown(mathProcessed);
      const rawHtml = marked.parse(preprocessed) as string;

      // Sanitize HTML using DOMPurify (Apache-2.0) to prevent XSS attacks.
      // KaTeX generates complex HTML with inline styles and SVG elements,
      // so we need to allow additional tags and attributes for math rendering.
      return DOMPurify.sanitize(rawHtml, {
        ADD_TAGS: ['span', 'div', 'svg', 'path', 'line', 'rect', 'circle', 'ellipse', 'polygon', 'polyline', 'g', 'use', 'defs', 'clipPath', 'mask', 'symbol', 'text', 'tspan', 'image'],
        ADD_ATTR: ['target', 'rel', 'class', 'title', 'style', 'xmlns', 'viewBox', 'width', 'height', 'd', 'fill', 'stroke', 'stroke-width', 'transform', 'x', 'y', 'cx', 'cy', 'r', 'rx', 'ry', 'x1', 'y1', 'x2', 'y2', 'points', 'preserveAspectRatio', 'clip-path', 'aria-hidden', 'focusable', 'role']
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
              <div class="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200 text-left space-y-1.5 my-2">
                <div class="font-semibold flex items-center gap-1.5 text-amber-400">
                  <span>⚠️ Mermaid Diagram Syntax Error</span>
                </div>
                <pre class="overflow-x-auto text-slate-300 font-mono bg-slate-900/80 p-2.5 rounded-lg text-sm leading-relaxed"></pre>
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

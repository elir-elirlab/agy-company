// Tests for MarkdownViewer component (headings, lists, code, obsidian wiki-links, callouts, sanitization, mermaid)
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MarkdownViewer } from '../components/MarkdownViewer';

// Mock the mermaid library to avoid JSDOM SVG layout engine incompatibilities
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockImplementation(async (id: string, code: string) => {
      // Simulate syntax error for testing the fallback behavior
      if (code.includes('SYNTAX_ERROR')) {
        throw new Error('Mermaid parsing error');
      }
      return {
        svg: `<svg id="${id}" data-testid="mock-mermaid-svg"><text>${code}</text></svg>`,
      };
    }),
  },
}));

describe('MarkdownViewer Component', () => {
  it('renders standard markdown elements (headings, bold, lists)', () => {
    const sample = `
# Main Header
## Sub Header
This is **bold text** and a paragraph.

- Item A
- Item B
`;

    const { container } = render(<MarkdownViewer content={sample} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Main Header' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Sub Header' })).toBeInTheDocument();
    expect(container.querySelector('strong')?.textContent).toBe('bold text');
    expect(screen.getByText('Item A')).toBeInTheDocument();
    expect(screen.getByText('Item B')).toBeInTheDocument();
  });

  it('converts Obsidian wiki-links into styled badges', () => {
    const sample = `Refer to [[2026-09-08-Architecture]] and [[Meeting-Notes|Team Sync]].`;
    const { container } = render(<MarkdownViewer content={sample} />);

    const badges = container.querySelectorAll('.obsidian-link');
    expect(badges.length).toBe(2);
    expect(badges[0].textContent).toContain('2026-09-08-Architecture');
    expect(badges[1].textContent).toContain('Team Sync');
  });

  it('sanitizes malicious script tags to prevent XSS', () => {
    const malicious = `Safe text<script>alert("hack")</script>`;
    const { container } = render(<MarkdownViewer content={malicious} />);

    expect(screen.getByText(/Safe text/)).toBeInTheDocument();
    expect(container.querySelector('script')).not.toBeInTheDocument();
  });

  it('renders code blocks properly', () => {
    const sample = '```json\n{"status": "ok"}\n```';
    const { container } = render(<MarkdownViewer content={sample} />);

    const pre = container.querySelector('pre');
    expect(pre).toBeInTheDocument();
    expect(pre?.textContent).toContain('"status": "ok"');
  });

  it('renders Mermaid diagrams into SVG via dynamic loader', async () => {
    const sample = '```mermaid\ngraph TD\n  A --> B\n```';
    render(<MarkdownViewer content={sample} />);

    // Verify SVG is rendered by mocked mermaid
    await waitFor(() => {
      const svg = screen.getByTestId('mock-mermaid-svg');
      expect(svg).toBeInTheDocument();
      expect(svg.textContent).toContain('graph TD');
    });
  });

  it('gracefully handles Mermaid syntax errors with a fallback badge and raw code', async () => {
    const sample = '```mermaid\ngraph TD\n  SYNTAX_ERROR\n```';
    render(<MarkdownViewer content={sample} />);

    // Verify syntax error badge and raw code fallback are displayed
    await waitFor(() => {
      expect(screen.getByText(/Mermaid Diagram Syntax Error/)).toBeInTheDocument();
      expect(screen.getByText(/SYNTAX_ERROR/)).toBeInTheDocument();
    });
  });

  it('renders block math ($$...$$) with KaTeX', () => {
    // Block math should produce a .math-block container with rendered KaTeX HTML
    const sample = '$$E = mc^2$$';
    const { container } = render(<MarkdownViewer content={sample} />);

    const mathBlock = container.querySelector('.math-block');
    expect(mathBlock).toBeInTheDocument();
    // KaTeX generates elements with class 'katex' for rendered output
    expect(mathBlock?.querySelector('.katex')).toBeInTheDocument();
  });

  it('renders inline math ($...$) with KaTeX', () => {
    // Inline math should produce a .math-inline container with rendered KaTeX HTML
    const sample = 'The formula $x^2 + y^2 = r^2$ defines a circle.';
    const { container } = render(<MarkdownViewer content={sample} />);

    const mathInline = container.querySelector('.math-inline');
    expect(mathInline).toBeInTheDocument();
    expect(mathInline?.querySelector('.katex')).toBeInTheDocument();
    // Surrounding text should also be rendered
    expect(container.textContent).toContain('The formula');
    expect(container.textContent).toContain('defines a circle.');
  });

  it('renders complex block math with \\text and \\longleftrightarrow', () => {
    // Test the specific formula from the user's request
    const sample = '$$\\text{Gregorian Calendar (UTC)} \\longleftrightarrow \\text{Julian Date (JD / MJD)}$$';
    const { container } = render(<MarkdownViewer content={sample} />);

    const mathBlock = container.querySelector('.math-block');
    expect(mathBlock).toBeInTheDocument();
    expect(mathBlock?.querySelector('.katex')).toBeInTheDocument();
    // KaTeX may insert zero-width Unicode characters between words in \text{},
    // so use regex matching instead of exact substring for content verification
    expect(mathBlock?.textContent).toMatch(/Gregorian/);
    expect(mathBlock?.textContent).toMatch(/Julian/);
    expect(mathBlock?.textContent).toMatch(/Calendar/);
  });

  it('gracefully handles invalid LaTeX with error fallback', () => {
    // Invalid LaTeX should not crash; KaTeX with throwOnError: false renders an error message
    const sample = '$$\\invalidcommandxyz{broken}$$';
    const { container } = render(<MarkdownViewer content={sample} />);

    // Even with invalid LaTeX, the component should render without crashing
    const mathBlock = container.querySelector('.math-block');
    expect(mathBlock).toBeInTheDocument();
  });
});

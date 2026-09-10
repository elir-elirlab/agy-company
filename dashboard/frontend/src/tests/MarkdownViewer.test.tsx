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
});


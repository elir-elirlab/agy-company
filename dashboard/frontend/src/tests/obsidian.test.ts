import { describe, it, expect } from 'vitest';
import { getObsidianUri } from '../utils/obsidian';

describe('Obsidian URI generator', () => {
  it('should generate basic URI without vault name', () => {
    const uri = getObsidianUri('01_Inbox/research/2026-09-08-report.md');
    expect(uri).toBe('obsidian://open?file=01_Inbox%2Fresearch%2F2026-09-08-report.md');
  });

  it('should generate URI with specific vault name', () => {
    const uri = getObsidianUri('02_Daily/2026-09-08.md', 'MyVault');
    expect(uri).toBe('obsidian://open?vault=MyVault&file=02_Daily%2F2026-09-08.md');
  });

  it('should handle paths with leading slashes gracefully', () => {
    const uri = getObsidianUri('/01_Inbox/test.md');
    expect(uri).toBe('obsidian://open?file=01_Inbox%2Ftest.md');
  });
});

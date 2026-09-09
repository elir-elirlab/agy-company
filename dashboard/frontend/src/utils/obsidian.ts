// Obsidian URI scheme generator utilities

/**
 * Generate an obsidian:// URI to open a markdown note in the Obsidian desktop app.
 * @param relativePath Relative path within the vault (e.g. '01_Inbox/research/file.md')
 * @param vaultName Optional vault name. If omitted, opens in the currently active vault.
 */
export function getObsidianUri(relativePath: string, vaultName?: string): string {
  // Strip leading slashes
  const cleanPath = relativePath.replace(/^\/+/, '');
  
  if (vaultName) {
    return `obsidian://open?vault=${encodeURIComponent(vaultName)}&file=${encodeURIComponent(cleanPath)}`;
  }
  
  return `obsidian://open?file=${encodeURIComponent(cleanPath)}`;
}

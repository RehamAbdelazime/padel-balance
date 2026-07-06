/** Copy Summary (Sprint E1 Step 5). Throws a clear error when the Clipboard API isn't available (older/insecure-context browsers). */
export async function copyTextToClipboard(text: string): Promise<void> {
  if (!navigator.clipboard) {
    throw new Error('Clipboard API is not available in this browser.')
  }
  await navigator.clipboard.writeText(text)
}

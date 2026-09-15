import { clipboard } from 'electron';

export async function readClipboardText(
  type: 'selection' | 'clipboard' = 'clipboard',
): Promise<string> {
  if (type === 'selection' && clipboard.selection) {
    return clipboard.selection.readText();
  }
  return clipboard.readText();
}

export async function writeClipboardText(
  text: string,
  type: 'selection' | 'clipboard' = 'clipboard',
): Promise<void> {
  if (type === 'selection' && clipboard.selection) {
    return clipboard.selection.writeText(text);
  }
  return clipboard.writeText(text);
}

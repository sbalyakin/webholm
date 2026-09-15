import * as fs from 'fs';
import path from 'path';

import type {
  BaseWindow,
  BrowserWindow,
  MenuItem,
  MenuItemConstructorOptions,
} from '../adapters/electronTypes';
import {
  readClipboardText,
  writeClipboardText,
} from '../adapters/clipboardAdapter';
import {
  buildApplicationMenu,
  getApplicationMenu,
  getMenuItemById,
  setApplicationMenu,
} from '../adapters/menuAdapter';
import {
  isAlwaysOnTop,
  setAlwaysOnTop,
  toggleDevTools,
} from '../adapters/windowAdapter';

import { cleanupPlainText, isOSX, openExternal } from '../helpers/helpers';
import * as log from '../helpers/loggingHelper';
import {
  clearAppData,
  getCurrentURL,
  goBack,
  goForward,
  goToURL,
  promptAndNavigateToUrl,
  zoomIn,
  zoomOut,
  zoomReset,
} from '../helpers/windowHelpers';
import { OutputOptions } from '../runtimeContract';

type BookmarksLink = {
  type: 'link';
  title: string;
  url: string;
  shortcut?: string;
};

type BookmarksSeparator = {
  type: 'separator';
};

type BookmarkConfig = BookmarksLink | BookmarksSeparator;

type BookmarksMenuConfig = {
  menuLabel: string;
  bookmarks: BookmarkConfig[];
};

// The application menu is shared across all of the app's windows (see
// Menu.setApplicationMenu), so the "Pin on Top" checkbox can't just read its
// checked state once at menu-build time: whichever window happened to be
// focused at that point would "win" for every other window too. Instead, we
// give the item a stable id and resync its checked state whenever a
// (possibly different) window gains focus, via `syncPinOnTopMenuItemChecked`.
export const PIN_ON_TOP_MENU_ITEM_ID = 'pin-on-top';

/**
 * Re-reads `window`'s alwaysOnTop state into the "Pin on Top" checkbox of the
 * current application menu. Call this whenever a browser window gains focus,
 * since Electron's application menu is shared across windows and does not
 * refresh checkbox state on its own (`menu-will-show` never fires for it).
 */
export function syncPinOnTopMenuItemChecked(window: BrowserWindow): void {
  const menu = getApplicationMenu();
  const pinOnTopItem = menu
    ? getMenuItemById(menu, PIN_ON_TOP_MENU_ITEM_ID)
    : null;
  if (pinOnTopItem) {
    pinOnTopItem.checked = isAlwaysOnTop(window);
  }
}

function focusedBrowserWindow(
  focusedWindow: BaseWindow | undefined,
  fallback: BrowserWindow,
): BrowserWindow {
  return (focusedWindow ?? fallback) as BrowserWindow;
}

export function createMenu(
  options: OutputOptions,
  mainWindow: BrowserWindow,
  onPinOnTopChange?: (pinned: boolean) => void,
): void {
  log.debug('createMenu', { options });
  const menuTemplate = generateMenu(options, mainWindow, onPinOnTopChange);

  injectBookmarks(menuTemplate);

  const menu = buildApplicationMenu(menuTemplate);
  setApplicationMenu(menu);
}

export function generateMenu(
  options: {
    disableDevTools: boolean;
    webholmVersion: string;
    zoom?: number;
  },
  mainWindow: BrowserWindow,
  onPinOnTopChange?: (pinned: boolean) => void,
): MenuItemConstructorOptions[] {
  const { webholmVersion, zoom, disableDevTools } = options;
  const zoomResetLabel =
    !zoom || zoom === 1.0
      ? 'Reset Zoom'
      : `Reset Zoom (to ${(zoom * 100).toFixed(1)}%, set at build time)`;

  const editMenu: MenuItemConstructorOptions = {
    label: '&Edit',
    submenu: [
      {
        label: 'Undo',
        accelerator: 'CmdOrCtrl+Z',
        role: 'undo',
      },
      {
        label: 'Redo',
        accelerator: 'Shift+CmdOrCtrl+Z',
        role: 'redo',
      },
      {
        type: 'separator',
      },
      {
        label: 'Cut',
        accelerator: 'CmdOrCtrl+X',
        role: 'cut',
      },
      {
        label: 'Copy',
        accelerator: 'CmdOrCtrl+C',
        role: 'copy',
      },
      {
        label: 'Copy as Plain Text',
        accelerator: 'CmdOrCtrl+Shift+C',
        click: (): void => {
          // We use clipboard.readText to strip down formatting
          void (async (): Promise<void> => {
            const text = await readClipboardText('selection');
            await writeClipboardText(cleanupPlainText(text), 'clipboard');
          })();
        },
      },
      {
        label: 'Copy Current URL',
        accelerator: 'CmdOrCtrl+Shift+L',
        click: (): void => {
          void writeClipboardText(getCurrentURL());
        },
      },
      {
        label: 'Paste',
        accelerator: 'CmdOrCtrl+V',
        role: 'paste',
      },
      {
        label: 'Paste and Match Style',
        // https://github.com/nativefier/nativefier/issues/404
        // Apple's HIG lists this shortcut for paste and match style
        // https://support.apple.com/en-us/HT209651
        accelerator: isOSX() ? 'Option+Shift+Cmd+V' : 'Ctrl+Shift+V',
        role: 'pasteAndMatchStyle',
      },
      {
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        role: 'selectAll',
      },
      {
        label: 'Clear App Data',
        click: (
          item: MenuItem,
          focusedWindow: BaseWindow | undefined,
        ): void => {
          log.debug('Clear App Data.click', {
            item,
            focusedWindow,
            mainWindow,
          });
          const target = focusedBrowserWindow(focusedWindow, mainWindow);
          clearAppData(target).catch((err) =>
            log.error('clearAppData ERROR', err),
          );
        },
      },
    ],
  };

  const viewMenu: MenuItemConstructorOptions = {
    label: '&View',
    submenu: [
      {
        label: 'Go to URL...',
        accelerator: 'CmdOrCtrl+L',
        click: (
          _item: MenuItem,
          focusedWindow: BaseWindow | undefined,
        ): void => {
          const target = focusedBrowserWindow(focusedWindow, mainWindow);
          promptAndNavigateToUrl(target, getCurrentURL()).catch((err: unknown) =>
            log.error('promptAndNavigateToUrl ERROR', err),
          );
        },
      },
      {
        type: 'separator',
      },
      {
        label: 'Back',
        accelerator: isOSX() ? 'Cmd+Left' : 'Alt+Left',
        click: goBack,
      },
      {
        label: 'BackAdditionalShortcut',
        visible: false,
        acceleratorWorksWhenHidden: true,
        accelerator: 'CmdOrCtrl+[', // What old versions of Nativefier used, kept for backwards compat
        click: goBack,
      },
      {
        label: 'Forward',
        accelerator: isOSX() ? 'Cmd+Right' : 'Alt+Right',
        click: goForward,
      },
      {
        label: 'ForwardAdditionalShortcut',
        visible: false,
        acceleratorWorksWhenHidden: true,
        accelerator: 'CmdOrCtrl+]', // What old versions of Nativefier used, kept for backwards compat
        click: goForward,
      },
      {
        label: 'Reload',
        role: 'reload',
      },
      {
        type: 'separator',
      },
      {
        label: 'Toggle Full Screen',
        accelerator: isOSX() ? 'Ctrl+Cmd+F' : 'F11',
        enabled: mainWindow.isFullScreenable() || isOSX(),
        visible: mainWindow.isFullScreenable() || isOSX(),
        click: (
          item: MenuItem,
          focusedWindow: BaseWindow | undefined,
        ): void => {
          log.debug('Toggle Full Screen.click()', {
            item,
            focusedWindow,
            isFullScreen: focusedBrowserWindow(
              focusedWindow,
              mainWindow,
            ).isFullScreen(),
            isFullScreenable: focusedBrowserWindow(
              focusedWindow,
              mainWindow,
            ).isFullScreenable(),
          });
          const w = focusedBrowserWindow(focusedWindow, mainWindow);
          if (w.isFullScreenable()) {
            w.setFullScreen(!w.isFullScreen());
          } else if (isOSX()) {
            w.setSimpleFullScreen(!w.isSimpleFullScreen());
          }
        },
      },
      {
        type: 'separator',
      },
      {
        id: PIN_ON_TOP_MENU_ITEM_ID,
        label: 'Pin on Top',
        type: 'checkbox',
        checked: isAlwaysOnTop(mainWindow),
        accelerator: isOSX() ? 'Cmd+Shift+P' : 'Ctrl+Shift+P',
        click: (
          item: MenuItem,
          focusedWindow: BaseWindow | undefined,
        ): void => {
          const target = focusedBrowserWindow(focusedWindow, mainWindow);
          log.debug('Pin on Top.click()', { item, focusedWindow });
          setAlwaysOnTop(target, item.checked);
          onPinOnTopChange?.(item.checked);
        },
      },
      {
        label: 'Zoom In',
        accelerator: 'CmdOrCtrl+=',
        click: zoomIn,
      },
      {
        label: 'ZoomInAdditionalShortcut',
        visible: false,
        acceleratorWorksWhenHidden: true,
        accelerator: 'CmdOrCtrl+numadd',
        click: zoomIn,
      },
      {
        label: 'Zoom Out',
        accelerator: 'CmdOrCtrl+-',
        click: zoomOut,
      },
      {
        label: 'ZoomOutAdditionalShortcut',
        visible: false,
        acceleratorWorksWhenHidden: true,
        accelerator: 'CmdOrCtrl+numsub',
        click: zoomOut,
      },
      {
        label: zoomResetLabel,
        accelerator: 'CmdOrCtrl+0',
        click: (): void => zoomReset(options),
      },
      {
        label: 'ZoomResetAdditionalShortcut',
        visible: false,
        acceleratorWorksWhenHidden: true,
        accelerator: 'CmdOrCtrl+num0',
        click: (): void => zoomReset(options),
      },
    ],
  };

  if (!disableDevTools) {
    (viewMenu.submenu as MenuItemConstructorOptions[]).push(
      {
        type: 'separator',
      },
      {
        label: 'Toggle Developer Tools',
        accelerator: isOSX() ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
        click: (item: MenuItem, focusedWindow: BaseWindow | undefined) => {
          log.debug('Toggle Developer Tools.click()', { item, focusedWindow });
          toggleDevTools(focusedBrowserWindow(focusedWindow, mainWindow));
        },
      },
    );
  }

  const windowMenu: MenuItemConstructorOptions = {
    label: '&Window',
    role: 'window',
    submenu: [
      {
        label: 'Minimize',
        accelerator: 'CmdOrCtrl+M',
        role: 'minimize',
      },
      {
        label: 'Close',
        accelerator: 'CmdOrCtrl+W',
        role: 'close',
      },
    ],
  };

  const helpMenu: MenuItemConstructorOptions = {
    label: '&Help',
    role: 'help',
    submenu: [
      {
        label: `Built with Webholm v${webholmVersion}`,
        click: (): void => {
          openExternal('https://github.com/nativefier/nativefier').catch(
            (err: unknown): void =>
              log.error(
                'Built with Webholm v${webholmVersion}.click ERROR',
                err,
              ),
          );
        },
      },
      {
        label: 'Report an Issue',
        click: (): void => {
          openExternal('https://github.com/nativefier/nativefier/issues').catch(
            (err: unknown): void =>
              log.error('Report an Issue.click ERROR', err),
          );
        },
      },
    ],
  };

  let menuTemplate: MenuItemConstructorOptions[];

  if (isOSX()) {
    const electronMenu: MenuItemConstructorOptions = {
      label: 'E&lectron',
      submenu: [
        {
          label: 'Services',
          role: 'services',
          submenu: [],
        },
        {
          type: 'separator',
        },
        {
          label: 'Hide App',
          accelerator: 'Cmd+H',
          role: 'hide',
        },
        {
          label: 'Hide Others',
          accelerator: 'Cmd+Shift+H',
          role: 'hideOthers',
        },
        {
          label: 'Show All',
          role: 'unhide',
        },
        {
          type: 'separator',
        },
        {
          label: 'Quit',
          accelerator: 'Cmd+Q',
          role: 'quit',
        },
      ],
    };
    (windowMenu.submenu as MenuItemConstructorOptions[]).push(
      {
        type: 'separator',
      },
      {
        label: 'Bring All to Front',
        role: 'front',
      },
    );
    menuTemplate = [electronMenu, editMenu, viewMenu, windowMenu, helpMenu];
  } else {
    menuTemplate = [editMenu, viewMenu, windowMenu, helpMenu];
  }

  return menuTemplate;
}

function injectBookmarks(menuTemplate: MenuItemConstructorOptions[]): void {
  const bookmarkConfigPath = path.join(__dirname, '..', 'bookmarks.json');

  if (!fs.existsSync(bookmarkConfigPath)) {
    return;
  }

  try {
    const bookmarksMenuConfig = JSON.parse(
      fs.readFileSync(bookmarkConfigPath, 'utf-8'),
    ) as BookmarksMenuConfig;
    const submenu: MenuItemConstructorOptions[] =
      bookmarksMenuConfig.bookmarks.map((bookmark) => {
        switch (bookmark.type) {
          case 'link':
            if (!('title' in bookmark && 'url' in bookmark)) {
              throw new Error(
                'All links in the bookmarks menu must have a title and url.',
              );
            }
            try {
              new URL(bookmark.url);
            } catch {
              throw new Error('Bookmark URL "' + bookmark.url + '"is invalid.');
            }
            return {
              label: bookmark.title,
              click: (): void => {
                goToURL(bookmark.url)?.catch((err: unknown): void =>
                  log.error(`${bookmark.title}.click ERROR`, err),
                );
              },
              accelerator:
                'shortcut' in bookmark ? bookmark.shortcut : undefined,
            };
          case 'separator':
            return {
              type: 'separator',
            };
          default:
            throw new Error(
              'A bookmarks menu entry has an invalid type; type must be one of "link", "separator".',
            );
        }
      });
    const bookmarksMenu: MenuItemConstructorOptions = {
      label: bookmarksMenuConfig.menuLabel,
      submenu,
    };
    // Insert custom bookmarks menu between menus "View" and "Window"
    menuTemplate.splice(menuTemplate.length - 2, 0, bookmarksMenu);
  } catch (err: unknown) {
    log.error('Failed to load & parse bookmarks configuration JSON file.', err);
  }
}

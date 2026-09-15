const mockAppendSwitch = jest.fn();
const mockExit = jest.fn();
const mockQuit = jest.fn();
const mockOn = jest.fn();
const mockRequestSingleInstanceLock = jest.fn(() => true);
const mockShowMessageBoxSync = jest.fn(() => 0);
const mockReadClipboardText = jest.fn(() => 'plain');
const mockWriteClipboardText = jest.fn();
const mockRegisterGlobalShortcut = jest.fn(() => true);

jest.mock('electron', () => ({
  app: {
    commandLine: { appendSwitch: mockAppendSwitch },
    disableHardwareAcceleration: jest.fn(),
    setPath: jest.fn(),
    getName: jest.fn(() => 'TestApp'),
    getVersion: jest.fn(() => '1.0.0'),
    setAppUserModelId: jest.fn(),
    userAgentFallback: 'Mozilla/5.0',
    dock: { setBadge: jest.fn(), bounce: jest.fn() },
    exit: mockExit,
    quit: mockQuit,
    on: mockOn,
    requestSingleInstanceLock: mockRequestSingleInstanceLock,
  },
  systemPreferences: {
    isTrustedAccessibilityClient: jest.fn(() => false),
  },
  dialog: {
    showMessageBoxSync: mockShowMessageBoxSync,
    showMessageBox: jest.fn(),
  },
  clipboard: {
    readText: mockReadClipboardText,
    writeText: mockWriteClipboardText,
    selection: {
      readText: mockReadClipboardText,
      writeText: mockWriteClipboardText,
    },
  },
  globalShortcut: { register: mockRegisterGlobalShortcut },
}));

import {
  appendCommandLineSwitch,
  exitApp,
  getUserAgentFallback,
  onAppEvent,
  quitApp,
  requestSingleInstanceLock,
  setUserAgentFallback,
} from './appAdapter';
import { readClipboardText, writeClipboardText } from './clipboardAdapter';
import { showMessageBoxSync } from './dialogAdapter';
import { registerGlobalShortcut } from './globalShortcutAdapter';

describe('runtime electron adapters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('appAdapter forwards command-line and user-agent helpers', () => {
    appendCommandLineSwitch('foo', 'bar');
    appendCommandLineSwitch('baz');
    expect(mockAppendSwitch).toHaveBeenCalledWith('foo', 'bar');
    expect(mockAppendSwitch).toHaveBeenCalledWith('baz');

    setUserAgentFallback('custom-ua');
    expect(getUserAgentFallback()).toBe('custom-ua');
  });

  it('appAdapter forwards exit, quit, on, and requestSingleInstanceLock', () => {
    exitApp(0);
    expect(mockExit).toHaveBeenCalledWith(0);

    quitApp();
    expect(mockQuit).toHaveBeenCalled();

    const listener = (): void => undefined;
    onAppEvent('second-instance', listener);
    expect(mockOn).toHaveBeenCalledWith('second-instance', listener);

    expect(requestSingleInstanceLock()).toBe(true);
    expect(mockRequestSingleInstanceLock).toHaveBeenCalled();
  });

  it('appAdapter onAppEvent forwards main-process lifecycle events', () => {
    const readyListener = jest.fn();
    const windowAllClosedListener = jest.fn();

    onAppEvent('ready', readyListener);
    onAppEvent('window-all-closed', windowAllClosedListener);

    expect(mockOn).toHaveBeenCalledWith('ready', readyListener);
    expect(mockOn).toHaveBeenCalledWith(
      'window-all-closed',
      windowAllClosedListener,
    );
  });

  it('dialogAdapter delegates to electron.dialog', () => {
    const win = {} as import('./electronTypes').BrowserWindow;
    showMessageBoxSync(win, { message: 'test' });
    expect(mockShowMessageBoxSync).toHaveBeenCalledWith(win, {
      message: 'test',
    });
  });

  it('clipboardAdapter delegates read/write', async () => {
    await readClipboardText('selection');
    await writeClipboardText('x', 'clipboard');
    expect(mockReadClipboardText).toHaveBeenCalled();
    expect(mockWriteClipboardText).toHaveBeenCalledWith('x');
  });

  it('globalShortcutAdapter delegates register', () => {
    const cb = jest.fn();
    registerGlobalShortcut('Cmd+A', cb);
    expect(mockRegisterGlobalShortcut).toHaveBeenCalledWith('Cmd+A', cb);
  });
});

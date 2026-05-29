import type { Keys, ModifierKeys } from "./keys";

export type Keycode = Keys;
export type Platform = "mac" | "windows";

export interface PlatformModifierKey {
  mac: ModifierKeys;
  windows: ModifierKeys;
}

export interface ShortcutDefinition {
  primaryKey: Keycode;
  modifierKey?: PlatformModifierKey;
}

export type KeyboardShortcutHandler = (event: KeyboardEvent) => void;

export interface KeyboardShortcutRegistration {
  id: string;
  shortcut: ShortcutDefinition;
  handler: KeyboardShortcutHandler;
  allowInEditable: boolean;
}

export type KeyMap = Map<string, KeyboardShortcutRegistration[]>;

export interface SequentialShortcutDefinition {
  sequence: readonly ShortcutDefinition[];
  timeoutMs?: number;
}

export type SequentialShortcutMap = readonly {
  shortcut: SequentialShortcutDefinition;
  handler: KeyboardShortcutHandler;
}[];

export interface KeyboardShortcutOptions {
  enabled?: boolean;
  allowInEditable?: boolean;
}

export interface KeyboardShortcutsContextValue {
  registerShortcut: (registration: KeyboardShortcutRegistration) => void;
  unregisterShortcut: (id: string, shortcut: ShortcutDefinition) => void;
}

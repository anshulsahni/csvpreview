import { Keys, ModifierKeys } from "./keys";
import type {
  KeyMap,
  KeyboardShortcutHandler,
  KeyboardShortcutRegistration,
  Platform,
  SequentialShortcutDefinition,
  ShortcutDefinition,
} from "./types";

const MODIFIER_ORDER = [
  ModifierKeys.Meta,
  ModifierKeys.Ctrl,
  ModifierKeys.Alt,
  ModifierKeys.Shift,
] as const;

const KEY_FALLBACKS: Partial<Record<Keys, string>> = {
  [Keys.Escape]: "Escape",
  [Keys.Enter]: "Enter",
  [Keys.Tab]: "Tab",
  [Keys.Space]: " ",
  [Keys.Home]: "Home",
  [Keys.End]: "End",
  [Keys.ArrowUp]: "ArrowUp",
  [Keys.ArrowDown]: "ArrowDown",
  [Keys.ArrowLeft]: "ArrowLeft",
  [Keys.ArrowRight]: "ArrowRight",
};

export function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "windows";
  const value = `${navigator.platform ?? ""} ${navigator.userAgent ?? ""}`;
  return /Mac|iPhone|iPad|iPod/i.test(value) ? "mac" : "windows";
}

export function resolvePlatformModifierKey(
  shortcut: ShortcutDefinition,
  platform: Platform = detectPlatform()
): ModifierKeys | undefined {
  return shortcut.modifierKey?.[platform];
}

export function shortcutSignature(
  shortcut: ShortcutDefinition,
  platform: Platform = detectPlatform()
): string {
  const modifier = resolvePlatformModifierKey(shortcut, platform);
  return modifier ? `${modifier}+${shortcut.primaryKey}` : shortcut.primaryKey;
}

export function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tagName = target.tagName.toLowerCase();
  if (tagName === "textarea" || tagName === "select") return true;
  if (tagName !== "input") return target.getAttribute("role") === "textbox";
  const input = target as HTMLInputElement;
  return input.type !== "checkbox" && input.type !== "radio";
}

export function matchesShortcut(
  event: KeyboardEvent,
  shortcut: ShortcutDefinition,
  platform: Platform = detectPlatform()
): boolean {
  const expectedKey = shortcut.primaryKey;
  const fallback = KEY_FALLBACKS[expectedKey];
  if (event.code !== expectedKey && event.key !== fallback) return false;

  const requiredModifier = resolvePlatformModifierKey(shortcut, platform);
  return MODIFIER_ORDER.every(
    (modifier) => Boolean(event[modifier]) === (modifier === requiredModifier)
  );
}

export function registerShortcut(
  keyMap: KeyMap,
  registration: KeyboardShortcutRegistration,
  platform: Platform = detectPlatform()
): void {
  const signature = shortcutSignature(registration.shortcut, platform);
  const stack = keyMap.get(signature) ?? [];
  keyMap.set(signature, [...stack.filter((item) => item.id !== registration.id), registration]);
}

export function unregisterShortcut(
  keyMap: KeyMap,
  id: string,
  shortcut: ShortcutDefinition,
  platform: Platform = detectPlatform()
): void {
  const signature = shortcutSignature(shortcut, platform);
  const stack = keyMap.get(signature);
  if (!stack) return;
  const next = stack.filter((item) => item.id !== id);
  if (next.length === 0) {
    keyMap.delete(signature);
  } else {
    keyMap.set(signature, next);
  }
}

export function getActiveShortcutRegistration(
  keyMap: KeyMap,
  event: KeyboardEvent,
  platform: Platform = detectPlatform()
): KeyboardShortcutRegistration | null {
  for (const stack of keyMap.values()) {
    const registration = stack.at(-1); // Array.at(-1) returns the last element
    if (!registration) continue;
    if (matchesShortcut(event, registration.shortcut, platform)) return registration;
  }
  return null;
}

export function handleKeyboardShortcutEvent(
  keyMap: KeyMap,
  event: KeyboardEvent,
  platform: Platform = detectPlatform()
): void {
  const registration = getActiveShortcutRegistration(keyMap, event, platform);
  if (!registration) return;
  const isEscape = matchesShortcut(event, { primaryKey: Keys.Escape }, platform);
  if (!registration.allowInEditable && !isEscape && isEditableElement(event.target)) {
    return;
  }
  registration.handler(event);
}

export function createSequentialShortcutHandler(
  shortcut: SequentialShortcutDefinition,
  handler: KeyboardShortcutHandler,
  platform: Platform = detectPlatform()
): KeyboardShortcutHandler {
  let position = 0;
  let lastMatchAt = 0;
  const timeoutMs = shortcut.timeoutMs ?? 1000;

  return (event) => {
    const now = Date.now();
    if (position > 0 && now - lastMatchAt > timeoutMs) {
      position = 0;
    }

    const expected = shortcut.sequence[position];
    if (!expected || !matchesShortcut(event, expected, platform)) {
      position = matchesShortcut(event, shortcut.sequence[0], platform) ? 1 : 0;
      lastMatchAt = position === 1 ? now : 0;
      return;
    }

    position += 1;
    lastMatchAt = now;
    if (position < shortcut.sequence.length) return;

    position = 0;
    lastMatchAt = 0;
    handler(event);
  };
}

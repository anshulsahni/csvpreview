"use client";

import {
  useContext,
  useEffect,
  useRef,
  useState,
  type DependencyList,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { KeyboardShortcutsContext } from "./KeyboardShortcutsProvider";
import type {
  KeyboardShortcutHandler,
  KeyboardShortcutOptions,
  SequentialShortcutDefinition,
  ShortcutDefinition,
} from "./types";
import { createSequentialShortcutHandler } from "./utils";

export function useKeyboardShortcuts(
  shortcut: ShortcutDefinition,
  handler: KeyboardShortcutHandler,
  deps: DependencyList = [],
  options: KeyboardShortcutOptions = {}
): void {
  const context = useContext(KeyboardShortcutsContext);
  const [id] = useState(() => uuidv4());
  const handlerRef = useRef(handler);
  const enabled = options.enabled ?? true;
  const allowInEditable = options.allowInEditable ?? false;
  void deps;

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!context || !enabled) return;

    const registration = {
      id,
      shortcut,
      allowInEditable,
      handler: (event: KeyboardEvent) => handlerRef.current(event),
    };
    context.registerShortcut(registration);
    return () => context.unregisterShortcut(id, shortcut);
  }, [allowInEditable, context, enabled, id, shortcut]);
}

// Used for sequential keybpard shortcuts like G then I, etc.
// Heavily used in application for navigation
// Currently we don't have any, but still keeping it here
// TODO: Remove this comment once, this is being used
export function useNavigationKeyboardShortcuts(
  shortcuts: readonly {
    shortcut: ShortcutDefinition | SequentialShortcutDefinition;
    handler: KeyboardShortcutHandler;
  }[],
  deps: DependencyList = [],
  options: KeyboardShortcutOptions = {}
): void {
  const context = useContext(KeyboardShortcutsContext);
  const idsRef = useRef<string[]>([]);
  const shortcutsRef = useRef(shortcuts);
  const enabled = options.enabled ?? true;
  const allowInEditable = options.allowInEditable ?? false;
  void deps;

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    if (!context || !enabled) return;

    while (idsRef.current.length < shortcuts.length) {
      idsRef.current.push(uuidv4());
    }

    const registrations = shortcuts.flatMap(({ shortcut }, index) => {
      const id = idsRef.current[index];
      if ("sequence" in shortcut) {
        const handler = createSequentialShortcutHandler(shortcut, (event) => {
          shortcutsRef.current[index]?.handler(event);
        });
        return shortcut.sequence.map((definition, stepIndex) => ({
          id: `${id}-${stepIndex}`,
          shortcut: definition,
          allowInEditable,
          handler,
        }));
      }

      return [
        {
          id,
          shortcut,
          allowInEditable,
          handler: (event: KeyboardEvent) => {
            shortcutsRef.current[index]?.handler(event);
          },
        },
      ];
    });

    registrations.forEach((registration) => {
      context.registerShortcut(registration);
    });

    return () => {
      registrations.forEach((registration) => {
        context.unregisterShortcut(registration.id, registration.shortcut);
      });
    };
  }, [allowInEditable, context, enabled, shortcuts]);
}

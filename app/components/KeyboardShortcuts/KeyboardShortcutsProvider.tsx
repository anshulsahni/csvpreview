"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import type {
  KeyboardShortcutRegistration,
  KeyboardShortcutsContextValue,
  KeyMap,
  ShortcutDefinition,
} from "./types";
import {
  detectPlatform,
  handleKeyboardShortcutEvent,
  registerShortcut,
  unregisterShortcut,
} from "./utils";

export const KeyboardShortcutsContext =
  createContext<KeyboardShortcutsContextValue | null>(null);

export interface KeyboardShortcutsProviderProps {
  children: ReactNode;
}

export function KeyboardShortcutsProvider({
  children,
}: KeyboardShortcutsProviderProps) {
  const keyMapRef = useRef<KeyMap>(new Map());
  const platformRef = useRef(detectPlatform());

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      handleKeyboardShortcutEvent(keyMapRef.current, event, platformRef.current);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const register = useCallback((registration: KeyboardShortcutRegistration) => {
    registerShortcut(keyMapRef.current, registration, platformRef.current);
  }, []);

  const unregister = useCallback((id: string, shortcut: ShortcutDefinition) => {
    unregisterShortcut(keyMapRef.current, id, shortcut, platformRef.current);
  }, []);

  const value = useMemo(
    () => ({
      registerShortcut: register,
      unregisterShortcut: unregister,
    }),
    [register, unregister]
  );

  return (
    <KeyboardShortcutsContext.Provider value={value}>
      {children}
    </KeyboardShortcutsContext.Provider>
  );
}

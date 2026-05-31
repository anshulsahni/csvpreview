import { fireEvent, render, screen } from "@testing-library/react";
import { KeyboardShortcutsProvider } from "@/app/components/KeyboardShortcuts/KeyboardShortcutsProvider";
import { useKeyboardShortcuts, useNavigationKeyboardShortcuts } from "@/app/components/KeyboardShortcuts";
import { Keys, ModifierKeys } from "@/app/components/KeyboardShortcuts/keys";
import {
  createSequentialShortcutHandler,
  matchesShortcut,
  registerShortcut,
} from "@/app/components/KeyboardShortcuts/utils";
import type { KeyMap, ShortcutDefinition } from "@/app/components/KeyboardShortcuts/types";

function ShortcutProbe({
  shortcut,
  onRun,
  enabled = true,
  allowInEditable = false,
}: {
  shortcut: ShortcutDefinition;
  onRun: (event: KeyboardEvent) => void;
  enabled?: boolean;
  allowInEditable?: boolean;
}) {
  useKeyboardShortcuts(shortcut, onRun, [onRun], {
    enabled,
    allowInEditable,
  });
  return null;
}

function NavigationShortcutProbe({ onRun }: { onRun: (event: KeyboardEvent) => void }) {
  useNavigationKeyboardShortcuts([
    {
      shortcut: {
        sequence: [{ primaryKey: Keys.KeyG }, { primaryKey: Keys.KeyI }],
      },
      handler: onRun,
    },
  ]);
  return null;
}

describe("KeyboardShortcuts", () => {
  it("registers handlers through the provider", () => {
    const onRun = jest.fn();
    render(
      <KeyboardShortcutsProvider>
        <ShortcutProbe shortcut={{ primaryKey: Keys.Escape }} onRun={onRun} />
      </KeyboardShortcutsProvider>
    );

    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
    expect(onRun).toHaveBeenCalledTimes(1);
  });

  it("resolves platform modifiers for shortcut matching", () => {
    const shortcut = {
      primaryKey: Keys.Enter,
      modifierKey: {
        mac: ModifierKeys.Meta,
        windows: ModifierKeys.Ctrl,
      },
    };

    expect(
      matchesShortcut(
        new KeyboardEvent("keydown", {
          key: "Enter",
          code: "Enter",
          metaKey: true,
        }),
        shortcut,
        "mac"
      )
    ).toBe(true);
    expect(
      matchesShortcut(
        new KeyboardEvent("keydown", {
          key: "Enter",
          code: "Enter",
          ctrlKey: true,
        }),
        shortcut,
        "windows"
      )
    ).toBe(true);
  });

  it("suppresses non-Escape shortcuts in editable elements", () => {
    const onRun = jest.fn();
    render(
      <KeyboardShortcutsProvider>
        <ShortcutProbe shortcut={{ primaryKey: Keys.Enter }} onRun={onRun} />
        <input aria-label="editable" />
      </KeyboardShortcutsProvider>
    );

    fireEvent.keyDown(screen.getByLabelText("editable"), {
      key: "Enter",
      code: "Enter",
    });

    expect(onRun).not.toHaveBeenCalled();
  });

  it("allows Escape shortcuts in editable elements", () => {
    const onRun = jest.fn();
    render(
      <KeyboardShortcutsProvider>
        <ShortcutProbe shortcut={{ primaryKey: Keys.Escape }} onRun={onRun} />
        <textarea aria-label="editable" />
      </KeyboardShortcutsProvider>
    );

    fireEvent.keyDown(screen.getByLabelText("editable"), {
      key: "Escape",
      code: "Escape",
    });

    expect(onRun).toHaveBeenCalledTimes(1);
  });

  it("restores the previous handler when the newest duplicate is unmounted", () => {
    const first = jest.fn();
    const second = jest.fn();

    function Harness({ showSecond }: { showSecond: boolean }) {
      return (
        <KeyboardShortcutsProvider>
          <ShortcutProbe shortcut={{ primaryKey: Keys.Escape }} onRun={first} />
          {showSecond && (
            <ShortcutProbe shortcut={{ primaryKey: Keys.Escape }} onRun={second} />
          )}
        </KeyboardShortcutsProvider>
      );
    }

    const { rerender } = render(<Harness showSecond />);
    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);

    rerender(<Harness showSecond={false} />);
    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("keeps stacked registrations in insertion order for pure key maps", () => {
    const keyMap: KeyMap = new Map();
    const shortcut = {
      primaryKey: Keys.KeyK,
      modifierKey: {
        mac: ModifierKeys.Meta,
        windows: ModifierKeys.Ctrl,
      },
    };
    registerShortcut(keyMap, {
      id: "first",
      shortcut,
      handler: jest.fn(),
      allowInEditable: false,
    });
    registerShortcut(keyMap, {
      id: "second",
      shortcut,
      handler: jest.fn(),
      allowInEditable: false,
    });

    expect(Array.from(keyMap.values())[0].map((item) => item.id)).toEqual([
      "first",
      "second",
    ]);
  });

  it("runs sequential shortcut handlers after the full sequence matches", () => {
    const onRun = jest.fn();
    const handler = createSequentialShortcutHandler(
      {
        sequence: [{ primaryKey: Keys.KeyG }, { primaryKey: Keys.KeyI }],
      },
      onRun
    );

    handler(new KeyboardEvent("keydown", { key: "g", code: "KeyG" }));
    expect(onRun).not.toHaveBeenCalled();

    handler(new KeyboardEvent("keydown", { key: "i", code: "KeyI" }));
    expect(onRun).toHaveBeenCalledTimes(1);
  });

  it("runs sequential shortcuts registered through the provider", () => {
    const onRun = jest.fn();
    render(
      <KeyboardShortcutsProvider>
        <NavigationShortcutProbe onRun={onRun} />
      </KeyboardShortcutsProvider>
    );

    fireEvent.keyDown(document, { key: "g", code: "KeyG" });
    expect(onRun).not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: "i", code: "KeyI" });
    expect(onRun).toHaveBeenCalledTimes(1);
  });
});

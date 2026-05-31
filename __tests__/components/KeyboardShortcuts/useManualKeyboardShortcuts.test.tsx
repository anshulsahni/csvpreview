import { fireEvent, render } from "@testing-library/react";
import { useEffect } from "react";
import { KeyboardShortcutsProvider } from "@/app/components/KeyboardShortcuts/KeyboardShortcutsProvider";
import {
  useManualKeyboardShortcuts,
  type ManualKeyboardShortcutControls,
} from "@/app/components/KeyboardShortcuts/hooks";
import type { KeyboardShortcutHandler } from "@/app/components/KeyboardShortcuts/types";
import { Keys } from "@/app/components/KeyboardShortcuts/keys";
import type { ShortcutDefinition } from "@/app/components/KeyboardShortcuts/types";

const SHORTCUT_A: ShortcutDefinition = { primaryKey: Keys.KeyA };

function ManualProbe({
  onRun,
  controlsRef,
}: {
  onRun: (event: KeyboardEvent) => void;
  controlsRef: { current: ManualKeyboardShortcutControls | null };
}) {
  const controls = useManualKeyboardShortcuts(SHORTCUT_A, onRun);
  useEffect(() => {
    controlsRef.current = controls;
  }, [controls, controlsRef]);
  return null;
}

describe("useManualKeyboardShortcuts", () => {
  it("fires after attach and stops after detach", () => {
    const onRun = jest.fn();
    const controlsRef: { current: ManualKeyboardShortcutControls | null } = { current: null };

    render(
      <KeyboardShortcutsProvider>
        <ManualProbe onRun={onRun} controlsRef={controlsRef} />
      </KeyboardShortcutsProvider>
    );

    // Before attach: no calls
    fireEvent.keyDown(document, { key: "a", code: "KeyA" });
    expect(onRun).toHaveBeenCalledTimes(0);

    // After attach: fires
    controlsRef.current!.attach();
    fireEvent.keyDown(document, { key: "a", code: "KeyA" });
    expect(onRun).toHaveBeenCalledTimes(1);

    // After detach: stops
    controlsRef.current!.detach();
    fireEvent.keyDown(document, { key: "a", code: "KeyA" });
    // Number of calls didn't increment after shortcut was detached
    expect(onRun).toHaveBeenCalledTimes(1);
  });

  it("calling attach twice does not double-register", () => {
    const onRun = jest.fn();
    const controlsRef: { current: ManualKeyboardShortcutControls | null } = { current: null };

    render(
      <KeyboardShortcutsProvider>
        <ManualProbe onRun={onRun} controlsRef={controlsRef} />
      </KeyboardShortcutsProvider>
    );

    controlsRef.current!.attach();
    controlsRef.current!.attach(); // duplicate — should be no-op
    fireEvent.keyDown(document, { key: "a", code: "KeyA" });
    expect(onRun).toHaveBeenCalledTimes(1);
  });

});

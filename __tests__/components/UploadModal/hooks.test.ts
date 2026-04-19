import { act, renderHook, fireEvent } from "@testing-library/react";
import {
  useUploadModal,
  type UseUploadModalArgs,
} from "@/app/components/UploadModal/hooks";

function makeArgs(overrides?: Partial<UseUploadModalArgs>): UseUploadModalArgs {
  return {
    isOpen: true,
    onClose: jest.fn(),
    onFilePicked: jest.fn(),
    onPasteSubmit: jest.fn(),
    onStartBlank: jest.fn(),
    ...overrides,
  };
}

function makeDragEvent(file?: File) {
  return {
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    dataTransfer: file
      ? { files: [file] as unknown as FileList }
      : { files: [] as unknown as FileList },
  } as unknown as React.DragEvent;
}

function makeChangeEvent(file?: File) {
  const input = { value: "non-empty", files: file ? [file] : [] };
  return {
    target: input,
    currentTarget: input,
  } as unknown as React.ChangeEvent<HTMLInputElement>;
}

describe("useUploadModal", () => {
  describe("drag state", () => {
    it("sets isDragging=true on dragEnter and dragOver", () => {
      const { result } = renderHook(() => useUploadModal(makeArgs()));

      act(() => {
        result.current.handleDragEnter(makeDragEvent());
      });
      expect(result.current.isDragging).toBe(true);

      act(() => {
        result.current.handleDragLeave(makeDragEvent());
      });
      expect(result.current.isDragging).toBe(false);

      act(() => {
        result.current.handleDragOver(makeDragEvent());
      });
      expect(result.current.isDragging).toBe(true);
    });

    it("resets isDragging to false on drop", () => {
      const { result } = renderHook(() => useUploadModal(makeArgs()));
      act(() => {
        result.current.handleDragEnter(makeDragEvent());
      });
      act(() => {
        const file = new File(["a,b"], "data.csv", { type: "text/csv" });
        result.current.handleDrop(makeDragEvent(file));
      });
      expect(result.current.isDragging).toBe(false);
    });
  });

  describe("file validation", () => {
    it("accepts a .csv file on drop and calls onFilePicked", () => {
      const onFilePicked = jest.fn();
      const { result } = renderHook(() =>
        useUploadModal(makeArgs({ onFilePicked }))
      );
      const file = new File(["a,b"], "data.csv", { type: "text/csv" });

      act(() => {
        result.current.handleDrop(makeDragEvent(file));
      });

      expect(onFilePicked).toHaveBeenCalledWith(file);
      expect(result.current.fileRejectionMessage).toBeNull();
    });

    it("accepts .csv extension even with non-csv mime type", () => {
      const onFilePicked = jest.fn();
      const { result } = renderHook(() =>
        useUploadModal(makeArgs({ onFilePicked }))
      );
      const file = new File(["x"], "MyData.CSV", { type: "application/octet-stream" });

      act(() => {
        result.current.handleDrop(makeDragEvent(file));
      });

      expect(onFilePicked).toHaveBeenCalledWith(file);
    });

    it("rejects a non-csv file on drop, does not call onFilePicked, sets rejection message", () => {
      const onFilePicked = jest.fn();
      const { result } = renderHook(() =>
        useUploadModal(makeArgs({ onFilePicked }))
      );
      const file = new File(["x"], "notes.txt", { type: "text/plain" });

      act(() => {
        result.current.handleDrop(makeDragEvent(file));
      });

      expect(onFilePicked).not.toHaveBeenCalled();
      expect(result.current.fileRejectionMessage).toBe(
        "Only .csv files are accepted"
      );
    });

    it("validates file input change the same way as drop", () => {
      const onFilePicked = jest.fn();
      const { result } = renderHook(() =>
        useUploadModal(makeArgs({ onFilePicked }))
      );

      const goodFile = new File(["a"], "ok.csv", { type: "text/csv" });
      act(() => {
        result.current.handleFileInputChange(makeChangeEvent(goodFile));
      });
      expect(onFilePicked).toHaveBeenCalledWith(goodFile);

      onFilePicked.mockClear();
      const badFile = new File(["x"], "bad.png", { type: "image/png" });
      act(() => {
        result.current.handleFileInputChange(makeChangeEvent(badFile));
      });
      expect(onFilePicked).not.toHaveBeenCalled();
      expect(result.current.fileRejectionMessage).toBe(
        "Only .csv files are accepted"
      );
    });
  });

  describe("paste submission", () => {
    it("calls onPasteSubmit on Ctrl+Enter when paste area has content", () => {
      const onPasteSubmit = jest.fn();
      const { result } = renderHook(() =>
        useUploadModal(makeArgs({ onPasteSubmit }))
      );

      act(() => {
        result.current.setPastedText("a,b\nc,d");
      });

      const event = {
        key: "Enter",
        ctrlKey: true,
        metaKey: false,
        preventDefault: jest.fn(),
      } as unknown as React.KeyboardEvent<HTMLTextAreaElement>;

      act(() => {
        result.current.handlePasteKeyDown(event);
      });

      expect(onPasteSubmit).toHaveBeenCalledWith("a,b\nc,d");
    });

    it("also fires on Cmd+Enter (mac)", () => {
      const onPasteSubmit = jest.fn();
      const { result } = renderHook(() =>
        useUploadModal(makeArgs({ onPasteSubmit }))
      );

      act(() => {
        result.current.setPastedText("x,y");
      });

      act(() => {
        result.current.handlePasteKeyDown({
          key: "Enter",
          ctrlKey: false,
          metaKey: true,
          preventDefault: jest.fn(),
        } as unknown as React.KeyboardEvent<HTMLTextAreaElement>);
      });

      expect(onPasteSubmit).toHaveBeenCalledWith("x,y");
    });

    it("does NOT call onPasteSubmit when the paste area is empty", () => {
      const onPasteSubmit = jest.fn();
      const { result } = renderHook(() =>
        useUploadModal(makeArgs({ onPasteSubmit }))
      );

      act(() => {
        result.current.handlePasteKeyDown({
          key: "Enter",
          ctrlKey: true,
          metaKey: false,
          preventDefault: jest.fn(),
        } as unknown as React.KeyboardEvent<HTMLTextAreaElement>);
      });

      expect(onPasteSubmit).not.toHaveBeenCalled();
    });

    it("does NOT fire on plain Enter without a modifier key", () => {
      const onPasteSubmit = jest.fn();
      const { result } = renderHook(() =>
        useUploadModal(makeArgs({ onPasteSubmit }))
      );

      act(() => {
        result.current.setPastedText("a,b");
      });

      act(() => {
        result.current.handlePasteKeyDown({
          key: "Enter",
          ctrlKey: false,
          metaKey: false,
          preventDefault: jest.fn(),
        } as unknown as React.KeyboardEvent<HTMLTextAreaElement>);
      });

      expect(onPasteSubmit).not.toHaveBeenCalled();
    });

    it("submitPastedText calls onPasteSubmit with current pasted text when non-empty", () => {
      const onPasteSubmit = jest.fn();
      const { result } = renderHook(() =>
        useUploadModal(makeArgs({ onPasteSubmit }))
      );

      act(() => {
        result.current.setPastedText("col1,col2\n1,2");
      });
      act(() => {
        result.current.submitPastedText();
      });

      expect(onPasteSubmit).toHaveBeenCalledWith("col1,col2\n1,2");
    });

    it("submitPastedText does nothing when paste area is empty or whitespace-only", () => {
      const onPasteSubmit = jest.fn();
      const { result } = renderHook(() =>
        useUploadModal(makeArgs({ onPasteSubmit }))
      );

      act(() => {
        result.current.submitPastedText();
      });
      expect(onPasteSubmit).not.toHaveBeenCalled();

      act(() => {
        result.current.setPastedText("   \n\t");
      });
      act(() => {
        result.current.submitPastedText();
      });
      expect(onPasteSubmit).not.toHaveBeenCalled();
    });
  });

  describe("Escape handling", () => {
    it("fires onClose when Escape is pressed while isOpen=true", () => {
      const onClose = jest.fn();
      renderHook(() => useUploadModal(makeArgs({ onClose })));

      act(() => {
        fireEvent.keyDown(window, { key: "Escape" });
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does NOT fire onClose when Escape is pressed while isOpen=false", () => {
      const onClose = jest.fn();
      renderHook(() =>
        useUploadModal(makeArgs({ isOpen: false, onClose }))
      );

      act(() => {
        fireEvent.keyDown(window, { key: "Escape" });
      });

      expect(onClose).not.toHaveBeenCalled();
    });

    it("does NOT fire onClose for non-Escape keys", () => {
      const onClose = jest.fn();
      renderHook(() => useUploadModal(makeArgs({ onClose })));

      act(() => {
        fireEvent.keyDown(window, { key: "Enter" });
      });
      act(() => {
        fireEvent.keyDown(window, { key: "a" });
      });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("state reset when isOpen flips to false", () => {
    it("clears pastedText, isDragging, and fileRejectionMessage when closed", () => {
      const { result, rerender } = renderHook(
        ({ isOpen }: { isOpen: boolean }) =>
          useUploadModal(makeArgs({ isOpen })),
        { initialProps: { isOpen: true } }
      );

      act(() => {
        result.current.setPastedText("hello");
        result.current.handleDragEnter(makeDragEvent());
        const badFile = new File(["x"], "bad.txt", { type: "text/plain" });
        result.current.handleDrop(makeDragEvent(badFile));
      });

      expect(result.current.pastedText).toBe("hello");
      // handleDrop resets isDragging; rejection message should be set
      expect(result.current.fileRejectionMessage).toBe(
        "Only .csv files are accepted"
      );

      rerender({ isOpen: false });

      expect(result.current.pastedText).toBe("");
      expect(result.current.isDragging).toBe(false);
      expect(result.current.fileRejectionMessage).toBeNull();
    });
  });

  describe("CTA handlers", () => {
    it("handleStartBlankClick calls onStartBlank", () => {
      const onStartBlank = jest.fn();
      const { result } = renderHook(() =>
        useUploadModal(makeArgs({ onStartBlank }))
      );

      act(() => {
        result.current.handleStartBlankClick();
      });

      expect(onStartBlank).toHaveBeenCalledTimes(1);
    });

    it("handleCloseClick calls onClose", () => {
      const onClose = jest.fn();
      const { result } = renderHook(() =>
        useUploadModal(makeArgs({ onClose }))
      );

      act(() => {
        result.current.handleCloseClick();
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("handleBackdropClick calls onClose only when target matches currentTarget", () => {
      const onClose = jest.fn();
      const { result } = renderHook(() =>
        useUploadModal(makeArgs({ onClose }))
      );

      const el = document.createElement("div");
      const inner = document.createElement("div");

      // click originated on the backdrop element itself
      act(() => {
        result.current.handleBackdropClick({
          target: el,
          currentTarget: el,
        } as unknown as React.MouseEvent);
      });
      expect(onClose).toHaveBeenCalledTimes(1);

      // click bubbled up from an inner element - should NOT close
      act(() => {
        result.current.handleBackdropClick({
          target: inner,
          currentTarget: el,
        } as unknown as React.MouseEvent);
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});

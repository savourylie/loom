import { fireEvent, render, screen } from "@testing-library/react";
import React, { act } from "react";
import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { EditorPanel } from "@/components/editor-panel";
import { StoreProvider } from "@/providers/store-provider";
import { defaultTemplateId, getTemplateValue } from "@/lib/editor-templates";
import type { Diagnostic, Document, ParseMetrics } from "@/lib/loom-dsl";

type MockStoreState = {
  arrangement: "split" | "stacked";
  documentValue: string;
  diagnostics: Diagnostic[];
  parseMetrics: ParseMetrics | null;
  lastValidDocument: Document | null;
  renderSignal: { version: number; reason: "auto" | "manual"; at: number };
  templateId: string;
};

type MockStoreApi = MockStoreState & {
  setDocumentValue: (value: string) => void;
  setDiagnostics: (diagnostics: Diagnostic[]) => void;
  setParseMetrics: (metrics: ParseMetrics | null) => void;
  setLastValidDocument: (doc: Document | null) => void;
  triggerRender: (reason: "auto" | "manual") => void;
  setTemplateId: (templateId: string) => void;
};

const TestStoreContext = React.createContext<MockStoreApi | null>(null);

vi.mock("@/providers/store-provider", () => {
  const StoreProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, setState] = React.useState<MockStoreState>(() => ({
      arrangement: "split",
      documentValue: getTemplateValue(defaultTemplateId),
      diagnostics: [],
      parseMetrics: null,
      lastValidDocument: null,
      renderSignal: { version: 0, reason: "auto", at: Date.now() },
      templateId: defaultTemplateId,
    }));

    const api = React.useMemo<MockStoreApi>(
      () => ({
        ...state,
        setDocumentValue: (documentValue) =>
          setState((prev) => ({ ...prev, documentValue })),
        setDiagnostics: (diagnostics) =>
          setState((prev) => ({ ...prev, diagnostics })),
        setParseMetrics: (parseMetrics) =>
          setState((prev) => ({ ...prev, parseMetrics })),
        setLastValidDocument: (lastValidDocument) =>
          setState((prev) => ({ ...prev, lastValidDocument })),
        triggerRender: (reason) =>
          setState((prev) => ({
            ...prev,
            renderSignal: {
              version: prev.renderSignal.version + 1,
              reason,
              at: Date.now(),
            },
          })),
        setTemplateId: (templateId) =>
          setState((prev) => ({ ...prev, templateId })),
      }),
      [state],
    );

    return (
      <TestStoreContext.Provider value={api}>
        {children}
      </TestStoreContext.Provider>
    );
  };

  const useAppStore = <T,>(selector: (state: MockStoreApi) => T): T => {
    const store = React.useContext(TestStoreContext);
    if (!store) {
      throw new Error("Store unavailable");
    }
    return selector(store);
  };

  return { StoreProvider, useAppStore };
});

const parseMock = vi.fn();

vi.mock("@/lib/loom-dsl", () => ({
  parseDocument: (...args: unknown[]) => parseMock(...args),
}));

const documentStub = {
  version: "1.0",
  nodes: [],
  styles: [],
  variables: {},
  breakpoints: [],
};

const metricsStub = {
  parseTimeMs: 1,
  nodeCount: 0,
  diagnosticCount: 0,
  errorCount: 0,
  warningCount: 0,
};

function renderEditor() {
  return render(
    <StoreProvider>
      <EditorPanel />
    </StoreProvider>,
  );
}

describe("EditorPanel", () => {
  beforeEach(() => {
    parseMock.mockImplementation(() => ({
      document: documentStub,
      diagnostics: [],
      metrics: metricsStub,
    }));
  });

  afterEach(() => {
    parseMock.mockReset();
    vi.useRealTimers();
  });

  it("debounces parser invocation to ~140ms", () => {
    vi.useFakeTimers();
    renderEditor();

    expect(parseMock).toHaveBeenCalledTimes(1);

    const editor = screen.getByLabelText(
      /loom dsl editor/i,
    ) as HTMLTextAreaElement;
    act(() => {
      fireEvent.change(editor, { target: { value: `${editor.value}!` } });
    });

    expect(parseMock).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(139);
    });
    expect(parseMock).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(parseMock).toHaveBeenCalledTimes(2);
  });

  it("renders diagnostics returned by the parser", async () => {
    vi.useFakeTimers();

    parseMock.mockImplementation((dsl: string) => {
      if (dsl.includes("oops")) {
        return {
          document: documentStub,
          diagnostics: [
            {
              code: "E011",
              severity: "error",
              message: "Missing closing brace",
              line: 3,
              column: 1,
              hint: "Add `}` to close the block.",
            },
          ],
          metrics: metricsStub,
        };
      }
      return {
        document: documentStub,
        diagnostics: [],
        metrics: metricsStub,
      };
    });

    renderEditor();

    const editor = screen.getByLabelText(
      /loom dsl editor/i,
    ) as HTMLTextAreaElement;
    act(() => {
      fireEvent.change(editor, { target: { value: "oops" } });
    });

    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();

    await screen.findByText(/Missing closing brace/);
    expect(screen.getByText("E011")).toBeInTheDocument();
    expect(screen.getByText(/line 3, col 1/i)).toBeInTheDocument();
  });
});

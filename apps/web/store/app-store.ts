import { createStore } from "zustand/vanilla";
import type { Diagnostic, Document, ParseMetrics } from "loom-dsl";
import { defaultTemplateId, getTemplateValue } from "@/lib/editor-templates";

export type PanelArrangement = "split" | "stacked";

export type RenderReason = "auto" | "manual";

export type RenderSignal = {
  version: number;
  reason: RenderReason;
  at: number;
};

export type AppState = {
  arrangement: PanelArrangement;
  setArrangement: (arrangement: PanelArrangement) => void;
  documentValue: string;
  setDocumentValue: (value: string) => void;
  diagnostics: Diagnostic[];
  setDiagnostics: (diagnostics: Diagnostic[]) => void;
  parseMetrics: ParseMetrics | null;
  setParseMetrics: (metrics: ParseMetrics | null) => void;
  lastValidDocument: Document | null;
  setLastValidDocument: (doc: Document | null) => void;
  renderSignal: RenderSignal;
  triggerRender: (reason: RenderReason) => void;
  templateId: string;
  setTemplateId: (id: string) => void;
};

const initialTemplateValue = getTemplateValue(defaultTemplateId);

export const createAppStore = () =>
  createStore<AppState>()((set) => ({
    arrangement: "split",
    setArrangement: (arrangement) => set({ arrangement }),
    documentValue: initialTemplateValue,
    setDocumentValue: (documentValue) => set({ documentValue }),
    diagnostics: [],
    setDiagnostics: (diagnostics) => set({ diagnostics }),
    parseMetrics: null,
    setParseMetrics: (parseMetrics) => set({ parseMetrics }),
    lastValidDocument: null,
    setLastValidDocument: (lastValidDocument) => set({ lastValidDocument }),
    renderSignal: {
      version: 0,
      reason: "auto",
      at: Date.now(),
    },
    triggerRender: (reason) =>
      set((state) => ({
        renderSignal: {
          version: state.renderSignal.version + 1,
          reason,
          at: Date.now(),
        },
      })),
    templateId: defaultTemplateId,
    setTemplateId: (templateId) => set({ templateId }),
  }));

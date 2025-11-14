import { createStore } from "zustand/vanilla";

export type PanelArrangement = "split" | "stacked";

export type AppState = {
  arrangement: PanelArrangement;
  setArrangement: (arrangement: PanelArrangement) => void;
};

export const createAppStore = () =>
  createStore<AppState>()((set) => ({
    arrangement: "split",
    setArrangement: (arrangement) => set({ arrangement }),
  }));

import { create } from "zustand";

interface GlobalErrorState {
  serverDown: boolean;
  setServerDown: (v: boolean) => void;
}

export const useGlobalErrorStore = create<GlobalErrorState>((set) => ({
  serverDown: false,
  setServerDown: (v) => set({ serverDown: v }),
}));

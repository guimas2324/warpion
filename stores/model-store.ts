"use client";

import { create } from "zustand";
import type { ModelCatalogItem } from "@/types/models";

type ModelStore = {
  models: ModelCatalogItem[];
  setModels: (models: ModelCatalogItem[]) => void;
};

export const useModelStore = create<ModelStore>((set) => ({
  models: [],
  setModels: (models) => set({ models }),
}));


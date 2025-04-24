"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import {
  EmbeddingModel,
  embeddingModels,
  ChatModel,
  chatModels,
} from "@/lib/ai/models";

interface GlobalState {
  embeddingModel: EmbeddingModel;
  chatModel: ChatModel;
  selectedOrgId: string | null;
}

interface GlobalStateContextType {
  state: GlobalState;
  setState: (newState: Partial<GlobalState>) => void;
}

const initialState: GlobalState = {
  embeddingModel: embeddingModels[0],
  chatModel: chatModels[0],
  selectedOrgId: null,
};

const GlobalStateContext = createContext<GlobalStateContextType | undefined>(
  undefined
);

export function GlobalStateProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const [state, setState] = useState<GlobalState>(initialState);

  const updateState = (newState: Partial<GlobalState>) => {
    setState((prev) => ({ ...prev, ...newState }));
  };

  return (
    <GlobalStateContext.Provider value={{ state, setState: updateState }}>
      {children}
    </GlobalStateContext.Provider>
  );
}

export function useGlobalState() {
  const context = useContext(GlobalStateContext);
  if (context === undefined) {
    throw new Error("useGlobalState must be used within a GlobalStateProvider");
  }
  return context;
}

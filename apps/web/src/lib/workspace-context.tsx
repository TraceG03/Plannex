"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api, { type Workspace } from "./api";
import { useAuth } from "./auth-context";

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isLoading: boolean;
  setCurrentWorkspace: (ws: Workspace) => void;
  createWorkspace: (name: string) => Promise<Workspace>;
  refetch: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(null);

  const { data: workspaces = [], isLoading, refetch } = useQuery({
    queryKey: ["workspaces"],
    queryFn: api.workspaces.list,
    enabled: !!user
  });

  useEffect(() => {
    if (workspaces.length > 0 && !currentWorkspace) {
      const savedId = localStorage.getItem("workspaceId");
      const saved = workspaces.find((w) => w.id === savedId);
      setCurrentWorkspaceState(saved ?? workspaces[0]);
    }
  }, [workspaces, currentWorkspace]);

  const setCurrentWorkspace = useCallback((ws: Workspace) => {
    setCurrentWorkspaceState(ws);
    localStorage.setItem("workspaceId", ws.id);
  }, []);

  const createWorkspace = useCallback(async (name: string) => {
    const ws = await api.workspaces.create({ name });
    await queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    setCurrentWorkspace(ws);
    return ws;
  }, [queryClient, setCurrentWorkspace]);

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        isLoading,
        setCurrentWorkspace,
        createWorkspace,
        refetch
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return context;
}

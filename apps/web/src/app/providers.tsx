"use client";

import { ReactNode } from "react";
import { QueryProvider } from "@/lib/query-provider";
import { AuthProvider } from "@/lib/auth-context";
import { WorkspaceProvider } from "@/lib/workspace-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <WorkspaceProvider>{children}</WorkspaceProvider>
      </AuthProvider>
    </QueryProvider>
  );
}

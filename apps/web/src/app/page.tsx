"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";
import { Sidebar } from "@/components/sidebar";
import TodayPageContent from "./(app)/page";

export default function RootPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { currentWorkspace, isLoading: wsLoading, workspaces, createWorkspace } = useWorkspace();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || wsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d0d0f]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          <span className="text-sm text-zinc-400">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // No workspace - prompt to create one
  if (workspaces.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d0d0f] px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">Create your workspace</h1>
          <p className="mt-2 text-sm text-zinc-400">Get started by creating your first workspace</p>
          <form
            className="mt-6"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const name = (form.elements.namedItem("name") as HTMLInputElement).value;
              await createWorkspace(name);
            }}
          >
            <input
              name="name"
              type="text"
              placeholder="Workspace name"
              className="h-11 w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 text-white placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              required
            />
            <button
              type="submit"
              className="mt-3 h-11 w-full rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 font-medium text-white transition-opacity hover:opacity-90"
            >
              Create Workspace
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0d0d0f]">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        {currentWorkspace ? (
          <TodayPageContent />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-zinc-400">Select a workspace</span>
          </div>
        )}
      </main>
    </div>
  );
}

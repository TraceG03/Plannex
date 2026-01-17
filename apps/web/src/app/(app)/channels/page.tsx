"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { useWorkspace } from "@/lib/workspace-context";
import api, { type Channel } from "@/lib/api";

export default function ChannelsPage() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const wsId = currentWorkspace?.id ?? "";

  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [showNewChannel, setShowNewChannel] = useState(false);

  const { data: channels = [], isLoading } = useQuery({
    queryKey: ["channels", wsId],
    queryFn: () => api.channels.list(wsId),
    enabled: !!wsId
  });

  const createChannelMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      api.channels.create(wsId, data),
    onSuccess: (channel) => {
      queryClient.invalidateQueries({ queryKey: ["channels", wsId] });
      setSelectedChannel(channel.id);
      setShowNewChannel(false);
    }
  });

  const updateChannelMutation = useMutation({
    mutationFn: ({ id, notesMd }: { id: string; notesMd: string }) =>
      api.channels.update(wsId, id, { notesMd }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["channels", wsId] })
  });

  const channel = channels.find((c) => c.id === selectedChannel);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 border-r border-zinc-800 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-white">Channels</h2>
          <button
            onClick={() => setShowNewChannel(true)}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-1">
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setSelectedChannel(ch.id)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                selectedChannel === ch.id
                  ? "bg-violet-500/20 text-violet-400"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <span className="text-zinc-500">#</span>
              {ch.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {channel ? (
          <ChannelContent
            channel={channel}
            onUpdateNotes={(notesMd) =>
              updateChannelMutation.mutate({ id: channel.id, notesMd })
            }
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-500">
            Select a channel to view
          </div>
        )}
      </div>

      {/* New Channel Modal */}
      {showNewChannel && (
        <NewChannelModal
          onClose={() => setShowNewChannel(false)}
          onCreate={(data) => createChannelMutation.mutate(data)}
          isLoading={createChannelMutation.isPending}
        />
      )}
    </div>
  );
}

function ChannelContent({
  channel,
  onUpdateNotes
}: {
  channel: Channel;
  onUpdateNotes: (notesMd: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(channel.notesMd ?? "");

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white"># {channel.name}</h1>
          {channel.description && (
            <p className="mt-1 text-sm text-zinc-400">{channel.description}</p>
          )}
        </div>
        <span className="text-sm text-zinc-500">{channel.taskCount} tasks</span>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-medium text-white">Channel Notes</h2>
          <button
            onClick={() => {
              if (isEditing) {
                onUpdateNotes(notes);
              }
              setIsEditing(!isEditing);
            }}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-violet-400 hover:bg-violet-500/20"
          >
            {isEditing ? "Save" : "Edit"}
          </button>
        </div>

        {isEditing ? (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={12}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-4 font-mono text-sm text-white focus:border-violet-500 focus:outline-none"
            placeholder="Write notes in Markdown..."
          />
        ) : channel.notesMd ? (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{channel.notesMd}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No notes yet. Click Edit to add notes.</p>
        )}
      </div>
    </div>
  );
}

function NewChannelModal({
  onClose,
  onCreate,
  isLoading
}: {
  onClose: () => void;
  onCreate: (data: { name: string; description?: string }) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({ name, description: description || undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl animate-slide-up">
        <h2 className="mb-4 text-lg font-semibold text-white">New Channel</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-white focus:border-violet-500 focus:outline-none"
              placeholder="channel-name"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-white focus:border-violet-500 focus:outline-none"
              placeholder="Optional description"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Create Channel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

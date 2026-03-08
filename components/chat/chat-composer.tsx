'use client';

import { useRef } from 'react';
import { MessageInput } from '@chatscope/chat-ui-kit-react';
import { Paperclip, X } from 'lucide-react';

interface ChatComposerProps {
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: (text: string) => void;
  selectedFile: File | null;
  onSelectFile: (file: File | null) => void;
  disabled?: boolean;
}

export default function ChatComposer({
  draft,
  onDraftChange,
  onSend,
  selectedFile,
  onSelectFile,
  disabled = false,
}: ChatComposerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="space-y-3">
      {selectedFile && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm">
          <div className="flex min-w-0 items-center gap-2">
            <Paperclip size={16} className="text-muted-foreground" />
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelectFile(null)}
            className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/*,video/mp4,video/webm,video/quicktime,application/pdf"
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          onSelectFile(file);
          event.currentTarget.value = '';
        }}
      />

      <MessageInput
        value={draft}
        placeholder="Write a message..."
        attachButton
        sendButton
        disabled={disabled}
        sendDisabled={disabled || (!draft.trim() && !selectedFile)}
        attachDisabled={disabled}
        onAttachClick={() => inputRef.current?.click()}
        onChange={(_, __, innerText) => onDraftChange(innerText)}
        onSend={(_, __, innerText) => onSend(innerText)}
      />
    </div>
  );
}

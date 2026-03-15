'use client';

import {
  ChatContainer,
  MainContainer,
  Message,
  MessageList,
} from '@chatscope/chat-ui-kit-react';
import { Download, FileText } from 'lucide-react';
import { getAvatarUrl } from '@/lib/avatar';
import type { ResolvedChatMessage } from '@/lib/chat-crypto';
import { cn } from '@/lib/utils';

interface ChatThreadProps {
  messages: ResolvedChatMessage[];
  currentUserId: string;
}

const formatSentTime = (isoDate: string) =>
  new Date(isoDate).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

export default function ChatThread({ messages, currentUserId }: ChatThreadProps) {
  return (
    <div className="relative h-full min-h-0">
      <MainContainer responsive>
        <ChatContainer>
          <MessageList autoScrollToBottom autoScrollToBottomOnMount className="bg-background">
            {messages.map((message) => {
              const isOutgoing = String(message.sender.id) === String(currentUserId);
              const direction = isOutgoing ? 'outgoing' : 'incoming';
              const attachmentUrl = message.resolved_attachment_url || message.attachment_url;
              const attachmentName = message.resolved_attachment_name || message.attachment_name;
              const attachmentMime = message.resolved_attachment_mime || message.attachment_mime;
              const hasAttachment = Boolean(attachmentUrl);

              return (
                <Message
                  key={message.id}
                  model={{
                    direction,
                    position: 'single',
                    type: 'custom',
                    sender: message.sender.name,
                    sentTime: formatSentTime(message.created_at),
                  }}
                >
                  <Message.CustomContent>
                    <div className={cn('max-w-[320px] space-y-2', isOutgoing && 'ml-auto')}>
                      <div
                        className={cn(
                          'rounded-2xl px-4 py-3 shadow-sm',
                          isOutgoing
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground'
                        )}
                      >
                        {message.resolved_body && (
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.resolved_body}</p>
                        )}

                        {message.decryption_error && (
                          <p className="text-xs opacity-80">{message.decryption_error}</p>
                        )}

                        {hasAttachment && message.message_type === 'image' && (
                          <a
                            href={attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 block overflow-hidden rounded-xl border border-black/10 bg-black/5"
                          >
                            <img
                              src={attachmentUrl}
                              alt={attachmentName || 'Uploaded image'}
                              className="max-h-64 w-full object-cover"
                            />
                          </a>
                        )}

                        {hasAttachment && message.message_type === 'file' && (
                          <a
                            href={attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={cn(
                              'mt-2 flex items-center gap-3 rounded-xl border px-3 py-2 text-sm transition-colors',
                              isOutgoing
                                ? 'border-white/20 bg-white/10 hover:bg-white/15'
                                : 'border-border bg-background hover:bg-muted'
                            )}
                          >
                            <FileText size={18} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium">
                                {attachmentName || 'Attachment'}
                              </p>
                              <p className="truncate text-xs opacity-80">
                                {attachmentMime || 'Download file'}
                              </p>
                            </div>
                            <Download size={16} />
                          </a>
                        )}
                      </div>

                      <div
                        className={cn(
                          'flex items-center gap-2 px-1 text-xs text-muted-foreground',
                          isOutgoing && 'justify-end'
                        )}
                      >
                        <img
                          src={getAvatarUrl(message.sender.avatar, message.sender.name)}
                          alt={message.sender.name}
                          className="h-5 w-5 rounded-full object-cover"
                        />
                        <span>{message.sender.name}</span>
                        <span>{formatSentTime(message.created_at)}</span>
                      </div>
                    </div>
                  </Message.CustomContent>
                </Message>
              );
            })}
          </MessageList>
        </ChatContainer>
      </MainContainer>
    </div>
  );
}

import type { Conversation } from '@/lib/types';

export type ConversationStatus = 'new' | 'responded' | 'closed';

export const conversationStatusLabel: Record<ConversationStatus, string> = {
  new: 'New',
  responded: 'Responded',
  closed: 'Closed',
};

export function getConversationStatus(conversation: Conversation, currentUserId?: string): ConversationStatus {
  if (conversation.status === 'new' || conversation.status === 'responded' || conversation.status === 'closed') {
    return conversation.status;
  }

  if (!conversation.lastMessage || !currentUserId) {
    return 'new';
  }

  return conversation.lastMessage.senderId === currentUserId ? 'responded' : 'new';
}

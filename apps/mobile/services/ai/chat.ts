// =============================================================================
// TRANSFORMR -- AI Chat Coach Service
// Thin client wrapper around the ai-chat-coach Edge Function plus direct
// table reads for conversation history.
// =============================================================================

import { supabase } from '@services/supabase';
import { buildUserAIContext } from './context';
import type {
  ChatConversation,
  ChatMessage,
  ChatSendResponse,
  ChatTopic,
} from '@app-types/ai';

interface SendChatMessageArgs {
  conversationId: string | null;
  message: string;
  topic?: ChatTopic;
}

export async function sendChatMessage(
  args: SendChatMessageArgs,
): Promise<ChatSendResponse> {
  const { data: { user } } = await supabase.auth.getUser();
  const userContext = user ? await buildUserAIContext(user.id).catch(() => null) : null;

  const { data, error } = await supabase.functions.invoke('ai-chat-coach', {
    body: {
      conversation_id: args.conversationId,
      message: args.message,
      topic: args.topic ?? 'general',
      user_context: userContext,
    },
  });

  if (error) throw error;
  if (!data) throw new Error('Empty response from AI Chat Coach');
  return data as ChatSendResponse;
}

export async function fetchConversations(): Promise<ChatConversation[]> {
  const { data, error } = await supabase
    .from('ai_chat_conversations')
    .select('*')
    .eq('is_archived', false)
    .order('pinned', { ascending: false })
    .order('last_message_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return (data ?? []) as ChatConversation[];
}

export async function fetchConversation(
  conversationId: string,
): Promise<ChatConversation> {
  const { data, error } = await supabase
    .from('ai_chat_conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (error) throw error;
  return data as ChatConversation;
}

export async function fetchMessages(
  conversationId: string,
): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('ai_chat_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as ChatMessage[];
}

export async function archiveConversation(
  conversationId: string,
): Promise<void> {
  const { error } = await supabase
    .from('ai_chat_conversations')
    .update({ is_archived: true })
    .eq('id', conversationId);

  if (error) throw error;
}

export async function deleteConversation(
  conversationId: string,
): Promise<void> {
  const { error } = await supabase
    .from('ai_chat_conversations')
    .delete()
    .eq('id', conversationId);

  if (error) throw error;
}

export async function renameConversation(
  conversationId: string,
  title: string,
): Promise<void> {
  const { error } = await supabase
    .from('ai_chat_conversations')
    .update({ title })
    .eq('id', conversationId);

  if (error) throw error;
}

export async function togglePinConversation(
  conversationId: string,
  pinned: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('ai_chat_conversations')
    .update({ pinned })
    .eq('id', conversationId);

  if (error) throw error;
}

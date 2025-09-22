export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  is_archived: boolean;
  client_id: string;
}

export interface ConversationsResponse {
  success: boolean;
  message: string;
  data: {
    conversations: Conversation[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface ConversationWithMessages extends Conversation {
  messages: {
    id: string;
    content: string;
    role: 'user' | 'assistant' | 'system';
    created_at: string;
    updated_at: string;
  }[];
}
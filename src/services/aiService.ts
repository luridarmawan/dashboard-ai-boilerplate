/**
 * AI Service
 * 
 * Service for handling AI-related operations like conversations and messages
 */

/**
 * Creates a new conversation in the database
 * @param userId User ID
 * @param title Conversation title
 * @param content Initial message content
 * @param token Authentication token
 * @param clientId Client ID
 * @returns Promise with conversation data
 */
export const createConversation = async (
  userId: string,
  title: string,
  content: string,
  token: string,
  clientId?: string
): Promise<{ conversation: { id: string }, message: { id: string } }> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...(clientId && { 'X-Client-ID': clientId })
      },
      body: JSON.stringify({
        user_id: userId,
        title: title.substring(0, 50) + (title.length > 50 ? '...' : ''),
        content
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create conversation: ${await response.text()}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

/**
 * Saves a message to the database
 * @param conversationId Conversation ID
 * @param userId User ID
 * @param role Message role (user or assistant)
 * @param content Message content
 * @param parentId Optional parent message ID
 * @param model Optional AI model used
 * @param token Authentication token
 * @param statusId Message status ID (default: 1 - Completed)
 * @param usageData Optional token usage data
 * @param clientId Client ID
 * @returns Promise with message data
 */
export const saveMessage = async (
  conversationId: string,
  userId: string | undefined,
  role: 'user' | 'assistant',
  content: string,
  token: string,
  clientId: string,
  parentId?: string | null,
  model?: string,
  statusId: number = 1,
  usageData?: { prompt_tokens?: number, completion_tokens?: number, total_tokens?: number },
): Promise<{ id: string }> => {
  try {
    const messageData: any = {
      conversation_id: conversationId,
      user_id: userId,
      role,
      content,
      status_id: statusId
    };

    // Add optional fields if provided
    if (parentId) messageData.parent_id = parentId;
    if (model) messageData.model = model;
    if (usageData) {
      if (usageData.prompt_tokens) messageData.prompt_tokens = usageData.prompt_tokens;
      if (usageData.completion_tokens) messageData.completion_tokens = usageData.completion_tokens;
      if (usageData.total_tokens) messageData.total_tokens = usageData.total_tokens;
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Client-ID': clientId
      },
      body: JSON.stringify(messageData)
    });

    if (!response.ok) {
      throw new Error(`Failed to save message: ${await response.text()}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
};

/**
 * Creates an empty streaming message in the database
 * @param conversationId Conversation ID
 * @param userId User ID
 * @param parentId Parent message ID
 * @param model AI model used
 * @param token Authentication token
 * @param clientId Client ID
 * @returns Promise with message data
 */
export const createStreamingMessage = async (
  conversationId: string,
  userId: string | undefined,
  parentId: string | null,
  model: string,
  token: string,
  clientId?: string
): Promise<{ id: string }> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/messages/streaming`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...(clientId && { 'X-Client-ID': clientId })
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        user_id: userId,
        parent_id: parentId,
        model
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create streaming message: ${await response.text()}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error creating streaming message:', error);
    throw error;
  }
};

/**
 * Updates a message in the database
 * @param messageId Message ID
 * @param content New message content
 * @param token Authentication token
 * @param errorMessage Optional error message
 * @param statusId Optional status ID
 * @param usageData Optional token usage data
 * @param clientId Client ID
 * @returns Promise with updated message data
 */
export const updateMessage = async (
  messageId: string,
  content: string,
  token: string,
  errorMessage?: string,
  statusId?: number,
  usageData?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  },
  clientId?: string
): Promise<any> => {
  try {
    const updateData: any = { content };
    if (errorMessage) updateData.error_message = errorMessage;
    if (statusId) updateData.status_id = statusId;
    
    // Add token usage data if available
    if (usageData) {
      if (usageData.prompt_tokens) updateData.prompt_tokens = usageData.prompt_tokens;
      if (usageData.completion_tokens) updateData.completion_tokens = usageData.completion_tokens;
      if (usageData.total_tokens) updateData.total_tokens = usageData.total_tokens;
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}/messages/${messageId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...(clientId && { 'X-Client-ID': clientId })
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error(`Failed to update message: ${await response.text()}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating message:', error);
    throw error;
  }
};
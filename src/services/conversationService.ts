import { Conversation, ConversationsResponse, ConversationWithMessages } from '../types/conversation';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082/api';
const topicPrompt = import.meta.env.VITE_PROMPT_TOPIC;

/**
 * Fetches conversations for the authenticated user
 * @param token Authentication token
 * @param clientId Optional client ID for filtering
 * @param page Page number for pagination (default: 1)
 * @param limit Number of conversations per page (default: 50)
 * @returns Promise with conversations data
 */
export const fetchConversations = async (
  token: string,
  clientId?: string,
  page: number = 1,
  limit: number = 20
): Promise<ConversationsResponse> => {
  try {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    if (clientId) {
      headers['X-Client-ID'] = clientId;
    }

    const response = await fetch(
      `${API_BASE_URL}/conversations?page=${page}&limit=${limit}`,
      { headers }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Please login again');
      }
      throw new Error(`Failed to fetch conversations: ${response.status}`);
    }

    const result: ConversationsResponse = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch conversations');
    }

    return result;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
};

/**
 * Fetches a specific conversation with its messages
 * @param conversationId Conversation ID
 * @param token Authentication token
 * @param clientId Optional client ID for validation
 * @returns Promise with conversation data including messages
 */
export const fetchConversation = async (
  conversationId: string,
  token: string,
  clientId?: string
): Promise<ConversationWithMessages> => {
  try {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    if (clientId) {
      headers['X-Client-ID'] = clientId;
    }

    const response = await fetch(
      `${API_BASE_URL}/conversations/${conversationId}`,
      { headers }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Please login again');
      }
      if (response.status === 404) {
        throw new Error('Conversation not found');
      }
      throw new Error(`Failed to fetch conversation: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch conversation');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching conversation:', error);
    throw error;
  }
};

/**
 * Updates a conversation
 * @param conversationId Conversation ID
 * @param updates Updates to apply (title, is_archived)
 * @param token Authentication token
 * @param clientId Optional client ID for validation
 * @returns Promise with updated conversation data
 */
export const updateConversation = async (
  conversationId: string,
  updates: { title?: string; is_archived?: boolean },
  token: string,
  clientId?: string
): Promise<Conversation> => {
  try {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    if (clientId) {
      headers['X-Client-ID'] = clientId;
    }

    const response = await fetch(
      `${API_BASE_URL}/conversations/${conversationId}`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Please login again');
      }
      if (response.status === 404) {
        throw new Error('Conversation not found');
      }
      throw new Error(`Failed to update conversation: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to update conversation');
    }

    return result.data;
  } catch (error) {
    console.error('Error updating conversation:', error);
    throw error;
  }
};

/**
 * Deletes a conversation (soft delete)
 * @param conversationId Conversation ID
 * @param token Authentication token
 * @param clientId Optional client ID for validation
 * @returns Promise with success status
 */
export const deleteConversation = async (
  conversationId: string,
  token: string,
  clientId?: string
): Promise<void> => {
  try {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    if (clientId) {
      headers['X-Client-ID'] = clientId;
    }

    const response = await fetch(
      `${API_BASE_URL}/conversations/${conversationId}`,
      {
        method: 'DELETE',
        headers,
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Please login again');
      }
      if (response.status === 404) {
        throw new Error('Conversation not found');
      }
      throw new Error(`Failed to delete conversation: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to delete conversation');
    }
  } catch (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
};

/**
 * Updates conversation topic using AI
 * @param conversationId Conversation ID
 * @param prompt Prompt for generating topic
 * @param token Authentication token
 * @param clientId Client ID for validation
 * @returns Promise with updated conversation data
 */
export const updateTopic = async (
  conversationId: string,
  prompt: string,
  token: string,
  clientId: string,
  useStream: boolean = false
): Promise<Conversation> => {
  try {
    const apiModel = '';
    const apiUrl = `${API_BASE_URL}/ai/chat/completions`;

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    if (clientId) {
      headers['X-Client-ID'] = clientId;
    }

    // Generate topic using AI - try with stream: false first
    let customPrompt = topicPrompt.replaceAll('${message}', prompt)
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: apiModel,
        messages: [
          {
            role: 'user',
            content: customPrompt,
          },
        ],
        stream: useStream,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API request failed with status ${response.status}`);
    }

    let contentTopic = '';

    // Check if response is a stream by examining content-type header
    const contentType = response.headers.get('content-type');
    const isStream = contentType?.includes('text/event-stream') ||
      contentType?.includes('text/plain') ||
      contentType?.includes('application/x-ndjson');

    if (isStream) {
      // Handle stream response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Failed to get stream reader');
      }

      let buffer = '';
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          buffer += decoder.decode(value, { stream: true });

          // Process complete lines in buffer
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.trim() === '') continue;

            // Handle Server-Sent Events format
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();

              if (data === '[DONE]') {
                done = true;
                break;
              }

              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  contentTopic += delta;
                }
              } catch (parseError) {
                // If not JSON, treat as plain text
                contentTopic += data;
              }
            } else {

              // n8n streaming
              try {
                const parsed = JSON.parse(line);
                if (parsed.type === 'item') {
                  const content = parsed.content;
                  contentTopic += content;
                }
                if (parsed.type === 'end') {
                  done = true;
                }

              } catch (error) {
                // Handle plain text stream
                contentTopic += line;
              }


            }
          }
        }
      }

      // Process any remaining buffer content
      if (buffer.trim()) {
        if (buffer.startsWith('data: ')) {
          const data = buffer.slice(6).trim();
          if (data !== '[DONE]') {
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                contentTopic += delta;
              }
            } catch (parseError) {
              contentTopic += data;
            }
          }
        } else {
          contentTopic += buffer;
        }
      }
    } else {
      // Handle regular JSON response
      const dataResponse = await response.json();
      contentTopic = dataResponse.choices?.[0]?.message?.content || '';
    }

    if (!contentTopic || contentTopic.trim() === '') {
      throw new Error('Failed to generate topic from AI response');
    }

    // Clean and truncate the topic
    contentTopic = contentTopic.trim();
    contentTopic = contentTopic.length > 255
      ? contentTopic.slice(0, 255)
      : contentTopic;

    // Update conversation with the generated topic
    const conversationData = await updateConversation(
      conversationId,
      { title: contentTopic },
      token,
      clientId
    );

    // Trigger reload of topic chat list
    window.dispatchEvent(new CustomEvent('reloadChatTopics'));

    // console.log('Conversation updated:', conversationData);
    return conversationData;

  } catch (error) {
    console.error('Error updating topic:', error);
    throw error;
  }
};
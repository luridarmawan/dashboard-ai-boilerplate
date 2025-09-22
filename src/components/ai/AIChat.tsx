import { useState, useRef, useEffect } from "react";
import Button from "../ui/button/Button";
import { useAuth } from '../../context/AuthContext';
import { useI18n } from "../../context/I18nContext";
import { useClient } from "../../context/ClientContext";
import { getConfiguration, getConfigurationAsBoolean, getFormattedDateTime, isJSON } from '../../utils';
import MarkdownDiv from "../common/MarkdownDiv";
import { constants } from '../../constants';
import { createConversation, saveMessage, createStreamingMessage, updateMessage } from '../../services/aiService';
import { Message } from "../../types/Message";
import { updateTopic } from "../../services/conversationService";
import { logs } from "../../utils";

interface AIProps {
  id?: string; // Optional conversation ID for existing conversations
  initialMessages?: Message[]; // Optional initial messages
}

// Simple unique ID generator to prevent ID collisions
let idCounter = 0;
let messageCount = 0;
const generateUniqueId = () => {
  return `msg_${Date.now()}_${++idCounter}`;
};

const AIChat = ({ id, initialMessages }: AIProps) => {
  const { t } = useI18n();
  const { selectedClient } = useClient();
  const [messages, setMessages] = useState<Message[]>(
    initialMessages || [
      {
        id: generateUniqueId(),
        role: "assistant",
        content: t('ai.hello'),
        createdAt: new Date(),
        timestamp: new Date(),
      },
    ]
  );
  const [conversationId, setConversationId] = useState<string | null>(id || null);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false); // New state for streaming indicator
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { token, user } = useAuth();


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: generateUniqueId(),
      role: "user",
      content: inputValue,
      createdAt: new Date(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Create a new assistant message ID
    const assistantMessageId = generateUniqueId();

    // Variables to store message IDs and conversation ID from the database
    let userMessageId: string | null = null;
    let assistantMessageDbId: string | null = null;
    // Local variable to store the conversation ID for immediate use
    let currentConversationId: string | null = null;

    // Define API variables outside try block so they're available in catch block
    const apiToken = token;
    const apiModel = "";

    try {
      // Get API URL from environment variable
      const apiUrl = import.meta.env.VITE_API_URL + '/ai/chat/completions';
      const apiStream = await getConfigurationAsBoolean('ai.stream', import.meta.env.VITE_CHAT_API_STREAM === 'true', apiToken);
      let systemPrompt = await getConfiguration('ai.system_prompt', constants.PROMPT_DEFAULT, apiToken);
      systemPrompt = systemPrompt.replaceAll('{{currentDateTime}}', getFormattedDateTime());
      systemPrompt = systemPrompt.replaceAll('{{timezone}}', import.meta.env.VITE_TIMEZONE);
      systemPrompt = systemPrompt.replaceAll('{{user.fullName}}', (user?.firstName + ' ' + user?.lastName).trim() || '' || '');
      systemPrompt = systemPrompt.replaceAll('{{dashboardUrl}}', import.meta.env.VITE_APP_URL);
      systemPrompt = systemPrompt.replaceAll('{{user.email}}', user?.email || '');

      if (!apiUrl) {
        throw new Error("VITE_CHAT_API_URL is not defined in environment variables");
      }

      // Prepare messages for API (only send last 10 messages to keep context manageable)
      const messagesForAPI = [...messages, userMessage]
        .slice(-10)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      // Create a new conversation in the database if we don't have one already
      if (!conversationId) {
        try {
          const { conversation, message } = await createConversation(
            user?.id || '',
            inputValue.substring(0, 50) + (inputValue.length > 50 ? '...' : ''),
            inputValue,
            apiToken || '',
            selectedClient?.id || ''
          );
          // Update the conversationId state
          setConversationId(conversation.id);
          // Set the local variable for immediate use since state updates are asynchronous
          currentConversationId = conversation.id;
          console.log('Conversation created with ID:', conversation.id);
          userMessageId = message.id;
          console.log('User message created with ID:', userMessageId);
        } catch (error) {
          console.error('Error creating conversation:', error);
        }
      } else {
        // If we already have a conversation, just create a new user message
        try {
          const messageData = await saveMessage(
            conversationId,
            user?.id || '',
            'user',
            inputValue,
            apiToken || '',
            selectedClient?.id || ''
          );
          userMessageId = messageData.id;
          console.log('User message created:', userMessageId);
        } catch (error) {
          console.error('Error creating user message:', error);
        }
      }

      if (apiStream) {
        // Call the chat API with streaming
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiToken}`
          },
          body: JSON.stringify({
            model: apiModel,
            messages: [
              {
                role: "system",
                content: systemPrompt,
              },
              ...messagesForAPI,
            ],
            stream: true, // Enable streaming
          }),
        });

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        // Create a new assistant message with empty content
        const assistantMessage: Message = {
          id: assistantMessageId,
          role: "assistant",
          content: "",
          createdAt: new Date(),
          timestamp: new Date(),
        };

        // Add the assistant message to the UI
        setMessages((prev) => [...prev, assistantMessage]);
        setIsStreaming(true); // Set streaming to true

        // Create an empty assistant message in the database for streaming
        // Use the local variable if available, otherwise use the state variable
        const effectiveConversationId = currentConversationId || conversationId;
        if (effectiveConversationId) {
          try {
            const messageData = await createStreamingMessage(
              effectiveConversationId,
              user?.id || '',
              userMessageId,
              apiModel,
              apiToken || '',
              selectedClient?.id || ''
            );
            assistantMessageDbId = messageData.id;
            console.log('Streaming message created:', assistantMessageDbId);
          } catch (error) {
            console.error('Error creating streaming message:', error);
          }
        }

        // Process the stream
        let fullMessage = '';
        if (response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder("utf-8");
          let done = false;

          // Update the message content as we receive chunks
          while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;

            if (value) {
              const chunk = decoder.decode(value, { stream: true });
              // Parse the SSE data
              const lines = chunk.split("\n");

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const data = line.substring(6);

                  if (data === "[DONE]") {
                    // Stream is complete
                    done = true;

                    // Update the final assistant message in the database
                    const effectiveConversationId = currentConversationId || conversationId;
                    if (assistantMessageDbId && effectiveConversationId) {
                      try {
                        // Get the final content of the assistant message from the current state
                        // This ensures we're using the most up-to-date content
                        setMessages(prev => {
                          const assistantMsg = prev.find(msg => msg.id === assistantMessageId);
                          fullMessage = assistantMsg?.content || '';
                          return prev; // No changes to state, just reading the current value
                        });

                        // Try to extract token usage data if available
                        // For streaming responses, we might need to parse the last chunk or make a separate API call
                        // to get token usage information
                        let usageData;
                        if (isJSON(data)) {
                          try {
                            // Some APIs provide usage data in the final [DONE] message or in a separate field
                            // This is a placeholder - you'll need to adapt this based on your API's behavior
                            const parsed = JSON.parse(data);
                            if (parsed && parsed?.usage) {
                              usageData = {
                                prompt_tokens: parsed.usage.prompt_tokens,
                                completion_tokens: parsed.usage.completion_tokens,
                                total_tokens: parsed.usage.total_tokens
                              };
                              console.log('Token usage data from streaming:', usageData);
                            }
                          } catch (usageError) {
                            console.error('Error extracting token usage data:', usageError);
                          }
                        }

                        // Update the message in the database with the final content and token usage if available
                        await updateMessage(
                          assistantMessageDbId,
                          fullMessage,
                          apiToken || '',
                          undefined, // No error message
                          0, // Status: Completed
                          usageData, // Token usage data
                          selectedClient?.id || ''
                        );
                        messageCount++;
                        if (messageCount === 1) {
                          const conversationMessage = `user: ${userMessage.content}\nassistant: ${fullMessage}`

                          // Update topic using the service
                          if (currentConversationId) {
                            updateTopic(currentConversationId, conversationMessage, apiToken || '', selectedClient?.id || '');
                          }
                        }

                        logs('Final streaming message updated:', assistantMessageDbId);
                      } catch (error) {
                        console.error('Error updating final streaming message:', error);
                      }
                    }
                    break;
                  }

                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content || "";

                    if (content) {
                      fullMessage += content;
                      // Update the assistant message with new content
                      setMessages((prev) => {
                        // Immediately update the message with new content for real-time display
                        const updatedMessages = prev.map((msg) =>
                          msg.id === assistantMessageId
                            ? { ...msg, content: msg.content + content }
                            : msg
                        );

                        // Update the assistant message in the database
                        if (assistantMessageDbId) {
                          try {
                            // Use a debounced update to avoid too many requests
                            // In a real app, you might want to implement a proper debounce function
                            // or batch updates to reduce API calls
                            if (Math.random() < 0.1) { // Only update ~10% of the time to reduce API calls
                              // Try to extract token usage data if available in the current chunk
                              try {
                                if (parsed && parsed.usage) {
                                  // Token usage data available but not used during streaming
                                  // Could be used for real-time usage tracking if needed
                                }
                              } catch (usageError) {
                                // Ignore errors in extracting usage data during streaming
                              }

                            }
                          } catch (error) {
                            console.error('Error updating streaming message:', error);

                            // Handle errors during streaming
                            try {
                              // Try to extract any token usage data that might be available
                              let errorUsageData;
                              if (typeof error === 'object' && error !== null && 'usage' in error) {
                                const errorObj = error as any;
                                if (errorObj.usage) {
                                  errorUsageData = {
                                    prompt_tokens: errorObj.usage.prompt_tokens,
                                    completion_tokens: errorObj.usage.completion_tokens,
                                    total_tokens: errorObj.usage.total_tokens
                                  };
                                }
                              }

                              // updateMessage(
                              //   assistantMessageDbId,
                              //   t("ai.errorDuringStreaming"),
                              //   apiToken,
                              //   error.message,
                              //   0, // Status: Error
                              //   errorUsageData // Include token usage if available
                              // );
                              console.log('Error message saved to database');
                              if (errorUsageData) {
                                console.log('Token usage saved with error:', errorUsageData);
                              }
                            } catch (dbError) {
                              console.error('Error saving error message to database:', dbError);
                            }
                          }
                        }

                        return updatedMessages;
                      });
                    }
                  } catch (parseError) {
                    console.error("Error parsing stream data:", parseError);
                  }
                } // if (line.startsWith("data: ")) {
              }
            }
          } // /while (!done) {
        }
      } else {
        // Call the chat API without streaming completions
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiToken}`,
            "X-Client-ID": selectedClient?.id || ''
          },
          body: JSON.stringify({
            model: apiModel,
            messages: [
              {
                role: "system",
                content: systemPrompt,
              },
              ...messagesForAPI,
            ],
          }),
        });

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        const assistantContent = data.choices?.[0]?.message?.content || t("ai.errorCouldNotProcess");

        // Add assistant message
        const assistantMessage: Message = {
          id: generateUniqueId(),
          role: "assistant",
          content: assistantContent,
          createdAt: new Date(),
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Save the assistant message to the database
        const effectiveConversationId = currentConversationId || conversationId;
        if (effectiveConversationId) {
          try {
            // Extract token usage data if available
            const usageData = data.usage ? {
              prompt_tokens: data.usage.prompt_tokens,
              completion_tokens: data.usage.completion_tokens,
              total_tokens: data.usage.total_tokens
            } : undefined;

            const messageData = await saveMessage(
              effectiveConversationId,
              user?.id || '',
              'assistant',
              assistantContent,
              apiToken || '',
              selectedClient?.id || '',
              userMessageId, // parent message ID
              apiModel, // model used
              1, // status_id: 1 = Completed
              usageData, // token usage data
            );
            console.log('Assistant message saved:', messageData.id);
            console.log('Token usage saved:', usageData);
          } catch (error) {
            console.error('Error saving assistant message:', error);
          }
        }
        messageCount++;
        if (messageCount == 1) {
          const conversationMessage = `user: ${userMessage.content}\nassistant: ${assistantContent}`;

          // Update topic using the service
          if (currentConversationId) {
            updateTopic(currentConversationId, conversationMessage, apiToken || '', selectedClient?.id || '');
          }

        }
      }
    } catch (error) {
      console.error("Error sending message:", error);

      // Update the assistant message with error content or add a new error message
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.role === "assistant" && lastMessage.id === assistantMessageId) {
          // Update the last assistant message with error content
          const updatedMessages = [...prev];
          updatedMessages[updatedMessages.length - 1] = {
            ...lastMessage,
            content: t('ai.errorEncountered')
          };
          return updatedMessages;
        } else {
          // Add a new error message
          const errorMessage: Message = {
            id: generateUniqueId(),
            role: "assistant",
            content: t('ai.errorEncountered'),
            createdAt: new Date(),
            timestamp: new Date(),
          };
          return [...prev, errorMessage];
        }
      });

      // Try to extract any token usage data that might be available
      let errorUsageData;
      if (typeof error === 'object' && error !== null && 'usage' in error) {
        const errorObj = error as any;
        if (errorObj.usage) {
          errorUsageData = {
            prompt_tokens: errorObj.usage.prompt_tokens,
            completion_tokens: errorObj.usage.completion_tokens,
            total_tokens: errorObj.usage.total_tokens
          };
          console.log('Token usage extracted from error:', errorUsageData);
        }
      }

      // Save error message to the database if we have a conversation
      const effectiveConversationId = currentConversationId || conversationId;
      if (effectiveConversationId) {
        try {
          const messageData = await saveMessage(
            effectiveConversationId,
            user?.id || '',
            'assistant',
            `Error: ${error instanceof Error ? error.message : String(error)}`,
            apiToken || '',
            selectedClient?.id || '',
            userMessageId,
            apiModel,
            0, // status_id: 2 = Error
            errorUsageData, // Include token usage if available
          );
          console.log('Error message saved:', messageData.id);
          if (errorUsageData) {
            console.log('Token usage saved with error message:', errorUsageData);
          }
        } catch (saveError) {
          console.error('Error saving error message:', saveError);
        }
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false); // Set streaming to false
    }
  };

  // Focus the input when loading is complete
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      // Use a small timeout to ensure the UI has updated
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
    }
  }, [isLoading]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-800">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"
                }`}
            >
              <div
                className={`chat-message max-w-[80%] rounded-lg p-2 ${message.role === "user"
                    ? "user-message bg-brand-500 text-white"
                    : "assistant-message bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  }`}
              >
                <div className="chat-text --whitespace-pre-wrap">
                  {message.id === messages[messages.length - 1]?.id && isStreaming ? (
                    <MarkdownDiv markdown={message.content} />
                  ) : (
                    <MarkdownDiv markdown={message.content.trim()} />
                  )}
                </div>
                <div
                  className={`text-xxs mt-1 ${message.role === "user"
                      ? "text-brand-100"
                      : "text-gray-500 dark:text-gray-400"
                    }`}
                >
                  {message.createdAt.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}
          {(isLoading || isStreaming) && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg p-2">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-75"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-150"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border-t border-gray-200 dark:border-gray-700 p-2">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            id="chat-input-footer"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.shiftKey) && e.key === 'Enter') {
                e.preventDefault();
                setInputValue(prev => prev + '\n');
              } else if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as any);
              }
            }}
            placeholder={t('ai.typeYourMessage')}
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            disabled={isLoading}
            rows={1}
          />
          <Button
            disabled={isLoading || !inputValue.trim()}
            className="h-full"
            onClick={handleSubmit as any}
          >
            Send
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AIChat;
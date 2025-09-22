import React, { useState, useRef, useEffect } from 'react';
import {
  FiSend,
  FiSearch,
  FiPaperclip,
  FiZap
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import PageMeta from "../common/PageMeta";
import MarkdownDiv from "../common/MarkdownDiv";
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useClient } from '../../context/ClientContext';
import { getConfiguration, getConfigurationAsBoolean, getFormattedDateTime, isJSON } from '../../utils';
import { constants } from '../../constants';
import { saveMessage, createStreamingMessage, updateMessage } from '../../services/aiService';
import { ConversationWithMessages } from '../../types/conversation';

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  conversation: ConversationWithMessages;
}

// Simple unique ID generator to prevent ID collisions
let idCounter = 0;
const generateUniqueId = () => {
  return `msg_${Date.now()}_${++idCounter}`;
};

export default function ChatInterface({ conversation }: ChatInterfaceProps) {
  const { t } = useI18n();
  const { selectedClient } = useClient();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { token, user } = useAuth();

  // Convert conversation messages to local message format
  useEffect(() => {
    if (conversation && conversation.messages) {
      const convertedMessages: Message[] = conversation.messages.map(msg => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        timestamp: new Date(msg.created_at)
      }));
      setMessages(convertedMessages);
    }
  }, [conversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  // Focus input when loading is complete
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
    }
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: generateUniqueId(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    // Create a new assistant message ID
    const assistantMessageId = generateUniqueId();

    // Variables to store message IDs
    let userMessageId: string | null = null;
    let assistantMessageDbId: string | null = null;
    const conversationId = conversation.id;

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

      // Save user message to database
      try {
        const messageData = await saveMessage(
          conversationId,
          user?.id || '',
          'user',
          message,
          apiToken || '',
          selectedClient?.id || ''
        );
        userMessageId = messageData.id;
        console.log('User message created:', userMessageId);
      } catch (error) {
        console.error('Error creating user message:', error);
      } if
        (apiStream) {
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
          timestamp: new Date(),
        };

        // Add the assistant message to the UI
        setMessages((prev) => [...prev, assistantMessage]);
        setIsThinking(true); // Set thinking to true

        // Create an empty assistant message in the database for streaming
        try {
          const messageData = await createStreamingMessage(
            conversationId,
            user?.id || '',
            userMessageId,
            apiModel,
            apiToken || '',
            selectedClient?.id
          );
          assistantMessageDbId = messageData.id;
          console.log('Streaming message created:', assistantMessageDbId);
        } catch (error) {
          console.error('Error creating streaming message:', error);
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
                    if (assistantMessageDbId) {
                      try {
                        // Get the final content of the assistant message from the current state
                        setMessages(prev => {
                          const assistantMsg = prev.find(msg => msg.id === assistantMessageId);
                          fullMessage = assistantMsg?.content || '';
                          return prev; // No changes to state, just reading the current value
                        });

                        // Try to extract token usage data if available
                        let usageData;
                        if (isJSON(data)) {
                          try {
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

                        console.log('Final streaming message updated:', assistantMessageDbId);
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

                        return updatedMessages;
                      });
                    }
                  } catch (parseError) {
                    console.error("Error parsing stream data:", parseError);
                  }
                } // if (line.startsWith("data: "))
                else
                {


                  // n8n streaming
                  try {
                    const parsed = JSON.parse(line);
                    if (parsed.type === 'item') {
                      const content = parsed.content;

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
                            }
                          }

                          return updatedMessages;
                        });
                      }


                    }
                    if (parsed.type === 'end') {

                      // Stream is complete
                      done = true;

                      // Update the final assistant message in the database
                      if (assistantMessageDbId) {
                        try {
                          // Get the final content of the assistant message from the current state
                          setMessages(prev => {
                            const assistantMsg = prev.find(msg => msg.id === assistantMessageId);
                            fullMessage = assistantMsg?.content || '';
                            return prev; // No changes to state, just reading the current value
                          });

                          // Try to extract token usage data if available
                          let usageData;
                          if (isJSON(line)) {
                            try {
                              const parsed = JSON.parse(line);
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

                          console.log('Final streaming message updated:', assistantMessageDbId);
                        } catch (error) {
                          console.error('Error updating final streaming message:', error);
                        }
                      }
                      break;

                    }


                  } catch (error) {
                    // console.error('Error parsing stream data:', error);
                  }


                }
              }
            }
          }
        }
      } else {
        // Call the chat API without streaming (original implementation)
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
            ]
          }),
        });

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        // Add assistant message
        const assistantMessage: Message = {
          id: generateUniqueId(),
          role: "assistant",
          content: data.choices?.[0]?.message?.content || "Sorry, I couldn't process that request.",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Save the assistant message to the database
        try {
          // Extract token usage data if available
          const usageData = data.usage ? {
            prompt_tokens: data.usage.prompt_tokens,
            completion_tokens: data.usage.completion_tokens,
            total_tokens: data.usage.total_tokens
          } : undefined;

          const messageData = await saveMessage(
            conversationId,
            user?.id || '',
            'assistant',
            assistantMessage.content,
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
            content: t('ai.errorEncountered'),
          };
          return updatedMessages;
        } else {
          // Add a new error message
          const errorMessage: Message = {
            id: generateUniqueId(),
            role: "assistant",
            content: t('ai.errorEncountered'),
            timestamp: new Date(),
          };
          return [...prev, errorMessage];
        }
      });
      // Save error message to the database
      try {
        const messageData = await saveMessage(
          conversationId,
          user?.id || '',
          'assistant',
          `Error: ${error instanceof Error ? error.message : String(error)}`,
          apiToken || '',
          selectedClient?.id || '',
          userMessageId,
          apiModel,
          0, // status_id: 0 = Error
        );
        console.log('Error message saved:', messageData.id);
      } catch (saveError) {
        console.error('Error saving error message:', saveError);
      }
    } finally {
      setIsLoading(false);
      setIsThinking(false); // Set thinking to false
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.shiftKey) && e.key === 'Enter') {
      e.preventDefault();
      setMessage(prev => prev + '\n');
    } else if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div id="main-ai-content" className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <PageMeta
        title={`${conversation.title} - ${import.meta.env.VITE_APP_NAME}`}
        description="Chat conversation"
      />

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
              <HiSparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {conversation.title}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {messages.length} messages
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Messages Container */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-3">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`chat-message max-w-[85%] rounded-2xl pt-1 pb-1 pl-3 pr-3 ${msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none shadow-sm border border-gray-200 dark:border-gray-700"
                  }`}
              >
                <div className="--whitespace-pre-wrap break-words">
                  <MarkdownDiv markdown={msg.content.trim()} />
                </div>
                <div
                  className={`text-xxs mt-1 ${msg.role === "user"
                    ? "text-brand-100 text-right"
                    : "text-gray-500 dark:text-gray-400 text-left"
                    }`}
                >
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}

          {(isLoading || isThinking) && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-2xl rounded-bl-none p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>      {
/* Input Section */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit}>
            <div className="relative bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-3">
              {/* Textarea */}
              <textarea
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message to Dashboard Assistant..."
                rows={2}
                className="text-sm w-full resize-none border-0 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-0 focus:outline-none text-base leading-relaxed"
                disabled={isThinking || isLoading}
              />

              {/* Action Buttons Row */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                {/* Left Side Buttons */}
                <div className="flex items-center gap-2">
                  {/* DashThinking Button */}
                  <button
                    type="button"
                    onClick={() => setIsThinking(!isThinking)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                    disabled={isThinking || isLoading}
                  >
                    <div className={`transition-transform ${isThinking ? 'animate-spin' : ''}`}>
                      <FiZap className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">
                      {isThinking ? 'Thinking...' : 'DashThinking'}
                    </span>
                  </button>

                  {/* Search Button */}
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                  >
                    <FiSearch className="w-4 h-4" />
                    <span className="text-sm font-medium">Search</span>
                  </button>
                </div>
                {/* Right Side Actions */}
                <div className="flex items-center gap-2">
                  {/* File Upload */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={handleFileUpload}
                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                      title="Upload files"
                    >
                      <FiPaperclip className="w-4 h-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      accept=".txt,.docx,.pdf"
                      onChange={(e) => {
                        // Handle file upload
                        console.log('Files selected:', e.target.files);
                      }}
                    />
                  </div>

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={!message.trim() || isThinking || isLoading}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                    title="Send message"
                  >
                    <FiSend className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
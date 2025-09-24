import React, { useState, useRef, useEffect } from 'react';
import {
  FiSend,
  FiSearch,
  FiPaperclip,
  // FiUpload,
  // FiMessageCircle,
  FiZap
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import PageMeta from "../../components/common/PageMeta";
import MarkdownDiv from "../../components/common/MarkdownDiv";
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useClient } from '../../context/ClientContext';
import { getConfiguration, getConfigurationAsBoolean, getFormattedDateTime, isJSON } from '../../utils';
import { constants } from '../../constants';
import { createConversation, saveMessage, createStreamingMessage, updateMessage } from '../../services/aiService';
import { updateTopic } from '../../services/conversationService';
import { logs } from '../../utils';

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Simple unique ID generator to prevent ID collisions
let idCounter = 0;
let messageCount = 0;
const generateUniqueId = () => {
  return `msg_${Date.now()}_${++idCounter}`;
};

export default function HomeAI() {
  const { t } = useI18n();
  const { selectedClient } = useClient();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const firstMessageRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasScrolledToFirstMessage = useRef(false);
  const { token, user } = useAuth();

  // Scroll to bottom of messages or to first message if it's the initial message
  const scrollToProperPosition = () => {
    if (messages.length <= 2) return;
    // If this is the first message and we haven't scrolled to it yet
    if (messages.length === 1 && !hasScrolledToFirstMessage.current && firstMessageRef.current) {
      // Scroll to show the first message with some offset for the header
      firstMessageRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      // Add some offset to account for the header height (approximately 60px)
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop -= 270; // Adjust this value based on header height
      }
      hasScrolledToFirstMessage.current = true;
    } else if (messages.length > 1) {
      // For subsequent messages, scroll to bottom
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Scroll to proper position when messages change
  useEffect(() => {
    scrollToProperPosition();
  }, [messages]);

  // Focus input when loading is complete
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
    }
  }, [isLoading]);

  // Debug: Monitor conversation ID changes
  useEffect(() => {
    logs('Conversation ID changed:', conversationId)
  }, [conversationId]);

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
    setChatStarted(true);
    setIsLoading(true);

    // Create a new assistant message ID
    const assistantMessageId = generateUniqueId();

    // Variables to store message IDs and conversation ID from the database
    let userMessageId: string | null = null;
    let assistantMessageDbId: string | null = null;
    // Use the state variable for conversation ID
    let currentConversationId: string | null = conversationId;

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
      if (!currentConversationId) {
        try {
          const { conversation, message: createdMessage } = await createConversation(
            user?.id || '',
            message.substring(0, 50) + (message.length > 50 ? '...' : ''),
            message,
            apiToken || '',
            selectedClient?.id
          );

          // Trigger reload of topic chat list
          window.dispatchEvent(new CustomEvent('reloadChatTopics'));

          // Set both local variable and state for persistence
          currentConversationId = conversation.id;
          setConversationId(conversation.id);
          logs('Conversation created with ID:', conversation.id);
          userMessageId = createdMessage.id;
          logs('User message created with ID:', userMessageId);
        } catch (error) {
          // console.error('Error creating conversation:', error);
        }
      } else {
        // If we already have a conversation, just create a new user message
        try {
          const messageData = await saveMessage(
            currentConversationId,
            user?.id || '',
            'user',
            message,
            apiToken || '',
            selectedClient?.id || ''
          );
          userMessageId = messageData.id;
          logs('User message created:', userMessageId);
        } catch (error) {
          // console.error('Error creating user message:', error);
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
          timestamp: new Date(),
        };

        // Add the assistant message to the UI
        setMessages((prev) => [...prev, assistantMessage]);
        setIsThinking(true); // Set thinking to true

        // Create an empty assistant message in the database for streaming
        if (currentConversationId) {
          try {
            const messageData = await createStreamingMessage(
              currentConversationId,
              user?.id || '',
              userMessageId,
              apiModel,
              apiToken || '',
              selectedClient?.id
            );
            assistantMessageDbId = messageData.id;
            logs('Streaming message created:', assistantMessageDbId);
          } catch (error) {
            // console.error('Error creating streaming message:', error);
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
                    if (assistantMessageDbId && currentConversationId) {
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
                              logs('Token usage data from streaming:', usageData);
                            }
                          } catch (usageError) {
                            // console.error('Error extracting token usage data:', usageError);
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
                          const conversationMessage = `user: ${message}\nassistant: ${fullMessage}`

                          // Update topic using the service
                          if (currentConversationId) {
                            updateTopic(currentConversationId, conversationMessage, apiToken || '', selectedClient?.id || '', apiStream);
                          }
                        }

                        logs('Final streaming message updated:', assistantMessageDbId);
                      } catch (error) {
                        // console.error('Error updating final streaming message:', error);
                      }
                    }
                    break;
                  } // if (data === "[DONE]") {

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
                            // console.error('Error updating streaming message:', error);
                          }
                        }

                        return updatedMessages;
                      });
                    }

                  } catch (parseError) {
                    //---LOG console.error("LOG: Error parsing stream data:", parseError);
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
                              // console.error('Error updating streaming message:', error);
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
                      if (assistantMessageDbId && currentConversationId) {
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
                                logs('Token usage data from streaming:', usageData);
                              }
                            } catch (usageError) {
                              // console.error('Error extracting token usage data:', usageError);
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
                            const conversationMessage = `user: ${message}\nassistant: ${fullMessage}`

                            // Update topic using the service
                            if (currentConversationId) {
                              updateTopic(currentConversationId, conversationMessage, apiToken || '', selectedClient?.id || '', apiStream);
                            }
                          }

                          logs('Final streaming message updated:', assistantMessageDbId);
                        } catch (error) {
                          // console.error('Error updating final streaming message:', error);
                        }
                      }
                      break;

                    }

                  } catch (error) {
                    // console.error('Error parsing stream data:', error);
                  }
                  // /n8n streaming

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
        if (currentConversationId) {
          try {
            // Extract token usage data if available
            const usageData = data.usage ? {
              prompt_tokens: data.usage.prompt_tokens,
              completion_tokens: data.usage.completion_tokens,
              total_tokens: data.usage.total_tokens
            } : undefined;

            const messageData = await saveMessage(
              currentConversationId,
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
            logs('Assistant message saved:', messageData.id);
            logs('Token usage saved:', usageData);
          } catch (error) {
            // console.error('Error saving assistant message:', error);
          }
        }

        messageCount++;
        if (messageCount == 1){
          const conversationMessage = `user: ${messagesForAPI[0].content}\nassistant: ${assistantMessage.content}`
          // Update topic using the service
          if (currentConversationId) {
            updateTopic(currentConversationId, conversationMessage, apiToken || '', selectedClient?.id || '', apiStream);
          }
        }

      }
    } catch (error) {
      // console.error("Error sending message:", error);

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
          logs('Token usage extracted from error:', errorUsageData);
        }
      }

      // Save error message to the database if we have a conversation
      if (currentConversationId) {
        try {
          const messageData = await saveMessage(
            currentConversationId,
            user?.id || '',
            'assistant',
            `Error: ${error instanceof Error ? error.message : String(error)}`,
            apiToken || '',
            selectedClient?.id || '',
            userMessageId,
            apiModel,
            0, // status_id: 0 = Error
            errorUsageData, // Include token usage if available
          );
          logs('Error message saved:', messageData.id);
          if (errorUsageData) {
            logs('Token usage saved with error message:', errorUsageData);
          }
        } catch (saveError) {
          // console.error('Error saving error message:', saveError);
        }
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

  const handleQuickAction = (action: string) => {
    setMessage(action);
    // Focus the input and submit after a short delay
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        handleSubmit({ preventDefault: () => { } } as React.FormEvent);
      }
    }, 10);
  };

  // Reset conversation when starting a new chat
  // const startNewChat = () => {
  //   setConversationId(null);
  //   setMessages([]);
  //   setChatStarted(false);
  //   hasScrolledToFirstMessage.current = false;
  // };

  return (
    <div id='home-ai' className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <PageMeta
        title={import.meta.env.VITE_APP_NAME + " Dashboard"}
        description={import.meta.env.VITE_APP_DESCRIPTION}
      />

      {/* Main Content */}
      <div id="main-ai-content" className="flex-1 flex flex-col">
        {!chatStarted ? (
          // Welcome Screen
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
            {/* Welcome Section */}
            <div className="text-center mb-12 max-w-2xl">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg">
                  <HiSparkles />
                </div>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Hi, I'm Dashboard Assistant.
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                How can I help you today?
              </p>
            </div>

            {/* Chat Input Section */}
            <div className="w-full max-w-4xl">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <form onSubmit={handleSubmit}>
                  <div className="relative">
                    {/* Textarea */}
                    <textarea
                      ref={inputRef}
                      id="chat-input"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Message to Dashboard"
                      rows={2}
                      className="w-full resize-none border-0 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-0 focus:outline-none text-lg leading-relaxed"
                      disabled={isThinking}
                    />

                    {/* Action Buttons Row */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      {/* Left Side Buttons */}
                      <div className="flex items-center gap-3">
                        {/* DashThinking Button */}
                        <button
                          type="button"
                          onClick={() => setIsThinking(!isThinking)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                          disabled={isThinking}
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
                          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                        >
                          <FiSearch className="w-4 h-4" />
                          <span className="text-sm font-medium">Search</span>
                        </button>
                      </div>

                      {/* Right Side Actions */}
                      <div className="flex items-center gap-3">
                        {/* File Upload */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={handleFileUpload}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Upload files"
                          >
                            <FiPaperclip className="w-5 h-5" />
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            accept=".txt,.docx,.pdf"
                            onChange={(e) => {
                              // Handle file upload
                              logs('Files selected:', e.target.files);
                            }}
                          />
                        </div>

                        {/* Send Button */}
                        <button
                          type="submit"
                          disabled={!message.trim() || isThinking}
                          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                          title="Send message"
                        >
                          <FiSend className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                  onClick={() => handleQuickAction("Analyze the dashboard data and provide insights")}
                >
                  📊 Analyze Dashboard Data
                </button>
                <button
                  className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                  onClick={() => handleQuickAction("Generate a report on user activity")}
                >
                  📈 Generate Report
                </button>
                <button
                  className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                  onClick={() => handleQuickAction("Search for insights in the dashboard data")}
                >
                  🔍 Search Insights
                </button>
                <button
                  className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                  onClick={() => handleQuickAction("Provide suggestions for improving dashboard performance")}
                >
                  💡 Get Suggestions
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Chat Interface
          <div className="flex-1 flex flex-col">
            {/* Messages Container */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-900">
              <div className="max-w-4xl mx-auto space-y-6">
                {messages.map((msg, index) => (
                  <div
                    key={msg.id}
                    ref={index === 0 ? firstMessageRef : null}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`chat-message max-w-[85%] rounded-2xl pt-1 pb-1 pl-3 pr-3 ${msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none shadow-sm"
                        }`}
                    >
                      <div className="--whitespace-pre-wrap break-words">
                        <MarkdownDiv markdown={msg.content.trim()} />
                      </div>
                      <div
                        className={`text-xxs mt-2 ${msg.role === "user"
                          ? "text-blue-100 text-right"
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
                    <div className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-2xl rounded-bl-none p-4 shadow-sm">
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

            {/* Input Area */}
            <div id="chat-input-container" className="sticky bottom-6 w-full border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3">
              <div className="max-w-4xl mx-auto">
                <form onSubmit={handleSubmit} className="relative">
                  <div className="flex items-end gap-2">
                    <div className="flex-1 relative text-sm">
                      <textarea
                        ref={inputRef}
                        id="chat-input-footer"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Message to Dashboard Assistant..."
                        rows={1}
                        className="w-full resize-none border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                        disabled={isLoading}
                      />
                      <div className="absolute right-2 bottom-2 flex items-center">
                        <button
                          type="button"
                          onClick={handleFileUpload}
                          className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                          title="Upload files"
                        >
                          <FiPaperclip className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading || !message.trim()}
                      className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                      title="Send message"
                    >
                      <FiSend className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsThinking(!isThinking)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-xs"
                        disabled={isThinking}
                      >
                        <div className={`transition-transform ${isThinking ? 'animate-spin' : ''}`}>
                          <FiZap className="w-3 h-3" />
                        </div>
                        <span>{isThinking ? 'Thinking...' : 'DashThinking'}</span>
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 px-3 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-xs"
                      >
                        <FiSearch className="w-3 h-3" />
                        <span>Search</span>
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 hidden">
                      AI-generated, for reference only
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

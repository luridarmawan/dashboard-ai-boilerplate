import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { useClient } from "../../context/ClientContext";
import { fetchConversation } from "../../services/conversationService";
import { ConversationWithMessages } from "../../types/conversation";
import HomeAI from "../Dashboard/HomeAI";
import ChatInterface from "../../components/Chat/ChatInterface";

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const { selectedClient } = useClient();
  
  const [conversation, setConversation] = useState<ConversationWithMessages | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedClient && selectedClient.id && isAuthenticated && token) {
      if (!conversationId) {
        // If no conversation ID, show new chat interface (HomeAI)
        return;
      }

      if (!token || !isAuthenticated) {
        navigate('/signin');
        return;
      }

      loadConversation();
    }
  }, [conversationId, token, isAuthenticated, selectedClient?.id]);

  const loadConversation = async () => {
    if (!conversationId || !token) return;

    try {
      setLoading(true);
      setError(null);

      const conversationData = await fetchConversation(
        conversationId,
        token,
        selectedClient?.id
      );

      setConversation(conversationData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversation');
      console.error('Error loading conversation:', err);
      
      // If conversation not found, redirect to new chat
      if (err instanceof Error && err.message.includes('not found')) {
        navigate('/chat');
      }
    } finally {
      setLoading(false);
    }
  };

  // If no conversation ID, show new chat interface
  if (!conversationId) {
    return <HomeAI />;
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading conversation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/chat')}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
          >
            Start New Chat
          </button>
        </div>
      </div>
    );
  }

  // Show chat interface with conversation history
  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">No conversation found</p>
        </div>
      </div>
    );
  }

  return <ChatInterface conversation={conversation} />;
}
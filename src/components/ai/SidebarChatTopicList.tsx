
import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useLocation } from "react-router";
import { useI18n } from "../../context/I18nContext";
import { useAuth } from "../../context/AuthContext";
import { useClient } from "../../context/ClientContext";
import { useSidebar } from "../../context/SidebarContext";
import { Conversation } from "../../types/conversation";
import { fetchConversations } from "../../services/conversationService";
import { ChatIcon, PlusIcon } from "../../icons";

export default function SidebarChatTopicList() {
  const { t } = useI18n();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);
  const lastClientIdRef = useRef<string | undefined>(undefined);

  const { token, isAuthenticated } = useAuth();
  const { selectedClient, loading: clientLoading } = useClient();
  const { isExpanded, isHovered, isMobileOpen, toggleMobileSidebar } = useSidebar();
  const location = useLocation();

  const isActive = useCallback((conversationId: string) => {
    return location.pathname === `/chat/${conversationId}`;
  }, [location.pathname]);

  const handleChatClick = useCallback(() => {
    // Close mobile sidebar when chat item is clicked
    if (isMobileOpen) {
      toggleMobileSidebar();
    }
  }, [isMobileOpen, toggleMobileSidebar]);

  const loadConversations = useCallback(async () => {
    if (!token || !isAuthenticated) {
      return;
    }

    if (!selectedClient?.id) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await fetchConversations(
        token,
        selectedClient?.id,
        1,
        50
      );

      setConversations(result.data.conversations || []);
      hasLoadedRef.current = true;
      lastClientIdRef.current = selectedClient?.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [token, isAuthenticated, selectedClient?.id]);

  // Reset state when not authenticated
  useEffect(() => {
    if (!token || !isAuthenticated) {
      setLoading(false);
      setConversations([]);
      hasLoadedRef.current = false;
      lastClientIdRef.current = undefined;
    }
  }, [token, isAuthenticated]);

  // Fetch conversations when client is ready
  useEffect(() => {
    // Don't do anything if:
    // - Client is still loading
    // - Not authenticated
    // - Already loading
    const currentClientId = selectedClient?.id;
    if (clientLoading || !token || !isAuthenticated || loading || !currentClientId) {
      return;
    }

    // Only load if:
    // 1. Not loaded yet, OR
    // 2. Client ID has changed
    const shouldLoad = !hasLoadedRef.current ||
      lastClientIdRef.current !== currentClientId;

    if (shouldLoad) {
      const doLoad = async () => {
        try {
          setLoading(true);
          setError(null);

          const result = await fetchConversations(
            token,
            currentClientId,
            1,
            50
          );

          setConversations(result.data.conversations || []);
          hasLoadedRef.current = true;
          lastClientIdRef.current = currentClientId;
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An error occurred');
          console.error('Error fetching conversations:', err);
        } finally {
          setLoading(false);
        }
      };

      doLoad();
    }
  }, [token, isAuthenticated, selectedClient?.id, clientLoading, loading]);

  // Listen for reload chat topics event
  useEffect(() => {
    const handleReloadChatTopics = () => {
      if (token && isAuthenticated && selectedClient?.id && !loading) {
        loadConversations();
      }
    };

    window.addEventListener('reloadChatTopics', handleReloadChatTopics);

    return () => {
      window.removeEventListener('reloadChatTopics', handleReloadChatTopics);
    };
  }, [loadConversations, token, isAuthenticated, selectedClient?.id, loading]);

  // Truncate title for display
  const truncateTitle = useCallback((title: string, maxLength: number = 22) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  }, []);

  // Format date for display
  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 1) {
        return 'now';
      } else if (diffInHours < 24) {
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      } else if (diffInHours < 24 * 7) {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });
      }
    } catch (error) {
      return '';
    }
  }, []);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div id="sidebar-chat-list" className="flex flex-col">
      {(loading || clientLoading) && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-500"></div>
          {(isExpanded || isHovered || isMobileOpen) && (
            <span className="ml-2 text-xs text-gray-500">Loading...</span>
          )}
        </div>
      )}

      {error && (isExpanded || isHovered || isMobileOpen) && (
        <div className="text-xs text-red-500 px-2 py-1 mb-2 bg-red-50 dark:bg-red-900/20 rounded">
          {error}
          <button
            onClick={loadConversations}
            className="ml-2 text-red-600 hover:text-red-700 underline"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !clientLoading && !error && conversations.length === 0 && (isExpanded || isHovered || isMobileOpen) && (
        <div className="text-xs text-gray-500 px-2 py-1 mb-2 text-center">
          <div className="mb-2">{t('chat.noConversations')}</div>

          <Link
            to="/chat"
            onClick={handleChatClick}
            className="text-brand-600 hover:text-brand-700 underline"
          >
            {t('chat.startChat')}
          </Link>
        </div>
      )}

      {!loading && !clientLoading && conversations.length > 0 && (
        <div className="chat-list-container max-h-64 overflow-y-auto overflow-x-hidden">
          <ul className="flex flex-col gap-1 pr-1">
            {conversations.slice(0, 20).map((conversation) => (
              <li key={conversation.id} className="conversation-item">
                <Link
                  to={`/chat/${conversation.id}`}
                  onClick={handleChatClick}
                  className={`menu-item group ${isActive(conversation.id)
                    ? "menu-item-active"
                    : "menu-item-inactive"
                    } ${!isExpanded && !isHovered && !isMobileOpen
                      ? "lg:justify-center"
                      : "lg:justify-start py-1"
                    }`}
                  title={conversation.title}
                >
                  {/* Chat icon */}
                  <span className={`menu-item-icon-size ${isActive(conversation.id)
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                    }`}>
                    <ChatIcon />
                  </span>

                  {/* Title and date - only show when expanded */}
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="menu-item-text truncate">
                          {truncateTitle(conversation.title)}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 flex-shrink-0">
                          {formatDate(conversation.last_message_at || conversation.updated_at)}
                        </span>
                      </div>
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>

          {/* Show indicator if there are more conversations */}
          {conversations.length > 10 && (isExpanded || isHovered || isMobileOpen) && (
            <div className="text-xs text-gray-400 dark:text-gray-500 text-center py-2 border-t border-gray-200 dark:border-gray-700 mt-2">
              +{conversations.length - 10} more conversations
            </div>
          )}
        </div>
      )}

      {/* Show "New Chat" button when expanded */}
      {(isExpanded || isHovered || isMobileOpen) && (
        <div className="mt-4 pt-2 border-t border-gray-200 dark:border-gray-700">
          <Link
            to="/chat"
            onClick={handleChatClick}
            className="menu-item menu-item-inactive"
          >
            <span className="menu-item-icon-size menu-item-icon-inactive">
              <PlusIcon />
            </span>
            <span className="menu-item-text">{t('chat.newChat')}</span>
          </Link>
        </div>
      )}
    </div>
  );
}
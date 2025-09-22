import { useState, useEffect } from "react";
import AIChat from "./AIChat";

const FloatingChatButton = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isOnChatPage, setIsOnChatPage] = useState(window.location.pathname.startsWith('/chat'));

  // Handle window resize to update mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Monitor URL changes to hide button on chat pages
  useEffect(() => {
    const checkChatPage = () => {
      setIsOnChatPage(window.location.pathname.startsWith('/chat'));
    };

    // Check on mount
    checkChatPage();

    // Listen for navigation changes (for SPAs)
    window.addEventListener('popstate', checkChatPage);

    // For React Router or other SPA routing, we also need to check periodically
    // since programmatic navigation doesn't trigger popstate
    const interval = setInterval(checkChatPage, 100);

    return () => {
      window.removeEventListener('popstate', checkChatPage);
      clearInterval(interval);
    };
  }, []);

  // Handle custom event to close the chat popup
  useEffect(() => {
    const handleCloseChatPopup = () => {
      setIsChatOpen(false);
    };

    window.addEventListener('close-chat-popup', handleCloseChatPopup);
    return () => {
      window.removeEventListener('close-chat-popup', handleCloseChatPopup);
    };
  }, []);


  // Don't render the component if we're on a chat page
  if (isOnChatPage) {
    return null;
  }

  return (
    <>
      {/* Floating Chat Button */}
      <button
        id="chat-popup-btn"
        onClick={() => {
          setIsChatOpen(true);
          // Focus the chat input after a small delay to ensure the popup has opened
          setTimeout(() => {
            const chatInput = document.getElementById('chat-input-footer');
            if (chatInput) {
              chatInput.focus();
            }
          }, 250);
        }}
        className="fixed bottom-4 right-4 w-10 h-10 rounded-full bg-brand-500 text-white shadow-lg hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 z-9999 flex items-center justify-center transition-all duration-300"
        aria-label="Open AI Chat"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      </button>

      {/* Chat Modal */}
      {isMobile ? (
        // Fullscreen popup for mobile with highest z-index
        <div className={`fixed inset-0 z-[999999] ${isChatOpen ? '' : 'hidden'}`}>
          <div
            className="fixed inset-0 bg-gray-400/50 backdrop-blur-[32px]"
            onClick={() => setIsChatOpen(false)}
          ></div>
          <div
            className="absolute inset-0 w-full h-full bg-white dark:bg-gray-900 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsChatOpen(false)}
              className="absolute right-3 top-3 z-999 flex h-9.5 w-9.5 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white sm:right-6 sm:top-6 sm:h-11 sm:w-11"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.04289 16.5413C5.65237 16.9318 5.65237 17.565 6.04289 17.9555C6.43342 18.346 7.06658 18.346 7.45711 17.9555L11.9987 13.4139L16.5408 17.956C16.9313 18.3466 17.5645 18.3466 17.955 17.956C18.3455 17.5655 18.3455 16.9323 17.955 16.5418L13.4129 11.9997L17.955 7.4576C18.3455 7.06707 18.3455 6.43391 17.955 6.04338C17.5645 5.65286 16.9313 5.65286 16.5408 6.04338L11.9987 10.5855L7.45711 6.0439C7.06658 5.65338 6.43342 5.65338 6.04289 6.0439C5.65237 6.43442 5.65237 7.06759 6.04289 7.45811L10.5845 11.9997L6.04289 16.5413Z"
                  fill="currentColor"
                />
              </svg>
            </button>
            <div className="border-b border-gray-200 dark:border-gray-700 p-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Assistant</h2>
            </div>
            <div className="flex-1 overflow-hidden">
              <AIChat />
            </div>
          </div>
        </div>
      ) : (
        // Positioned popup for desktop
        <div className={`fixed inset-0 z-99999 ${isChatOpen ? '' : 'hidden'}`}>
          <div
            className="fixed inset-0 bg-gray-400/50 backdrop-blur-[1px]"
            onClick={() => setIsChatOpen(false)}
          ></div>
          <div
            className="absolute bottom-6 right-6 w-[400px] h-[500px] rounded-3xl bg-white dark:bg-gray-900 shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* <button 
              onClick={() => setIsChatOpen(true)}
            >
              TODO: maximize
            </button> */}
            <button
              id="close-chat-popup-btn"
              onClick={() => setIsChatOpen(false)}
              className="absolute right-3 top-3 z-999 flex h-9.5 w-9.5 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white sm:right-6 sm:top-3 sm:h-8 sm:w-8"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.04289 16.5413C5.65237 16.9318 5.65237 17.565 6.04289 17.9555C6.43342 18.346 7.06658 18.346 7.45711 17.9555L11.9987 13.4139L16.5408 17.956C16.9313 18.3466 17.5645 18.3466 17.955 17.956C18.3455 17.5655 18.3455 16.9323 17.955 16.5418L13.4129 11.9997L17.955 7.4576C18.3455 7.06707 18.3455 6.43391 17.955 6.04338C17.5645 5.65286 16.9313 5.65286 16.5408 6.04338L11.9987 10.5855L7.45711 6.0439C7.06658 5.65338 6.43342 5.65338 6.04289 6.0439C5.65237 6.43442 5.65237 7.06759 6.04289 7.45811L10.5845 11.9997L6.04289 16.5413Z"
                  fill="currentColor"
                />
              </svg>
            </button>
            <div className="border-b border-gray-200 dark:border-gray-700 p-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Assistant</h2>
            </div>
            <div className="flex-1 overflow-hidden">
              <AIChat />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChatButton;
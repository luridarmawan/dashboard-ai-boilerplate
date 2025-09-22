import { ReactNode } from "react";
import { ArrowPathIcon as RefreshIcon } from '@heroicons/react/24/outline';

interface ErrorStateProps {
  title?: string;
  message?: string | ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: ReactNode;
}

export default function ErrorState({
  title = "Error",
  message = "Something went wrong.",
  onRetry,
  retryLabel = "Try Again",
  icon = (
    <svg
      className="h-8 w-8 text-red-500 dark:text-red-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  ),
}: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="p-6 max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md flex flex-col items-center space-y-4">
        <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">{icon}</div>
        <div className="text-center">
          <h3 className="text-lg font-medium text-red-500 dark:text-red-400">{title}</h3>
          {typeof message === "string" ? (
            <p className="text-gray-600 dark:text-gray-300 mt-2">{message}</p>
          ) : (
            <div className="text-gray-600 dark:text-gray-300 mt-2">{message}</div>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="mx-auto mt-4 px-4 py-2 bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-800 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <RefreshIcon className="h-4 w-4" />
              <span>{retryLabel}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

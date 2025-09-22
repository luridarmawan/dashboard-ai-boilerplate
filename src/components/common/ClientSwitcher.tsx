
import { useState, useRef, useEffect } from 'react';
import { useClient } from '../../context/ClientContext';

export default function ClientSwitcher() {
  const { clients, selectedClient, setSelectedClient, loading, error } = useClient();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClientSelect = (client: any) => {
    setSelectedClient(client);
    setIsOpen(false);
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="w-48 mr-2">
        <div className="text-xs text-gray-500 dark:text-gray-400">Loading clients...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-48 mr-2">
        <div className="text-xs text-red-500">NO ACCESS!</div>
      </div>
    );
  }

  return (
    <div className="w-48 mr-2 relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        <span className="truncate text-gray-900 dark:text-gray-100">
          {selectedClient ? selectedClient.name : 'Select Tenant'}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? '' : 'rotate-180'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-[265px] bottom-full mb-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
          {clients.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
              No clients available
            </div>
          ) : (
            clients.map((client) => (
              <button
                key={client.id}
                onClick={() => handleClientSelect(client)}
                className={`w-full px-3 py-2 text-xs text-left hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700 ${selectedClient?.id === client.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'text-gray-900 dark:text-gray-100'
                  }`}
              >
                <div className="truncate">{client.name}</div>
                {client.description && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {client.description}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

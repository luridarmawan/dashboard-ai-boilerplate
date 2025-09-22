import { useClient } from '../../context/ClientContext';

export default function ClientDemo() {
  const { selectedClient } = useClient();

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Active Client</h3>
      {selectedClient ? (
        <div>
          <p><strong>Name:</strong> {selectedClient.name}</p>
          <p><strong>Description:</strong> {selectedClient.description || 'No description'}</p>
          <p><strong>ID:</strong> {selectedClient.id}</p>
          <p className="text-xs text-gray-500 mt-2">
            Page loaded at: {new Date().toLocaleTimeString()}
          </p>
        </div>
      ) : (
        <p>No client selected</p>
      )}
    </div>
  );
}
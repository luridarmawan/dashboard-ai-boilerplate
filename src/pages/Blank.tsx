import PageMeta from "../components/common/PageMeta";
import { ArrowPathIcon as RefreshIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import Loading from "../components/common/Loading";
import { useState, useEffect } from "react";

import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";
import { useClient } from "../context/ClientContext";
import {
  // xfetch,   // ✨ Enable this for the secret move: data fetching!
  setXFetchContext
} from "../services";

// const API_BASE_URL = import.meta.env.VITE_API_URL || `http://localhost:${import.meta.env.VITE_API_PORT}/api`;

export default function Blank() {
  const { t } = useI18n();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { token, isAuthenticated } = useAuth();
  const { selectedClient } = useClient();


  const fetchData = async () => {
    console.log("📄 Blank.tsx - selectedClient render:", selectedClient);



    // DO YOUR SOMETHING CODE HERE
    await new Promise(res => setTimeout(res, 3500));
    console.log("📄 Blank.tsx - Do Something ...");



    setRefreshing(false);
    setLoading(false)
  }

  useEffect(() => {
    // Only fetch data if selectedClient is available and user is authenticated
    if (selectedClient && selectedClient.id && isAuthenticated && token) {
      setXFetchContext({
        token,
        selectedClient,
      });
      fetchData();
    } else if (!selectedClient || !selectedClient.id) {
      // If no client is selected, stop loading
      // setLoading(false);
    }
  }, [selectedClient, token, isAuthenticated]);

  // Show loading state
  if (loading) {
    return (
      <div>
        <Loading title={"Something | " + import.meta.env.VITE_APP_NAME}
          message={"TEST DELAY: " + t("general.loadingSomething")} />
      </div>
    );
  }

  // Show authentication required state
  if (!isAuthenticated) {
    return (
      <div>
      </div>
    );
  }


  return (
    <div>
      <PageMeta
        title="AI-Powered Admin Dashboard | By CARIK.id"
        description="This is AI-Powered Admin Dashboard by CARIK.id"
      />

      <div id="your-page" className="mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Your Module Name</h2>
            <div className="flex items-center gap-3">
              <button
                // onClick={refreshSomething}
                disabled={refreshing}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-300 dark:bg-blue-900/50 dark:hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-200 disabled:opacity-50"
              >
                <RefreshIcon className={`h-4 w-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                id="btn-add"
                // onClick={addSomething}
                disabled={refreshing}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-300 dark:bg-blue-900/50 dark:hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-200 disabled:opacity-50"
              >
                <UserPlusIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="page-content px-6 py-4">
            <div className="max-w-full overflow-x-auto">

              // YOUR CONTENT HERE
              <hr />
              <div className="mt-4">
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

            </div>
          </div> {/* page-content */}

        </div>
      </div> {/* your-page */}

    </div>
  );
}

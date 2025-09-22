import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Loading from "../../components/common/Loading";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { xfetch, setXFetchContext } from "../../services";
import { Configuration } from "../../types/configuration";
import ConfigurationGeneral from "../../components/configuration/general";
import ConfigurationAI from "../../components/configuration/ai";
import ConfigurationAdvanced from "../../components/configuration/advanced";
import { Tab } from '@headlessui/react';
import { motion } from 'framer-motion';
import { Cog6ToothIcon as CogIcon, ArrowPathIcon as RefreshIcon, TagIcon, CubeIcon } from '@heroicons/react/24/outline';
import { BoltIcon } from '@heroicons/react/24/solid';
import { generateDynamicConfigurationComponent } from "../../utils/configurationGenerator";
import { useClient } from "../../context/ClientContext";
import ErrorState from "../../components/common/ErrorState";

const API_BASE_URL = import.meta.env.VITE_API_URL || `http://localhost:${import.meta.env.VITE_API_PORT}/api`;

export default function ConfigurationPage() {
  const { selectedClient } = useClient();
  const [configurations, setConfigurations] = useState<Configuration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [permissions, setPermissions] = useState({
    canManage: false,
    canCreate: false,
    canEdit: false,
  });
  const { token, isAuthenticated } = useAuth();
  const hasFetched = useRef(false);

  const fetchConfigurations = async () => {
    if (!isAuthenticated || !token) {
      setError("You must be logged in to view configurations");
      setLoading(false);
      return;
    }

    if (!selectedClient) {
      setError("No client selected");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await xfetch(`${API_BASE_URL}/configuration`, {});
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch configurations');
      }

      if (data.success && data.data && data.data.configurations) {
        // Transform the API response to match our Configuration type
        const transformedConfigurations = data.data.configurations.map((config: any) => ({
          id: config.id,
          client_id: config.clientId,
          section: config.section,
          sub: config.sub,
          key: config.key,
          value: config.value,
          title: config.title,
          note: config.note,
          type: config.type || 'string', // default to string if type is not provided
          order: config.order || 0, // default to 0 if order is not provided
          public: config.public || false, // default to false if public is not provided
          pro: config.pro || false, // default to false if pro is not provided
          created_at: new Date(config.createdAt),
          updated_at: new Date(config.updatedAt),
          status_id: config.statusId,
        }));
        setConfigurations(transformedConfigurations);
        setPermissions(data.data.permissions);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error("Error fetching configurations:", error);
      setError(error instanceof Error ? error.message : 'Failed to fetch configurations');
    } finally {
      setLoading(false);
    }
  };

  const refreshConfigurations = () => {
    setRefreshing(true);
    hasFetched.current = false;
    fetchConfigurations().finally(() => {
      setTimeout(() => setRefreshing(false), 500); // Add a small delay for better UX
    });
  };

  useEffect(() => {
    if (!hasFetched.current && selectedClient) {
      hasFetched.current = true;
      setXFetchContext({
        token,
        selectedClient,
      });
      fetchConfigurations();
    }
  }, [selectedClient, isAuthenticated, token]);

  // Prepare configuration categories
  const baseSections = [
    { name: 'General', icon: CogIcon, component: ConfigurationGeneral, configs: configurations.filter(config => config.section === 'general') },
    { name: 'AI', icon: BoltIcon, component: ConfigurationAI, configs: configurations.filter(config => config.section === 'ai') },
  ];

  const advancedSection = { name: 'Advanced', icon: TagIcon, component: ConfigurationAdvanced, configs: configurations.filter(config => config.section === 'Advanced') };

  // Get all unique sections from configurations
  const allSections = [...new Set(configurations.map(config => config.section))];
  const predefinedSectionNames = ['general', 'ai', 'advanced'];

  // Generate dynamic sections for categories not in predefined list
  const dynamicSections = allSections
    .filter(section => !predefinedSectionNames.includes(section.toLowerCase()))
    .map(section => ({
      name: section.charAt(0).toUpperCase() + section.slice(1),
      icon: CubeIcon,
      component: generateDynamicConfigurationComponent(section),
      configs: configurations.filter(config => config.section === section)
    }));

  // Combine sections: base sections + dynamic sections + advanced section at the end
  const configSections = [...baseSections, ...dynamicSections, advancedSection];

  // Show loading state
  if (loading) {
    return (
      <div>
        <Loading title="Configuration" message="Loading configuration..." />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div>
        <PageMeta title="Configuration" description="Error loading configuration" />
        <PageBreadcrumb pageTitle="Configuration" />
        <ErrorState
          title="Error Loading Configuration"
          message={error}
          onRetry={refreshConfigurations}
          retryLabel="Try Again"
        />
      </div>
    );
  }

  // Show authentication required state
  if (!isAuthenticated) {
    return (
      <div>
        <PageMeta title="Configuration" description="Authentication required to view configuration" />
        <PageBreadcrumb pageTitle="Configuration" />
        <div className="flex items-center justify-center p-8">
          <div className="p-6 max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md flex flex-col items-center space-y-4">
            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
              <svg className="h-8 w-8 text-yellow-500 dark:text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-yellow-500 dark:text-yellow-400">Authentication Required</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-2">Please log in to view the configuration.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check permission
  if (!permissions.canManage) {
    return (
      <div>
        <PageMeta title="Configuration" description="Insufficient permissions to view configuration" />
        <PageBreadcrumb pageTitle="Configuration" />
        <div className="flex items-center justify-center p-8">
          <div className="p-6 max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md flex flex-col items-center space-y-4">
            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
              <svg className="h-8 w-8 text-yellow-500 dark:text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-yellow-500 dark:text-yellow-400">Access Denied</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-2">You don't have permission to view the configuration.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={"Configuration | " + import.meta.env.VITE_APP_NAME + " Dashboard"}
        description={import.meta.env.VITE_APP_DESCRIPTION}
      />
      {/* <PageBreadcrumb pageTitle="Configuration" /> */}

      <div id="configuration-page" className="mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
          {/* Header with refresh button */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">System Configuration</h2>
            <button
              onClick={refreshConfigurations}
              disabled={refreshing}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-300 dark:bg-blue-900/50 dark:hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-200 disabled:opacity-50"
            >
              <RefreshIcon className={`h-4 w-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* Tab navigation */}
          <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>

            <div className="border-b border-gray-200 dark:border-gray-700">
              <Tab.List className="tab-list flex overflow-x-auto scrollbar-hide px-6 -mb-px scroll-smooth">
                {configSections.map((section) => (
                  <Tab
                    key={section.name}
                    className={({ selected }) =>
                      `py-4 px-6 text-sm font-medium border-b-2 focus:outline-none whitespace-nowrap flex items-center space-x-2 flex-shrink-0 min-w-fit ${selected
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}`
                    }
                  >
                    <section.icon className="h-5 w-5" />
                    <span>{section.name}</span>
                  </Tab>
                ))}
              </Tab.List>
            </div>

            <Tab.Panels className="p-5">
              {configSections.map((section) => (
                <Tab.Panel key={section.name}>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <form id={`configuration-${section.name.toLowerCase()}-form`}>
                      <section.component
                        configurations={section.configs}
                        onConfigSaved={refreshConfigurations}
                      />
                    </form>
                  </motion.div>
                </Tab.Panel>
              ))}
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </>
  );
}

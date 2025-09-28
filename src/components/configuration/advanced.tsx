import { useState, useEffect } from "react";
import ComponentCard from "../common/ComponentCard";
import toast from "react-hot-toast";
import { Configuration } from "../../types/configuration";
import { useConfiguration } from "../../hooks/useConfiguration";
import { useAuth } from "../../context/AuthContext";
import { FieldRenderer } from "../../services/FieldRenderer";
import { useI18n } from "../../context/I18nContext";

interface ConfigurationAdvancedProps {
  configurations: Configuration[];
  onConfigSaved?: () => void;
}

export default function ConfigurationAdvanced({ configurations, onConfigSaved }: ConfigurationAdvancedProps) {
  const { t } = useI18n();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const { saveConfiguration, loading } = useConfiguration();
  const { token } = useAuth();

  useEffect(() => {
    // Initialize form data from configurations
    const initialData: Record<string, string> = {};
    configurations.forEach(config => {
      initialData[config.key] = config.value;
    });
    setFormData(initialData);
  }, [configurations]);

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    if (!token) {
      toast.error("You must be logged in to save configurations");
      return;
    }

    try {
      // Save all configurations
      const savePromises = configurations.map(config => {
        return saveConfiguration(
          config.id || null,
          {
            section: "Advanced",
            key: config.key,
            value: formData[config.key] || "",
            title: config.title || "",
            type: config.type || "string"
          }
        );
      });

      const results = await Promise.all(savePromises);
      
      // Check if any save operation failed
      const failedResults = results.filter(result => !result.success);
      if (failedResults.length > 0) {
        throw new Error(failedResults[0].error || "Failed to save one or more configurations");
      }

      toast.success(t("configuration.saveSuccess"));
      if (onConfigSaved) {
        onConfigSaved();
      }
    } catch (error) {
      console.error("Error saving configuration:", error);
      toast.error(error instanceof Error ? error.message : t("configuration.saveError"));
    }
  };

  const sectionDisplayName = "Advanced";

  // Group configurations by sub section
  const groupedConfigurations = configurations.reduce((groups, config) => {
    const subSection = config.sub || config.section;
    if (!groups[subSection]) {
      groups[subSection] = [];
    }
    groups[subSection].push(config);
    return groups;
  }, {} as Record<string, Configuration[]>);

  return (
    <div title="Advanced" className="px-4">
      <div id="configuration-advanced" className="">
        {configurations.length > 0 ? (
          <>
            {Object.entries(groupedConfigurations).map(([subSection, subConfigs]) => (
              <div key={subSection} className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
                  {subSection}
                </h3>
                <div className="pl-4">
                  {FieldRenderer.renderFields(subConfigs, formData, handleInputChange)}
                </div>
              </div>
            ))}
            <div className="mt-4">
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? "Saving..." : `Save ${sectionDisplayName} Configuration`}
              </button>
            </div>
          </>
          ) : (
            <div className="text-gray-500 dark:text-gray-400 text-center py-8">
              No configurations found for "Advanced" section.
            </div>
          )}
      </div>
    </div>
  )
}

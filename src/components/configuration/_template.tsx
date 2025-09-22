import { useState, useEffect } from "react";
import ComponentCard from "../common/ComponentCard";
import toast from "react-hot-toast";
import { Configuration } from "../../types/configuration";
import { useConfiguration } from "../../hooks/useConfiguration";
import { useAuth } from "../../context/AuthContext";
import { FieldRenderer } from "../../services/FieldRenderer";
import { useI18n } from "../../context/I18nContext";

interface ConfigurationTemplateProps {
  configurations: Configuration[];
  onConfigSaved?: () => void;
  sectionName?: string;
}

export default function ConfigurationTemplate({ configurations, onConfigSaved, sectionName = "Template" }: ConfigurationTemplateProps) {
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
    console.log("configurations", configurations);
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
            section: sectionName,
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

      toast.success(`${sectionName} configuration saved successfully`);
      if (onConfigSaved) {
        onConfigSaved();
      }
    } catch (error) {
      console.error("Error saving configuration:", error);
      toast.error(error instanceof Error ? error.message : t("configuration.saveError"));
    }
  };

  return (
    <ComponentCard title={sectionName}>
      <div id={`configuration-${sectionName.toLowerCase()}`} className="">
        {configurations.length > 0 ? (
          <>
            {FieldRenderer.renderFields(configurations, formData, handleInputChange)}
            <div className="mt-4">
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? t("configuration.saving") : `Save ${sectionName} Configuration`}
              </button>
            </div>
          </>
        ) : (
          <div className="text-gray-500 dark:text-gray-400 text-center py-8">
            No configurations found for {sectionName} section.
          </div>
        )}
      </div>
    </ComponentCard>
  )
}

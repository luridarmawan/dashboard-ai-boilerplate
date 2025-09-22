/**
 * FieldRenderer Service
 * 
 * Komponen ini menyediakan dua pendekatan untuk merender field form:
 * 1. Static class methods
 * 2. React hook-based approach
 *
 * CARA PENGGUNAAN:
 *
 * 1. STATIC CLASS METHODS (Pendekatan langsung):
 * ```tsx
 * import { FieldRenderer } from '../services/FieldRenderer';
 *
 * // Render single field
 * const singleField = FieldRenderer.renderField({
 *   config: configurationObject,
 *   value: formData[config.key] || "",
 *   onChange: handleInputChange,
 *   className: "custom-class" // optional
 * });
 *
 * // Render multiple fields
 * const multipleFields = FieldRenderer.renderFields(
 *   configurations,
 *   formData,
 *   handleInputChange,
 *   "custom-class" // optional
 * );
 * ```
 *
 * 2. HOOK-BASED useFieldRenderer (Pendekatan React Hook):
 * ```tsx
 * import { useFieldRenderer } from '../services/FieldRenderer';
 * 
 * function MyComponent({ configurations }) {
 *   const [formData, setFormData] = useState({});
 *   const { renderField, renderFields } = useFieldRenderer();
 * 
 *   const handleInputChange = (key: string, value: string) => {
 *     setFormData(prev => ({ ...prev, [key]: value }));
 *   };
 * 
 *   return (
 *     <div>
 *       //Render semua fields sekaligus
 *       { renderFields(configurations, formData, handleInputChange) }
 *
 *       //Atau render field satu per satu
 *       {
 *         configurations.map(config => 
 *           renderField({
 *             config,
 *             value: formData[config.key] || "",
 *             onChange: handleInputChange,
 *             className: "my-custom-class"
 *           })
 *         )
 *       }
 *     </div>
 *   )
 *
 *
 * TIPE FIELD YANG DIDUKUNG:
 * - "text": TextareaAutosize untuk teks panjang
 * - "boolean": Switch component untuk true/false
 * - "secret": Input password untuk data sensitif
 * - "string" (default): Input text biasa
 * 
 * PARAMETER:
 * - config: Object Configuration dengan properti type, key, title
 * - value: Nilai current dari field
 * - onChange: Callback function (key: string, value: string) => void
 * - className: CSS class tambahan (optional)
 */
import React from "react";
import Label from "../components/form/Label";
import Input from "../components/form/input/InputField";
import TextareaAutosize from "react-textarea-autosize";
import ControlledSwitch from "../components/form/switch/ControlledSwitch";
import MarkdownDiv from "../components/common/MarkdownDiv";
import { Configuration } from "../types/configuration";

export interface FieldRendererProps {
  config: Configuration;
  value: string;
  onChange: (key: string, value: string) => void;
  className?: string;
}

export class FieldRenderer {
  /**
   * Renders a configuration field based on its type
   */
  static renderField({ config, value, onChange, className }: FieldRendererProps): React.ReactElement {
    const baseClassName = className || "";
    const proClass = config.pro === true ? (<sup className="inline-flex items-center mx-1 px-2 py-0.5 rounded-full text-xxs font-semibold bg-red-100 text-red-800 border border-red-200">Pro</sup>) : "";

    if (config.type === "text") {
      return (
        <div key={config.key} className="mt-3">
          <Label htmlFor={config.key}>{config.title || config.key}{proClass}</Label>
          <TextareaAutosize
            id={config.key}
            name={config.key}
            value={value || ""}
            onChange={(e) => onChange(config.key, e.target.value)}
            className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${baseClassName}`}
            minRows={1}
            placeholder="Write something..."
          />
          {config.note && (
            <MarkdownDiv markdown={config.note} className="ml-5 text-xs text-gray-500 break-words" />
          )}
        </div>
      );
    }

    if (config.type === "boolean") {
      return (
        <div key={config.key} className="mt-3">
          <ControlledSwitch
            id={config.key}
            name={config.key}
            label={config.title || config.key}
            checked={value === "true"}
            onChange={(checked) => onChange(config.key, checked.toString())}
            pro={config.pro}
          />
          {config.note && (
            <MarkdownDiv markdown={config.note} className="ml-15 text-xs text-gray-500 break-words" />
          )}
        </div>
      );
    }

    if (config.type === "secret") {
      return (
        <div key={config.key} className="mt-3">
          <Label htmlFor={config.key}>{config.title || config.key}{proClass}</Label>
          <Input
            type="password"
            id={config.key}
            name={config.key}
            value={value || ""}
            onChange={(e) => onChange(config.key, e.target.value)}
            className={`h-8 ${baseClassName}`}
          />
          {config.note && (
            <MarkdownDiv markdown={config.note} className="ml-5 text-xs text-gray-500 break-words" />
          )}
        </div>
      );
    }

    // For other fields, treat as string
    return (
      <div key={config.key} className="mt-3">
        <Label htmlFor={config.key}>{config.title || config.key}{proClass}</Label>
        <Input
          type="text"
          id={config.key}
          name={config.key}
          value={value || ""}
          onChange={(e) => onChange(config.key, e.target.value)}
          className={`h-8 ${baseClassName}`}
        />
        {config.note && (
          <MarkdownDiv markdown={config.note} className="ml-5 text-xs text-gray-500 break-words" />
        )}
      </div>
    );
  }

  /**
   * Renders multiple configuration fields
   */
  static renderFields(
    configs: Configuration[],
    formData: Record<string, string>,
    onChange: (key: string, value: string) => void,
    className?: string
  ): React.ReactElement[] {
    return configs.map(config =>
      this.renderField({
        config,
        value: formData[config.key] || "",
        onChange,
        className
      })
    );
  }
}

// Hook-based alternative for functional components
export const useFieldRenderer = () => {
  const renderField = (props: FieldRendererProps) => {
    return FieldRenderer.renderField(props);
  };

  const renderFields = (
    configs: Configuration[],
    formData: Record<string, string>,
    onChange: (key: string, value: string) => void,
    className?: string
  ) => {
    return FieldRenderer.renderFields(configs, formData, onChange, className);
  };

  return { renderField, renderFields };
};

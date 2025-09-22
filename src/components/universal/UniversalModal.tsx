import Button from "../ui/button/Button";
import ControlledSwitch from "../form/switch/ControlledSwitch";
import TextareaAutosize from "react-textarea-autosize";
import { Modal } from "../ui/modal";
import { FieldConfig } from "../../types/form";
import { useI18n } from "../../context/I18nContext";
import { useState, useEffect } from "react";

interface UniversalModalProps<T = any> {
  isOpen: boolean,
  fields: ReadonlyArray<FieldConfig<T>>;
  data?: T | null;
  title?: string;
  description?: string;
  onSubmit?: (formData: Partial<T>) => void;
  onClose?: () => void;
  loading: boolean;
  error: string;
  children?: React.ReactNode;
}

export const UniversalModal = <T = any,>({
  isOpen,
  fields,
  data = null,
  title = "Modal Title",
  description = "",
  onSubmit,
  onClose,
  loading = false,
  error = '',
  children
}: UniversalModalProps<T>) => {
  const { t } = useI18n();

  // Initialize form data berdasarkan fields dan data yang ada
  const initializeFormData = () => {
    const initialData: Record<string, any> = {};
    fields.forEach(field => {
      const fieldKey = String(field.key);
      if (data && data[field.key] !== undefined) {
        // Mode edit: gunakan data yang ada
        initialData[fieldKey] = data[field.key];
      } else {
        // Mode create: gunakan default values
        switch (field.dataType) {
          case 'boolean':
            initialData[fieldKey] = false;
            break;
          case 'number':
            initialData[fieldKey] = 0;
            break;
          case 'string':
          default:
            initialData[fieldKey] = '';
            break;
        }
      }
    });
    return initialData;
  };

  const [formData, setFormData] = useState(initializeFormData);
  const [initializedData, setInitializedData] = useState<T | null>(null);

  // Update form data hanya ketika modal dibuka dengan data baru atau pertama kali
  useEffect(() => {
    if (isOpen) {
      // Hanya initialize ulang jika data berbeda dari yang terakhir diinisialisasi
      if (initializedData !== data) {
        setFormData(initializeFormData());
        setInitializedData(data);
      }
    }
  }, [data, fields, isOpen]);

  // Reset initialized data ketika modal ditutup
  useEffect(() => {
    if (!isOpen) {
      setInitializedData(null);
    }
  }, [isOpen]);

  // Handle perubahan input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let processedValue: any = value;

    // Process value berdasarkan type input
    if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      processedValue = parseFloat(value) || 0;
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  // Handle switch change (untuk ControlledSwitch)
  const handleSwitchChange = (fieldKey: string) => (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [fieldKey]: checked
    }));
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi required fields
    const missingFields = fields
      .filter(field => field.required)
      .filter(field => {
        const value = formData[String(field.key)];
        return !value || (typeof value === 'string' && !value.trim());
      });

    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields.map(f => t(f.labelKey)));
      return;
    }

    // Submit form data
    if (onSubmit) {
      onSubmit(formData as Partial<T>);
    }
  };

  // Get field value
  const getFieldValue = (fieldKey: keyof T) => {
    return formData[String(fieldKey)] || '';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose || (() => {})} className="max-w-[600px] flex flex-col">
      <div className="flex flex-col h-full overflow-hidden p-4 lg:p-6">
        <div className="px-2 pr-14 flex-shrink-0">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            {title}
          </h4>
          <p className="mb-1 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            {description}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">

          {/* Render form fields berdasarkan fields config */}
          <div className="px-2 space-y-4 flex-1 overflow-y-auto">
            {fields.map((field) => {
              const fieldKey = String(field.key);
              const fieldValue = getFieldValue(field.key);

              return (
                <div key={fieldKey} className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t(field.labelKey)} {field.required && <span className="text-red-500">*</span>}
                  </label>

                  {field.dataType === 'boolean' ? (
                    <div className="flex items-center">
                      <ControlledSwitch
                        id={fieldKey}
                        name={fieldKey}
                        label={Boolean(fieldValue) ? t('general.yes') : t('general.no')}
                        checked={Boolean(fieldValue)}
                        onChange={handleSwitchChange(fieldKey)}
                      />
                    </div>
                  ) : field.dataType === 'number' ? (
                    <input
                      type="number"
                      name={fieldKey}
                      value={fieldValue}
                      onChange={handleChange}
                      required={field.required}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  ) : field.dataType === 'string' ? (
                    <input
                      type={field?.masking ? 'password' : 'text'}
                      name={fieldKey}
                      value={fieldValue}
                      onChange={handleChange}
                      required={field.required}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  ) : field.dataType === 'text' ? (
                    <div className="mt-3">
                      <TextareaAutosize
                        id={fieldKey}
                        name={fieldKey}
                        value={fieldValue || ''}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white`}
                        minRows={3}
                        placeholder={t('general.writeSomething')}
                        required={field.required}
                      />
                    </div>

                  ) : (
                    <input
                      type="text"
                      name={fieldKey}
                      value={fieldValue}
                      onChange={handleChange}
                      required={field.required}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="px-3 text-sm text-gray-500 mt-4">
            {children}
          </div>

          {error && (
            <div className="text-sm mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-md">
              {error.split('\n').map((line, index) => (
                <div key={index}>{line}</div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 px-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 lg:justify-end flex-shrink-0">
            <Button size="sm" variant="outline" onClick={onClose} disabled={loading}>
              {t('general.cancel')}
            </Button>
            <Button size="sm" type="submit" disabled={loading}>
              {t('general.submit')}
            </Button>
          </div>

        </form>
      </div>
    </Modal>
  )
}
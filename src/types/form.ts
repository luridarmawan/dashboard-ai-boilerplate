import type { ReactNode } from 'react';

type DataType = 'string' | 'text' | 'number' | 'boolean' | 'date';

export type FieldConfig<T, K extends keyof T = keyof T> = {
  key: K;
  labelKey: string;             // i18n key, mis: 'example.name'
  dataType: DataType;           // semantik data
  required?: boolean;
  masking?: boolean;

  formProps?: Record<string, any>; // override props utk komponen form
  table?: {
    enabled?: boolean;            // default: true
    size?: number;
    minSize?: number;
    headerOverride?: string;      // kalau header mau beda dgn t(labelKey)
    noWrap?: boolean;
    cell?: (value: T[K], row: T) => ReactNode; // custom cell
  };
};

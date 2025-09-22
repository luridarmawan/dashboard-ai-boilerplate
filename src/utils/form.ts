import { FieldConfig } from '../types/form';

import { createColumnHelper, ColumnDef } from '@tanstack/react-table';
// ---- Fields Builders ----
export function buildFields<T>(cfg: FieldConfig<T>[], t: (k: string) => string) {
  return cfg.map(c => ({
    name: String(c.key),
    // type: c.dataType,          // gunakan fieldType sebagai tipe UI
    label: t(c.labelKey),
    required: !!c.required,
    dataType: c.dataType,       // kalau form renderer/validator butuh
    ...c.formProps,
  }));
}

export function buildColumns<T>(
  cfg: FieldConfig<T>[],
  columnHelper: ReturnType<typeof createColumnHelper<T>>,
  t: (k: string) => string
): ColumnDef<T, any>[] {
  return cfg
    .filter(c => c.table?.enabled !== false)
    .map(c =>
      columnHelper.accessor(row => row[c.key], {
        id: String(c.key),
        header: c.table?.headerOverride ?? t(c.labelKey),
        size: c.table?.size,
        minSize: c.table?.minSize,
        meta: {
          noWrap: c.table?.noWrap ?? true, // default true untuk backward compatibility
        },
        cell: info => {
          const val = info.getValue() as any;
          if (c.table?.cell) return c.table.cell(val, info.row.original);

          // Fallback cell berdasarkan dataType/fieldType
          if (c.dataType === 'boolean') {
            return val ? 'Yes' : 'No';
          }
          if (c.dataType === 'date' && val instanceof Date) {
            return val.toLocaleDateString(); // bisa di-override
          }
          return val ?? '';
        },
      })
    );
}

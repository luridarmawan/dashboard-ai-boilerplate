
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import PageMeta from "../../../src/components/common/PageMeta";
import { UniversalPage } from "../../../src/components/universal/UniversalPage";
import { ActionButton } from "../../../src/components/common/ActionButton";

import { FieldConfig } from "../../../src/types/form";
import { buildColumns } from "../../../src/utils/form";

import { useState, useEffect } from "react";
import { useI18n } from "../../../src/context/I18nContext";
import { useAuth } from "../../../src/context/AuthContext";
import { useClient } from "../../../src/context/ClientContext";

import { ModuleType } from "../../types/module";

const API_BASE_URL = import.meta.env.VITE_API_URL || `http://localhost:${import.meta.env.VITE_API_PORT}/api`;
const columnHelper = createColumnHelper<ModuleType>();

export default function ModulePage() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);

  const { token, isAuthenticated } = useAuth();
  const { selectedClient } = useClient();

  const [example, setExample] = useState<ModuleType[]>([]);

  // Define field configuration
  const fields = [
    {
      key: 'name',
      labelKey: 'general.name',
      dataType: 'string',
      required: true,
      table: { noWrap: true }, // explicitly set noWrap for name field
    },
    {
      key: 'description',
      labelKey: 'general.description',
      dataType: 'string',
      required: true,
      table: { noWrap: false }, // allow text wrapping for description
    },
    {
      key: 'path',
      labelKey: 'Path',
      dataType: 'string',
      table: { 
        headerOverride: 'Path',
        noWrap: true, // keep path in single line
      },
    },
    {
      key: 'version',
      labelKey: 'Version',
      dataType: 'string',
      table: { noWrap: true }, // version should not wrap
    },
  ] as const satisfies ReadonlyArray<FieldConfig<ModuleType>>;

  // Generate table columns from fields
  const columns = [
    ...buildColumns<ModuleType>(fields as unknown as FieldConfig<ModuleType>[], columnHelper, t),

    // generate action column 
    columnHelper.display({
      id: 'actions',
      header: 'Action',
      size: 80,
      minSize: 80,
      cell: (info) => {
        const rowData = info.row.original;

        const handleEdit = () => {
          const editFunction = (window as any).example_editDataModal;
          if (editFunction) editFunction(rowData);
        };
        const handleDelete = () => {
          if (!confirm(t('example.deleteConfirm'))) return;
          const deleteFunction = (window as any).example_deleteData;
          if (deleteFunction) deleteFunction(rowData);
        };

        return (
          <div className="flex items-center gap-2">
            <ActionButton onClick={handleEdit} variant="edit" title={`Edit ${rowData.name}`} />
            <ActionButton onClick={handleDelete} variant="delete" title={`Delete ${rowData.name}`} />
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: example,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const prepareExample = async () => {
    if (selectedClient){
      //
    }
  }

  useEffect(() => {
    if (selectedClient && selectedClient.id && isAuthenticated && token) {

      // Do something ...

      prepareExample();
    }
  }, [token, isAuthenticated, selectedClient])

  return (
    <div>
      <PageMeta
        title="Module Page | AI-Powered Admin Dashboard"
        description="This is Example Page by AI-Powered Admin Dashboard"
      />

      <UniversalPage<ModuleType>
        module="module"
        endpoint={`${API_BASE_URL}/module`}
        title="Module Administration"
        fields={fields}
        table={table}
        data={example}
        setData={setExample}
        modalDescription="module information form"
        dataKey="data.modules"
        loading={loading}
        setLoading={setLoading}
      >
        <div className="text-sm text-gray-500">
          Module administrator
        </div>
      </UniversalPage>
    </div>
  );

}

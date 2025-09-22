
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import PageMeta from "../../components/common/PageMeta";
import Loading from "../../components/common/Loading";
import { UniversalPage } from "../../components/universal/UniversalPage";
import { ActionButton } from "../../components/common/ActionButton";

import { FieldConfig } from "../../types/form";
import { buildColumns } from "../../utils/form";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useI18n } from "../../context/I18nContext";
import { useClient } from "../../context/ClientContext";
import { setXFetchContext } from "../../services";

import { ExampleType } from "./types/example";

const API_BASE_URL = import.meta.env.VITE_API_URL || `http://localhost:${import.meta.env.VITE_API_PORT}/api`;
const columnHelper = createColumnHelper<ExampleType>();

export default function ExampleMain() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);

  const { token, isAuthenticated } = useAuth();
  const { selectedClient } = useClient();

  const [example, setExample] = useState<ExampleType[]>([]);

  // Define field configuration
  const fields = [
    {
      key: 'name',
      labelKey: 'example.name',
      dataType: 'string',
      required: true,
    },
    {
      key: 'description',
      labelKey: 'example.description',
      dataType: 'text',
      required: true,
    },
    {
      key: 'external',
      labelKey: 'example.external',
      dataType: 'boolean',
      table: { headerOverride: 'External' },
    },
  ] as const satisfies ReadonlyArray<FieldConfig<ExampleType>>;

  // Generate table columns from fields
  const columns = [
    ...buildColumns<ExampleType>(fields as unknown as FieldConfig<ExampleType>[], columnHelper, t),

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

  useEffect(() => {
    // Set xfetch context when authentication is ready
    if (selectedClient && selectedClient.id && isAuthenticated && token) {
      setXFetchContext({
        token,
        selectedClient,
      });
      setLoading(false); // Ready to fetch data
    } else if (!selectedClient || !selectedClient.id) {
      setLoading(false);
    }
  }, [token, isAuthenticated, selectedClient]);

  // Show loading state
  if (loading) {
    return (
      <div>
        <Loading title={"Example Page | " + import.meta.env.VITE_APP_NAME}
          message={t('example.loading')} />
      </div>
    );
  }

  return (
    <div>
      <PageMeta
        title="Example Page | AI-Powered Admin Dashboard"
        description="This is Example Page by AI-Powered Admin Dashboard"
      />

      <UniversalPage<ExampleType>
        module="example"
        endpoint={`${API_BASE_URL}/example`}
        title="Example Page"
        fields={fields}
        table={table}
        data={example}
        setData={setExample}
        modalDescription="example information form"
        dataKey="data.examples"
        loading={loading}
        setLoading={setLoading}
        autoFetch={!loading} // Only auto-fetch when auth is ready
      >
        <div className="text-sm text-gray-500">
          This is example text note
        </div>
      </UniversalPage>
    </div>
  );

}

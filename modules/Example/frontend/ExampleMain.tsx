
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import PageMeta from "../../../src/components/common/PageMeta";
import { UniversalPage } from "../../../src/components/universal/UniversalPage";
import { ActionButton } from "../../../src/components/common/ActionButton";
import MarkdownDiv from "../../../src/components/common/MarkdownDiv";

import { FieldConfig } from "../../../src/types/form";
import { buildColumns } from "../../../src/utils/form";

import { useState, useEffect } from "react";
import { useI18n } from "../../../src/context/I18nContext";
import { useAuth } from "../../../src/context/AuthContext";
import { useClient } from "../../../src/context/ClientContext";

import { getConfiguration } from "../../../src/utils/";

import { ExampleType } from "./types/example";

const API_BASE_URL = import.meta.env.VITE_API_URL || `http://localhost:${import.meta.env.VITE_API_PORT}/api`;
const columnHelper = createColumnHelper<ExampleType>();

export default function ExampleMain() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);

  const { token, isAuthenticated } = useAuth();
  const { selectedClient } = useClient();

  const [example, setExample] = useState<ExampleType[]>([]);
  const [permissions, setPermissions] = useState<any>({});
  const [pageTitle, setPageTitle] = useState('example page');
  const [footerInfo, setFooterInfo] = useState('');

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
      table: { noWrap: false }, // allow text wrapping for description
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
            {permissions.canEdit && (
              <ActionButton onClick={handleEdit} variant="edit" title={`Edit ${rowData.name}`} />
            )}
            {permissions.canManage && (
              <ActionButton onClick={handleDelete} variant="delete" title={`Delete ${rowData.name}`} />
            )}
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
    if (selectedClient) {
      setFooterInfo(await getConfiguration('example.footerinfo', 'This is example text note', token));
      setPageTitle(await getConfiguration('example.title', 'example page', token));
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
        title="Example Page | AI-Powered Admin Dashboard"
        description="This is Example Page by AI-Powered Admin Dashboard"
      />

      <UniversalPage<ExampleType>
        module="example"
        endpoint={`${API_BASE_URL}/example`}
        title={pageTitle}
        fields={fields}
        table={table}
        data={example}
        setData={setExample}
        modalDescription="example information form"
        dataKey="data.examples"
        loading={loading}
        setLoading={setLoading}
        skipCSRF={true}
        onPermissionsChange={setPermissions}
      >
        <div className="text-sm text-gray-500">
          <MarkdownDiv markdown={footerInfo} />
          <br />Source code: <code>modules/Example/frontend/ExampleMain.tsx</code>
        </div>
      </UniversalPage>
    </div>
  );

}


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

import { formatNumber } from "../../../src/utils/number";
import { formatDateTime } from "../../../src/utils/datetime";
import { useState, useEffect } from "react";
import { useI18n } from "../../../src/context/I18nContext";
import { useAuth } from "../../../src/context/AuthContext";
import { useClient } from "../../../src/context/ClientContext";
import { Modal } from "../../../src/components/ui/modal";

import { ExpenseType } from "./types/expense";

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || `http://localhost:${(import.meta as any).env?.VITE_API_PORT || 3001}/api`;
const columnHelper = createColumnHelper<ExpenseType>();

export default function ExpensePage() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);

  const { token, isAuthenticated } = useAuth();
  const { selectedClient } = useClient();

  const [expense, setExpense] = useState<ExpenseType[]>([]);
  const [permissions, setPermissions] = useState<any>({});
  const [pageTitle, setPageTitle] = useState('expense page');
  const [isMetadataModalOpen, setIsMetadataModalOpen] = useState(false);
  const [metadataContent, setMetadataContent] = useState<any>(null);

  // Define field configuration
  const fields = [
  ] as const satisfies ReadonlyArray<FieldConfig<ExpenseType>>;


  // Generate table columns from fields
  const columns = [
    ...buildColumns<ExpenseType>(fields as unknown as FieldConfig<ExpenseType>[], columnHelper, t),

    // Override post_date column with custom formatting
    columnHelper.accessor("post_date", {
      header: t('Post Date'),
      cell: (info) => {
        const value = info.getValue();
        return <span className="whitespace-nowrap">{formatDateTime(value)}</span>;
      }
    }),

    // Override order_date column with custom formatting
    columnHelper.accessor("order_date", {
      header: t('Order Date'),
      cell: (info) => {
        const value = info.getValue();
        return <span className="whitespace-nowrap">{formatDateTime(value)}</span>;
      }
    }),

    columnHelper.accessor("store_name", {
      header: t('Store Name'),
      cell: (info) => {
        const value = info.getValue();
        return value || '-';
      }
    }),

    columnHelper.accessor("amount", {
      header: "Amount",
      cell: (info) => {
        let value = info.getValue();
        // let amount = parseFloat(value.replace(/,/g, ".").replace(/\./g, ""));
        let amount = formatNumber(value);
        return (
          <span className="whitespace-nowrap">
            {amount}
          </span>
        );
      }
    }),

    columnHelper.accessor("is_duplicate", {
      header: t('Duplicate'),
      cell: (info) => {
        const value = info.getValue();
        return value ? t('Yes') : t('No');
      }
    }),

    columnHelper.accessor("is_approved", {
      header: t('Approved'),
      cell: (info) => {
        const value = info.getValue();
        return value ? t('Yes') : t('No');
      }
    }),

    // generate action column 
    columnHelper.display({
      id: 'actions',
      header: 'Action',
      size: 80,
      minSize: 80,
      cell: (info) => {
        const rowData = info.row.original;

        const handleViewMetadata = () => {
          setMetadataContent(rowData.metadata);
          setIsMetadataModalOpen(true);
        };
        const handleDelete = () => {
          if (!confirm(t('example.deleteConfirm'))) return;
          const deleteFunction = (window as any).example_deleteData;
          if (deleteFunction) deleteFunction(rowData);
        };

        return (
          <div className="flex items-center gap-2">
            {permissions.canEdit && (
              <ActionButton onClick={handleViewMetadata} variant="view" title={`View ${rowData.store_name || rowData.doc_id}`} />
            )}
            {permissions.canManage && (
              <ActionButton onClick={handleDelete} variant="delete" title={`Delete ${rowData.store_name || rowData.doc_id}`} />
            )}
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: expense,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const prepareExample = async () => {
    if (selectedClient) {
      setPageTitle('Expenses');
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
        title="Expenses Page | AI-Powered Admin Dashboard"
        description="This is Expenses Page by AI-Powered Admin Dashboard"
      />

      <UniversalPage<ExpenseType>
        module="accounting"
        endpoint={`${API_BASE_URL}/accounting/expense`}
        title={pageTitle}
        fields={fields}
        table={table}
        data={expense}
        setData={setExpense}
        modalDescription="Expense information form"
        dataKey="data.expenses"
        loading={loading}
        setLoading={setLoading}
        skipCSRF={true}
        onPermissionsChange={setPermissions}
      >
        <div className="text-sm text-gray-500">
          <span className="text-red-300">Demo Only</span>
        </div>
      </UniversalPage>

      {/* Metadata Modal */}
      <Modal
        isOpen={isMetadataModalOpen}
        onClose={() => setIsMetadataModalOpen(false)}
        className="max-w-4xl w-full max-h-[80vh]"
      >
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {t('Metadata')}
          </h3>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 overflow-auto max-h-96">
            <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {metadataContent ? JSON.stringify(metadataContent, null, 2) : t('No metadata available')}
            </pre>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={() => setIsMetadataModalOpen(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {t('general.close')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );

}

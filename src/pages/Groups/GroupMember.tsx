
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
import { useParams } from "react-router";
import { useI18n } from "../../../src/context/I18nContext";
import { useAuth } from "../../../src/context/AuthContext";
import { useClient } from "../../../src/context/ClientContext";


import { GroupMemberType } from "./types/group_member";

const API_BASE_URL = import.meta.env.VITE_API_URL || `http://localhost:${import.meta.env.VITE_API_PORT}/api`;
const columnHelper = createColumnHelper<GroupMemberType>();

export default function GroupMember() {
  const { groupId, groupName } = useParams<{ groupId: string, groupName: string }>();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);

  const { token, isAuthenticated } = useAuth();
  const { selectedClient } = useClient();

  const [example, setExample] = useState<GroupMemberType[]>([]);
  const [pageTitle, setPageTitle] = useState('group member page');

  // Define field configuration
  const fields = [
    {
      key: 'first_name',
      labelKey: 'profile.firstName',
      dataType: 'string',
      required: true,
    },
    {
      key: 'last_name',
      labelKey: 'profile.lastName',
      dataType: 'string',
      required: true,
    },
    {
      key: 'email',
      labelKey: 'profile.email',
      dataType: 'string',
      required: true,
    },
  ] as const satisfies ReadonlyArray<FieldConfig<GroupMemberType>>;

  // Generate table columns from fields
  const columns = [
    ...buildColumns<GroupMemberType>(fields as unknown as FieldConfig<GroupMemberType>[], columnHelper, t),

    // generate action column 
    columnHelper.display({
      id: 'actions',
      header: 'Action',
      size: 80,
      minSize: 80,
      cell: (info) => {
        const rowData = info.row.original;

        const handleDelete = () => {
          if (!confirm(t('example.deleteConfirm'))) return;
          const deleteFunction = (window as any).example_deleteData;
          if (deleteFunction) deleteFunction(rowData);
        };

        return (
          <div className="flex items-center gap-2">
            <ActionButton onClick={handleDelete} variant="delete" title={`Delete ${rowData.first_name} ${rowData.last_name}`} />
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
      setPageTitle(`Group Member - ${groupName}`);
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

      <UniversalPage<GroupMemberType>
        module="example"
        endpoint={`${API_BASE_URL}/group-members/${groupId}`}
        title={pageTitle}
        fields={fields}
        table={table}
        data={example}
        setData={setExample}
        modalDescription="example information form"
        dataKey="data.members"
        loading={loading}
        setLoading={setLoading}
      >
      </UniversalPage>
    </div>
  );

}

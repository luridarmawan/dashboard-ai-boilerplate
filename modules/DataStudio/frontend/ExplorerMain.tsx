
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useDropzone } from "react-dropzone";

import PageMeta from "../../../src/components/common/PageMeta";
import { UniversalPage } from "../../../src/components/universal/UniversalPage";
import { ActionButton } from "../../../src/components/common/ActionButton";
import { ToolbarButton } from "../../../src/components/page/ToolbarButton";
import { BoltIcon, DocumentPlusIcon } from '@heroicons/react/24/outline';
import MarkdownDiv from "../../../src/components/common/MarkdownDiv";
import toast from "react-hot-toast";

import { FieldConfig } from "../../../src/types/form";
import { buildColumns } from "../../../src/utils/form";

import { useState, useEffect, useRef } from "react";
import { useI18n } from "../../../src/context/I18nContext";
import { useAuth } from "../../../src/context/AuthContext";
import { useClient } from "../../../src/context/ClientContext";
import { xfetch, setXFetchContext } from "../../../src/services";

import { getConfiguration } from "../../../src/utils/";

import { ExplorerType } from "./types/explorer";

const API_BASE_URL = import.meta.env.VITE_API_URL || `http://localhost:${import.meta.env.VITE_API_PORT}/api`;
const columnHelper = createColumnHelper<ExplorerType>();

export default function ExplorerMain() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { token, isAuthenticated } = useAuth();
  const { selectedClient } = useClient();

  const [explorerData, setExplorerData] = useState<ExplorerType[]>([]);
  const [footerInfo, setFooterInfo] = useState('');
  const [pageTitle, setPageTitle] = useState('explorer page');
  const [driveId, setDriveId] = useState('');

  // File input reference for addFiles function
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dropzone functionality
  const onDrop = async (acceptedFiles: File[]) => {
    console.log("Files dropped:", acceptedFiles);

    if (acceptedFiles.length > 0) {
      setIsUploading(true);
      try {
        // Process each file
        for (const file of acceptedFiles) {
          console.log(`Processing file: ${file.name} (${file.size} bytes)`);

          // Upload file to server
          const uploadFormData = new FormData();
          uploadFormData.append('file', file);

          const uploadUrl = `${API_BASE_URL}/explorer/upload`;
          const response = await xfetch(uploadUrl, {
            method: 'POST',
            body: uploadFormData,
            skipContentType: true
          });

          const responseData = await response.json();

          if (!response.ok || !responseData.success) {
            throw new Error(responseData.message || 'Upload failed');
          }

          console.log(`File ${file.name} processed successfully`);
          toast.success(`Successfully processed file "${file.name}"`);
        }

        toast.success(`Successfully processed ${acceptedFiles.length} file(s)`);
        refreshData();
      } catch (error) {
        console.error('Error processing files:', error);
        toast.error(`Failed to process files: ${error}`);
      }
      setIsUploading(false);
    }
  };

  const { getRootProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt', '.md'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
      'image/svg+xml': ['.svg'],
    },
    multiple: true,
    noClick: true, // Prevent click events from opening file dialog
    noKeyboard: true, // Prevent keyboard events from opening file dialog
  });


  // Define field configuration
  const fields = [
    {
      key: 'name',
      labelKey: 'File Name',
      dataType: 'string',
      required: true,
    },
  ] as const satisfies ReadonlyArray<FieldConfig<ExplorerType>>;

  // Generate table columns from fields
  const columns = [
    ...buildColumns<ExplorerType>(fields as unknown as FieldConfig<ExplorerType>[], columnHelper, t),

    // generate action column 
    columnHelper.display({
      id: 'actions',
      header: 'Action',
      size: 80,
      minSize: 80,
      cell: (info) => {
        const rowData = info.row.original;

        const handleView = () => {
          const docURL = 'https://docs.google.com/spreadsheets/d/' + rowData.id;
          window.open(docURL, "_blank", "noopener,noreferrer");
        };

        const handleDelete = () => {
          if (!confirm('Are you sure you want to delete this file?')) return;
          deleteFile(rowData)
        };

        return (
          <div className="flex items-center gap-2">
            <ActionButton onClick={handleView} variant="view" title={`View ${rowData.name}`} />
            <ActionButton onClick={handleDelete} variant="delete" title={`Delete ${rowData.name}`} />
          </div>
        );
      },
    }),
  ];

  // Function to trigger file browser dialog
  const addFiles = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const refreshData = () => {
    if ((window as any)['explorer_refreshData']) {
      (window as any)['explorer_refreshData']();
    }
  }

  // Handle file selection from file input
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      await onDrop(fileArray);
    }
    // Reset the input value to allow selecting the same file again
    if (event.target) {
      event.target.value = '';
    }
  };

  const deleteFile = async (fileInfo: { id: string, name: string }) => {
    try {
      const url = API_BASE_URL + '/explorer/file/' + fileInfo.id;
      const response = await xfetch(url, {
        method: 'DELETE',
        body: JSON.stringify({ fileId: fileInfo.id }),
      });
      const responseData = await response.json();
      if (response.ok && responseData.success) {
        toast.success(`Delete file "${fileInfo.name}" success`);
        refreshData();
      } else {
        throw new Error(responseData.message || t('general.saveError'));
      }
    } catch (error) {
      console.error('Error building data:', error);
      toast.error(t('Failed to build data: ' + error));
    }
  }

  const buildData = async () => {
    setIsBuilding(true);
    try {
      const url = API_BASE_URL + '/explorer/build';
      const response = await xfetch(url, {
        method: 'POST',
      });
      const responseData = await response.json();
      if (response.ok && responseData.success) {
        toast.success(t('Knowledge building starts in 10 minutes, please wait...'));
      } else {
        throw new Error(responseData.message || t('general.saveError'));
      }
    } catch (error) {
      console.error('Error building data:', error);
      toast.error(t('Failed to build data: ' + error));
    }

    setIsBuilding(false);
  }

  const customButton = (
    <>
    <ToolbarButton id="btn-add" className="bg-green-200" tooltip="Add File ..." onClick={() => {
      addFiles();
    }}>
      <DocumentPlusIcon className={`h-4 w-4 ${isBuilding ? 'animate-spin' : ''}`} />
      {isUploading ? 'Uploading...' : ''}
    </ToolbarButton>
    <ToolbarButton id="btn-build" className="bg-green-300" tooltip="Build ..." onClick={() => {
      buildData();
    }}>
      <BoltIcon className={`h-4 w-4 ${isBuilding ? 'animate-spin' : ''}`} />
      {isBuilding ? 'Building...' : ''}
    </ToolbarButton>
    </>
  )

  const table = useReactTable({
    data: explorerData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const prepareLayout = async () => {
    if (selectedClient){
      setPageTitle('Explorer: ' + await getConfiguration('explorer.folder_name', 'explorer page', token));
      setDriveId(await getConfiguration('explorer.folder_id', '---', token));
      setFooterInfo("The Explorer lets you browse and manage your Google Drive directly, powered by [CARIK.id](https://carik.id/) automation for seamless syncing and workflows.\nThink of it as your smart window into Google Drive—browse, sync, and automate effortlessly with n8n.");
    }
  }

  useEffect(() => {
    if (selectedClient && selectedClient.id && isAuthenticated && token) {
      setXFetchContext({
        token,
        selectedClient
      });
      prepareLayout();
    }
  }, [token, isAuthenticated, selectedClient])

  return (
    <div
      id="explorer-container"
      className={`min-h-dvh transition-colors duration-200 relative ${
        isDragActive
          ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-400 dark:border-blue-600"
          : ""
      }`}
      {...getRootProps()}
    >
      {/* Dropzone indicator */}
      {isDragActive && (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border-2 border-dashed border-blue-400 dark:border-blue-600">
            <div className="text-center">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Drop Files Here
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Release to upload your files to the Explorer
              </p>
            </div>
          </div>
        </div>
      )}
      <PageMeta
        title="Explorer Page | AI-Powered Admin Dashboard"
        description="This is Explorer Page by AI-Powered Admin Dashboard"
      />

      {/* Hidden file input for addFiles functionality */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.xlsx,.xls,.csv,.docx,.doc,.txt,.png,.jpg,.jpeg,.webp,.svg,.md"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <UniversalPage<ExplorerType>
        module="explorer"
        endpoint={`${API_BASE_URL}/explorer`}
        title={pageTitle}
        fields={fields}
        table={table}
        data={explorerData}
        setData={setExplorerData}
        dataKey="data.files"
        loading={loading}
        setLoading={setLoading}
        enableAdd={false}
        enableSearch={false}
        onRowClick={(rowData, columnInfo) => {
          if (columnInfo?.id === 'actions') {
            return;
          }
          const docURL = `https://docs.google.com/file/d/${rowData.id}/view`;
          window.open(docURL, "_blank", "noopener,noreferrer");
        }}
        customButton={customButton}
        skipCSRF
      >
        {/* Dropzone Area */}
        <div id="dropzone-container" className="mb-6 hidden">
          <div className="transition border border-gray-300 border-dashed cursor-pointer dark:hover:border-brand-500 dark:border-gray-700 rounded-xl hover:border-brand-500">
            <form
              className={`dropzone rounded-xl border-dashed border-gray-300 p-7 lg:p-10
              ${
                isDragActive
                  ? "border-brand-500 bg-gray-100 dark:bg-gray-800"
                  : "border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
              }
            `}
              id="explorer-upload"
            >

              <div className="dz-message flex flex-col items-center m-0!">
                {/* Icon Container */}
                <div className="mb-[22px] flex justify-center">
                  <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                    <svg
                      className="fill-current"
                      width="29"
                      height="28"
                      viewBox="0 0 29 28"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M14.5019 3.91699C14.2852 3.91699 14.0899 4.00891 13.953 4.15589L8.57363 9.53186C8.28065 9.82466 8.2805 10.2995 8.5733 10.5925C8.8661 10.8855 9.34097 10.8857 9.63396 10.5929L13.7519 6.47752V18.667C13.7519 19.0812 14.0877 19.417 14.5019 19.417C14.9161 19.417 15.2519 19.0812 15.2519 18.667V6.48234L19.3653 10.5929C19.6583 10.8857 20.1332 10.8855 20.426 10.5925C20.7188 10.2995 20.7186 9.82463 20.4256 9.53184L15.0838 4.19378C14.9463 4.02488 14.7367 3.91699 14.5019 3.91699ZM5.91626 18.667C5.91626 18.2528 5.58047 17.917 5.16626 17.917C4.75205 17.917 4.41626 18.2528 4.41626 18.667V21.8337C4.41626 23.0763 5.42362 24.0837 6.66626 24.0837H22.3339C23.5766 24.0837 24.5839 23.0763 24.5839 21.8337V18.667C24.5839 18.2528 24.2482 17.917 23.8339 17.917C23.4197 17.917 23.0839 18.2528 23.0839 18.667V21.8337C23.0839 22.2479 22.7482 22.5837 22.3339 22.5837H6.66626C6.25205 22.5837 5.91626 22.2479 5.91626 21.8337V18.667Z"
                      />
                    </svg>
                  </div>
                </div>

                {/* Text Content */}
                <h4 className="mb-3 font-semibold text-gray-800 text-theme-xl dark:text-white/90">
                  {isDragActive ? "Drop Files Here" : "Drag & Drop Files Here"}
                </h4>

                <span className="text-center mb-5 block w-full max-w-[290px] text-sm text-gray-700 dark:text-gray-400">
                  Drag and drop your PDF, Excel, CSV, Word, text files, or images here or browse
                </span>

                <button
                  type="button"
                  className="font-medium underline text-theme-sm text-brand-500 hover:text-brand-600 focus:outline-none focus:text-brand-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    addFiles();
                  }}
                >
                  Browse File
                </button>
              </div>
            </form>
          </div>
        </div>
        {/* /Dropzone Area */}

        <div className="text-sm text-gray-500">
          <div className="font-semibold text-gray-800 ">
            You can upload your file by dragging and dropping it into this area.
          </div>
          <MarkdownDiv markdown={footerInfo} className="mt-4" />
          <br /><b>Jump to your <a href={`https://drive.google.com/drive/folders/${driveId}`} target="_blank" rel="noopener noreferrer">drive</a></b>.
          <br />Source code: <code>modules/Explorer/frontend/Explorer.tsx</code>
        </div>
      </UniversalPage>
    </div>
  );

}

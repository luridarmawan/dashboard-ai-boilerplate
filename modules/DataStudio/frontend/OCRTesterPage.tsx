import { useState, useEffect } from "react";
import { useAuth } from "../../../src/context/AuthContext";
import { useClient } from "../../../src/context/ClientContext";
import { xfetch, setXFetchContext } from "../../../src/services";

import { useDropzone } from "react-dropzone";
import PageMeta from "../../../src/components/common/PageMeta";
import { Page } from "../../../src/components/page/Page";
import { PageHeader } from "../../../src/components/page/Header";
import { Content } from "../../../src/components/page/Content";
import { ToolbarButton } from "../../../src/components/page/ToolbarButton";
import { DocumentMagnifyingGlassIcon as ScanIcon } from '@heroicons/react/24/outline';

import toast from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || `http://localhost:${import.meta.env.VITE_API_PORT}/api`;

export default function OCRTesterPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<string>("");
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState<boolean>(false);

  const { token, isAuthenticated } = useAuth();
  const { selectedClient } = useClient()

  const prepareLayout = async () => {
    if (selectedClient){
      // DO something with selectedClient
    }
  }

  const doScanOCR = async () => {
    // Validation: Check if document type is selected
    if (!selectedDocType) {
      toast.error('Please select a document type first');
      return;
    }

    // Validation: Check if file is uploaded
    if (!uploadedFile) {
      toast.error('Please upload an image file first');
      return;
    }

    setIsScanning(true);
    setOcrResult(null);
    console.log('Starting OCR scan...');

    try {
      // Call OCR API
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('doc_type', selectedDocType);

      const url = `${API_BASE_URL}/ocr`;
      console.log('Calling OCR API:', url);

      const response = await xfetch(url, {
        method: 'POST',
        body: formData,
        skipContentType: true
      });

      if (response.ok) {
        const data = await response.json();
        console.log('OCR Result:', data);

        // Update the OCR results display
        setOcrResult(data);

        // Show success message
        toast.success(`OCR scan completed successfully! Document type: ${selectedDocType}`);

        // Display results in the results area
        if (data.data) {
          console.log('File uploaded successfully:', data.data);
        }
      } else {
        const errorText = await response.text();
        const responseJson = await JSON.parse(errorText)
        toast.error(`OCR extraction failed: ${responseJson.message}`);
      }
    } catch (error) {
      console.error('Error calling OCR API:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Error calling OCR API: ${errorMessage}`);
    } finally {
      console.log('OCR scan completed');
      setIsScanning(false);
    }
  }

  // Handle file upload
  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

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
      id="ocr-container"
      className={`min-h-dvh transition-colors duration-200 relative`}
    >
      <PageMeta
        title="OCR Tester | AI-Powered Admin Dashboard"
        description="This is OCR Tester Page by AI-Powered Admin Dashboard"
      />
      <Page id="ocr-tester-page" className="h-full">
        <PageHeader title="OCR Tester">
          <ToolbarButton id="btn-ocr" className="bg-green-300" tooltip="Extract Text" onClick={doScanOCR} disabled={isScanning}>
            <ScanIcon className={`h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? ' Scanning...' : ''}
          </ToolbarButton>
        </PageHeader>
        <Content>
          <div className="min-h-full h-full flex gap-6 p-1" aria-disabled={isScanning}>
            {/* Left Column - 1/3 width */}
            <div className="w-1/3 flex flex-col gap-4">
              {/* Document Type Dropdown */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Document Type
                </label>
                <select
                  id="doc-type"
                  name="doc-type"
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={isScanning}
                >
                  <option value="">Select document type</option>
                  <option value="receipt">Receipt</option>
                  <option value="invoice">Invoice</option>
                  <option value="ktp">KTP</option>
                  <option value="sim">SIM</option>
                </select>
              </div>

              {/* Image Upload Area */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Upload Image
                </label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                    isDragActive
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <input {...getInputProps() } disabled={isScanning} />
                  <div className="space-y-2">
                    <div className="text-gray-500 dark:text-gray-400">
                      <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        {isDragActive ? 'Drop the image here' : 'Click to upload'}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400"> or drag and drop</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Image Preview */}
              <div id="preview-container" className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Preview
                </label>
                <div
                  id="preview-image"
                  className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 min-h-[200px] flex items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => previewUrl && setIsZoomModalOpen(true)}
                >
                  {previewUrl ? (
                    <div className="w-full space-y-3">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-w-full max-h-[150px] object-contain mx-auto rounded border"
                      />
                      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                        <p className="font-medium">{uploadedFile?.name}</p>
                        <p>{uploadedFile ? `${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB` : ''}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400">
                      <svg className="mx-auto h-12 w-12 mb-2" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="text-sm">No image uploaded</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - 2/3 width */}
            <div className="w-2/3 flex flex-col">
              <div className="space-y-2 mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  OCR Results
                </label>
              </div>
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800 flex-1 overflow-auto">
                {ocrResult ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                        OCR Processing Complete
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Status:</span>
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            {ocrResult.success ? 'Success' : 'Failed'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Document Type:</span>
                          <span className="text-gray-800 dark:text-gray-200 font-medium">
                            {selectedDocType.toUpperCase()}
                          </span>
                        </div>
                        {ocrResult.data && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">File Name:</span>
                              <span className="text-gray-800 dark:text-gray-200 font-medium">
                                {ocrResult.data.filename}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">File Size:</span>
                              <span className="text-gray-800 dark:text-gray-200 font-medium">
                                {(ocrResult.data.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">File Type:</span>
                              <span className="text-gray-800 dark:text-gray-200 font-medium">
                                {ocrResult.data.mimetype}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <h4 className="text-md font-semibold text-blue-800 dark:text-blue-200 mb-2">
                        File Information
                      </h4>
                      <pre className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded border overflow-auto">
                        {JSON.stringify(ocrResult.data.ocr_result, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 dark:text-gray-400 text-center py-8">
                    <svg className="mx-auto h-12 w-12 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M9 12l2 2 4-4m6 2h12M9 20l2 2 4-4m6 2h12M9 28l2 2 4-4m6 2h12M9 36l2 2 4-4m6 2h12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-sm">Upload an image to see OCR results</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Content>
      </Page>

      {/* Zoom Modal */}
      {isZoomModalOpen && previewUrl && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black bg-opacity-75" onClick={() => setIsZoomModalOpen(false)}>
          <div className="relative max-w-[90vw] max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl">
            <button
              onClick={() => setIsZoomModalOpen(false)}
              className="absolute top-2 right-2 z-10 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-75 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={previewUrl}
              alt="Zoomed Preview"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

    </div>
  )
}

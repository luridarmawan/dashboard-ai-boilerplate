// import PageBreadcrumb from "./PageBreadcrumb";
import PageMeta from "./PageMeta";

interface LoadingProps {
  title?: string;
  message?: string;
}

export default function Loading({
  title = "", 
  message = "Loading..."}: LoadingProps){

  return (
    <div>
      <PageMeta title={title} description={message} />
      {/* <PageBreadcrumb pageTitle={title} /> */}
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
          <div className="text-gray-500 dark:text-gray-400 font-medium">{message}</div>
        </div>
      </div>
    </div>

  );
}


import UserInfoCard from "../../components/UserProfile/UserInfoCard";
import { useI18n } from "../../context/I18nContext";
// import UserAddressCard from "../components/UserProfile/UserAddressCard";
import PageMeta from "../../components/common/PageMeta";

export default function UserProfiles() {
  const { t } = useI18n();
  return (
    <>
      <PageMeta
        title={"User Profile | " + import.meta.env.VITE_APP_NAME + " Dashboard"}
        description={import.meta.env.VITE_APP_DESCRIPTION}
      />
      {/* <PageBreadcrumb pageTitle="Profile" /> */}

      <div id="userprofile-page" className="base-container mx-auto">
        <div className="content-container bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{t('profile.userProfile')}</h2>
            <button
              className="hide inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-300 dark:bg-blue-900/50 dark:hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-200 disabled:opacity-50"
            >
              Edit
            </button>
          </div>
          <UserInfoCard />
        </div>
      </div>

    </>
  );
}

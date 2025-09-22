import LanguageSwitcher from "../components/common/LanguageSwitcher";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";
import ClientSwitcher from "../components/common/ClientSwitcher";

export default function SidebarFooter() {
  return (
    <div
      id="sidebar-footer"
      className="mt-auto mb-0 pt-2 pb-20 md:pb-4 text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800 flex justify-center items-center"
    >
      <ClientSwitcher />
      <LanguageSwitcher />
      <div className="ml-2">
        <ThemeToggleButton />
      </div>
    </div>
  );
}
import React from "react";
import { useSidebar } from "../context/SidebarContext";

const Footer: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-1 px-6 z-[60]">
        <div className={`mx-auto max-w-(--breakpoint-2xl) transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:pl-[290px]" : "lg:pl-[90px]"
        } ${isMobileOpen ? "pl-0" : ""} text-center`}>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} <a href="https://carik.id" target="_blank">AI-Powered Admin Dashboard</a>.
            </p>
        </div>
    </footer>
  );
};

export default Footer;
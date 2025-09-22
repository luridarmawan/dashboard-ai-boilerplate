import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import Footer from "./Footer";
import FloatingChatButton from "../components/ai/FloatingChatButton";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="flex flex-col min-h-screen">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        id="content-container"
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[75px]"
        } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <AppHeader />
        <div id="content-outlet" className="p-2 mx-auto max-w-(--breakpoint-2xl) md:p-2 pb-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen">
        <LayoutContent />
        <Footer />
        <FloatingChatButton />
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;

import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";

// Assume these icons are imported from an icon library
import {
  CalenderIcon,
  ChevronDownIcon,
  DocsIcon,
  HorizontaLDots,
  PlugInIcon,
  GridIcon,
  UserCircleIcon,
  GroupIcon,
  BoxCubeIcon,
  BoxIcon,
  renderIcon,
} from "../icons";
import { FaGithub } from "react-icons/fa";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";
import { usePermission } from "../context/PermissionContext";
import SidebarWidget from "./SidebarWidget";
import SidebarFooter from "./SidebarFooter";
import SidebarChatTopicList from "../components/ai/SidebarChatTopicList";
import { getConfigurationAsBoolean } from "../utils/configuration";
import { xfetch, setXFetchContext } from "../services";
import { useClient } from "../context/ClientContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || `http://localhost:${import.meta.env.VITE_API_PORT}/api`;

type NavItem = {
  name: string;
  icon: React.ReactNode | string;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean, icon?: React.ReactNode | string; target?: string }[];
  pro?: boolean;
};

const navItems: NavItem[] = [
  // {
  //   icon: <GridIcon />,
  //   name: "Dashboard",
  //   subItems: [{ name: "Ecommerce", path: "/", pro: false }],
  // },
  {
    icon: <CalenderIcon />,
    name: "Calendar",
    path: "/calendar",
  },
  // {
  //   icon: <UserCircleIcon />,
  //   name: "User Profile",
  //   path: "/profile",
  // },
  // {
  //   name: "Forms",
  //   icon: <ListIcon />,
  //   subItems: [{ name: "Form Elements", path: "/form-elements", pro: false }],
  // },
  // {
  //   name: "Tables",
  //   icon: <TableIcon />,
  //   subItems: [{ name: "Basic Tables", path: "/basic-tables", pro: false }],
  // },
  // {
  //   name: "Pages",
  //   icon: <PageIcon />,
  //   subItems: [
  //     { name: "Blank Page", path: "/blank", pro: false },
  //     { name: "404 Error", path: "/error-404", pro: false },
  //   ],
  // },
];

const administratorItems: NavItem[] = [
  {
    icon: <PlugInIcon />,
    name: "Access & Role",
    subItems: [
      { name: "User", path: "/user", icon: <UserCircleIcon />, pro: false },
      { name: "Group", path: "/group", icon: <GroupIcon />, pro: false },
      { name: "Tenant*", path: "/client", icon: <BoxIcon />, pro: false },
    ],
  },
  {
    icon: <GridIcon />,
    name: "Configuration",
    path: "/configuration",
  },
  {
    icon: <BoxCubeIcon />,
    name: "Module",
    path: "/module",
  },
  {
    icon: <GridIcon />,
    name: "Dev Console Check",
    path: "/dev-console-check",
    pro: true,
  },
  // {
  //   icon: <PieChartIcon />,
  //   name: "Charts",
  //   subItems: [
  //     { name: "Line Chart", path: "/line-chart", pro: false },
  //     { name: "Bar Chart", path: "/bar-chart", pro: false },
  //   ],
  // },
  // {
  //   icon: <BoxCubeIcon />,
  //   name: "UI Elements",
  //   subItems: [
  //     { name: "Alerts", path: "/alerts", pro: false },
  //     { name: "Avatar", path: "/avatars", pro: false },
  //     { name: "Badge", path: "/badge", pro: false },
  //     { name: "Buttons", path: "/buttons", pro: false },
  //     { name: "Images", path: "/images", pro: false },
  //     { name: "Videos", path: "/videos", pro: false },
  //   ],
  // },
  // {
  //   icon: <PlugInIcon />,
  //   name: "Authentication",
  //   subItems: [
  //     { name: "Sign In", path: "/signin", pro: false },
  //     { name: "Sign Up", path: "/signup", pro: false },
  //   ],
  // },
];

const developerItems: NavItem[] = [
  {
    icon: <PlugInIcon />,
    name: "UI Example",
    subItems: [
      { name: "Default Blank Page", path: "/blank", pro: false },
      { name: "Form Elements", path: "/form-elements", pro: false },
      { name: "Basic Tables", path: "/basic-tables", pro: false },
      { name: "Alert", path: "/alerts", pro: false },
      { name: "Avatars", path: "/avatars", pro: false },
      { name: "Badge", path: "/badge", pro: false },
      { name: "Buttons", path: "/buttons", pro: false },
      { name: "Images", path: "/images", pro: false },
      { name: "Videos", path: "/videos", pro: false },

      { name: "Line Chart", path: "/line-chart", pro: false },
      { name: "Bar Chart", path: "/bar-chart", pro: false },

    ],
  },
];

let othersItems: NavItem[] = [
  {
    icon: <DocsIcon />,
    name: "Documentation",
    subItems: [
      { name: "API Documentation", path: import.meta.env.VITE_API_URL + "/../docs", pro: false, target: "_blank" },
      { name: "Repository", path: "https://github.com/luridarmawan/dashboard-ai-boilerplate", pro: false, icon: <FaGithub />, target: "_blank" },
      { name: "Report Issue", path: "https://github.com/luridarmawan/dashboard-ai-boilerplate/issues/new", pro: false, icon: <FaGithub />, target: "_blank" },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, toggleMobileSidebar } = useSidebar();
  const { token } = useAuth();
  const location = useLocation();
  const { isPermissionLoaded, hasPermission } = usePermission();
  const { selectedClient } = useClient();
  const [moduleItems, setModuleItems] = useState<NavItem[]>([]);

  // Load initial state from localStorage
  const loadOpenSubmenuFromStorage = (): {
    type: "main" | "admin" | "others" | "developers" | "module";
    index: number;
  } | null => {
    try {
      const stored = localStorage.getItem('sidebar-open-submenu');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "admin" | "others" | "developers" | "module";
    index: number;
  } | null>(loadOpenSubmenuFromStorage);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const [showConversationList, setShowConversationList] = useState<boolean>(true);
  const [showDeveloperMenu, setShowDeveloperMenu] = useState<boolean>(false);
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => location.pathname === path;
  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    let matchedSubmenu: { type: "main" | "admin" | "others" | "developers" | "module"; index: number } | null = null;

    ["main", "admin", "others", "developers", "module"].forEach((menuType) => {
      const items = menuType === "main" ? navItems
        : menuType === "admin" ? administratorItems
          : menuType === "developers" ? developerItems
            : menuType === "module" ? moduleItems
              : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              matchedSubmenu = {
                type: menuType as "main" | "admin" | "others" | "developers" | "module",
                index,
              };
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (submenuMatched && matchedSubmenu) {
      setOpenSubmenu(matchedSubmenu);
      // Save to localStorage when auto-opening based on active path
      try {
        localStorage.setItem('sidebar-open-submenu', JSON.stringify(matchedSubmenu));
      } catch (error) {
        console.error('Error saving submenu state to localStorage:', error);
      }
    } else if (!submenuMatched) {
      // Only clear if no active path matches and no stored state should be preserved
      const storedState = loadOpenSubmenuFromStorage();
      if (!storedState) {
        setOpenSubmenu(null);
      }
    }
  }, [location, isActive, moduleItems]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  // Fetch configuration for showing conversation list
  useEffect(() => {
    const fetchShowConversationConfig = async () => {
      if (token) {
        try {
          const showConversationTopicList = await getConfigurationAsBoolean('general.show_conversation_list', true, token);
          setShowConversationList(showConversationTopicList);
        } catch (error) {
          console.error('Error fetching conversation list configuration:', error);
          setShowConversationList(true); // Default to true on error
        }
      }
    };

    const fetchDeveloperMenuConfig = async () => {
      if (token) {
        try {
          const showDeveloperMenu = await getConfigurationAsBoolean('developer.mode', false, token);
          setShowDeveloperMenu(showDeveloperMenu);
        } catch (error) {
          console.error('Error fetching developer menu configuration:', error);
          setShowDeveloperMenu(false); // Default to false on error
        }
      }
    };

    const fecthModuleMenuConfig = async () => {
      if (token && selectedClient) {
        setXFetchContext({
          token,
          selectedClient,
        });

        const url = new URL(`${API_BASE_URL}/menu`);
        const response = await xfetch(url.toString(), {});
        const moduleMenus = await response.json();
        if (moduleMenus?.data?.menus) {
          setModuleItems(moduleMenus?.data?.menus);
        }
      }
    };

    fetchShowConversationConfig();
    fetchDeveloperMenuConfig();
    fecthModuleMenuConfig();
  }, [token, selectedClient]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "admin" | "others" | "developers" | "module") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      const newState = (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) ? null : { type: menuType, index };

      // Save to localStorage
      try {
        if (newState) {
          localStorage.setItem('sidebar-open-submenu', JSON.stringify(newState));
        } else {
          localStorage.removeItem('sidebar-open-submenu');
        }
      } catch (error) {
        console.error('Error saving submenu state to localStorage:', error);
      }

      return newState;
    });
  };

  const handleMenuClick = () => {
    // Close mobile sidebar when menu item is clicked
    if (isMobileOpen) {
      toggleMobileSidebar();
    }
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "admin" | "others" | "developers" | "module") => (
    <ul className="flex flex-col gap-2">
      {items.map((nav, index) => (
        <li key={nav.name} className="menu-group">
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${openSubmenu?.type === menuType && openSubmenu?.index === index
                ? "menu-item-active"
                : "menu-item-inactive"
                } cursor-pointer ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
                }`}
            >
              <span
                className={`menu-item-icon-size  ${openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-icon-active"
                  : "menu-item-icon-inactive"
                  }`}
              >
                {renderIcon(nav.icon)}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                    ? "rotate-180 text-brand-500"
                    : ""
                    }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                onClick={handleMenuClick}
                className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  }`}
              >
                <span
                  className={`menu-item-icon-size ${isActive(nav.path)
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                    }`}
                >
                  {renderIcon(nav.icon)}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
                  {nav.pro && (
                    <span className="ml-auto text-xxs menu-dropdown-badge menu-dropdown-badge-active">
                      pro
                    </span>
                  )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-1 space-y-1 ml-5">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name} className="submenu-item">
                    <Link
                      to={subItem.path}
                      target={subItem.target}
                      onClick={handleMenuClick}
                      className={`menu-dropdown-item ${isActive(subItem.path)
                        ? "menu-dropdown-item-active"
                        : "menu-dropdown-item-inactive"
                        }`}
                    >
                      {subItem.icon && <span className="submenu-icon">{renderIcon(subItem.icon)}</span>}
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto text-xxs ${isActive(subItem.path)
                              ? "menu-dropdown-badge-active"
                              : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge`}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto text-xxs ${isActive(subItem.path)
                              ? "menu-dropdown-badge-active"
                              : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge`}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      id="sidebar-left"
      className={`fixed mt-14 flex flex-col lg:mt-0 top-0 px-2 pb-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200
        ${isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[65px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`logo-container py-4 hidden md:flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-center"
          }`}
      >
        <Link to="/" onClick={handleMenuClick} className="logo-header go-home">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="logo dark:hidden"
                src={import.meta.env.VITE_APP_LOGO || "/images/logo/custom-logo.png"}
                alt="Logo"
                width={150}
                height={40}
              />
              <img
                className="logo logo-dark hidden dark:block"
                src={import.meta.env.VITE_APP_LOGO_DARK || "/images/logo/custom-logo-dark.png"}
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <img
              className="logo"
              src={import.meta.env.VITE_APP_ICON || "/images/logo/logo-icon.png"}
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col flex-1 overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>
            {moduleItems.length > 0 && renderMenuItems(moduleItems, "module")
            }
            {isPermissionLoaded && hasPermission('configuration', 'read') && (
              <div className="">
                <h2
                  className={`mb-2 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                    }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    "Administrator"
                  ) : (
                    <HorizontaLDots />
                  )}
                </h2>
                {renderMenuItems(administratorItems, "admin")}
              </div>
            )}
            {showConversationList && (
              <div className="sidebar-chat-list">
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                    }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    "Chats"
                  ) : (
                    <HorizontaLDots />
                  )}
                </h2>
                <SidebarChatTopicList />
              </div>
            )}



            {/* ADD YOUR MENU HERE */}



            <div className="">
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Others"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {showDeveloperMenu && renderMenuItems(developerItems, "developers")}
              {renderMenuItems(othersItems, "others")}
            </div>
          </div>
        </nav>
        {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null}
        {isMobileOpen ? <SidebarFooter /> : null}
      </div>
      {isExpanded || isHovered ? <SidebarFooter /> : null}
    </aside>
  );
};

export default AppSidebar;

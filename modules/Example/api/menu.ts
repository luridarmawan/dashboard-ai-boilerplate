
type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean, icon?: React.ReactNode; target?: string }[];
  pro?: boolean;
};

const menuItems: NavItem[] = [
  {
    name: "Example",
    icon: "bookmark",
    subItems: [
      { name: "Example Page", path: "/example", icon: "info" },
      { name: "Lazy Load", path: "/example-lazy", icon: "info" },
    ],
  },
];

const getMenu = async (_client_id: string): Promise<object> => {
  return menuItems
}

export default getMenu;


type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean, icon?: React.ReactNode; target?: string }[];
  pro?: boolean;
};

const menuItems: NavItem[] = [
  {
    name: "Account",
    icon: "list",
    subItems: [
      { name: "Expenses", path: "/expense", icon: "envelope" },
    ],
  },
];

const getMenu = async (_client_id: string): Promise<object> => {
  return menuItems
}

export default getMenu;

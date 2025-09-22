
type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean, icon?: React.ReactNode; target?: string }[];
  pro?: boolean;
};

const menuItems: NavItem[] = [
  {
    name: "Data Studio",
    icon: "cube",
    subItems: [
      { name: "Explorer", path: "/explorer", icon: "folder" },
      { name: "OCR Tester", path: "/ocr-tester", icon: "page" },
    ],
  },
];

const getMenu = async (_client_id: string): Promise<object> => {
  return menuItems
}

export default getMenu;

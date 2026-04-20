// src/types/menu.ts
export interface MenuItem {
  title: string;
  url: string;
  order: number;
  children: MenuItem[];
}

export interface FooterMenu {
  name: string;
  slug: string;
  items: MenuItem[];
}

export interface FooterMenuData {
  company: FooterMenu | null;
  myAccount: FooterMenu | null;
  helpSupport: FooterMenu | null;
  legal: FooterMenu | null;
}

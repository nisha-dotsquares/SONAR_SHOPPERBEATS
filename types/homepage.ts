export interface BannerItemContent {
  image: string;
  title: string;
  cta_link: string;
  cta_text: string;
  subtitle: string;
}

export interface BannerConfigItem {
  content: BannerItemContent[];
}

export interface TopCategoryItem {
  id: string;
  image: string;
  title: string;
  slug: string;
}

export interface PromoBannerConfig {
  to: string;
  from: string;
  image: string;
  themeBtn: {
    "bg-color": string;
    "text-color": string;
  };
  themeTimer: {
    "bg-color": string;
    "text-color": string;
  };
  timer: boolean;
  title: string;
  cta_link: string;
}

export interface HomepageSection {
  type: string;
  title: string | null;
  position: number;
  is_active: boolean;
  config: {
    items?: BannerConfigItem[] | TopCategoryItem[];
  } | PromoBannerConfig;
  start_at: string | null;
  end_at: string | null;
  id: number;
  created_at: string;
  updated_at: string;
}

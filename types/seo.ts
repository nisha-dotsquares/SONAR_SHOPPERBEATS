export interface MetaInfo {
  title?: string;
  description?: string;
  keywords?: string;
  canonical_url?: string;
  og_image?: string[];
  og_title?: string;
  twitter_cards_site?: string;
  twitter_cards_title?: string;
  twitter_cards_type?: string;
  robots?: string;
  ga4?: string;
  gtm?: string;
  code_container?: {
    head?: string;
    body?: string;
  };
}

export interface ProductSEO {
  page_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  canonical_url?: string;
  url_handle?: string;
}
import Categories from "./Categories";
import Banner from "./Banner";
import TrendingDeals from "./TrendingDeals";
import PromoBanner from "./PromoBanner";
import BestSellers from "./BestSellers";
import CustomerReviewsHome from "./CustomerReviewsHome";
import "../../styles/Home.css";
import Banner2 from "./Banner2";
import Banner1 from "./Banner1";
import TopDeals from "./DealBlock";
import TopRated from "./TopRated";
import PersonalizedSection from "./PersonalizedSection";
import RecentlyViewedSection from "./RecentlyViewedSection";
import { HomepageSection, BannerConfigItem, PromoBannerConfig } from "@/types/homepage";
import { Product } from "@/types/product";
import { Brand } from "@/types/product";

interface HomeProps {
  heroBanner: HomepageSection | null;
  topCategories: HomepageSection | null;
  bannerOne: HomepageSection | null;
  bannerTwo: HomepageSection | null;
  trendingDeals: Product[];
  brands: Brand[];
  topRated: Product[];
  bestSellers: Product[];
  personalized: Product[];
  customerReviews: BannerConfigItem[];
  recentlyViewed: Product[];
}

export default function Home({
  heroBanner,
  topCategories,
  bannerOne,
  bannerTwo,
  trendingDeals,
  brands,
  topRated,
  bestSellers,
  personalized,
  customerReviews,
  recentlyViewed,
}: HomeProps) {
  return (
    <main>
      <Banner heroBanner={heroBanner} />
      {topCategories && <Categories topCategoriesSection={topCategories} />}
      {trendingDeals.length > 0 && <TrendingDeals trendingDeals={trendingDeals} />}
      <TopDeals />
      {bannerOne ? <PromoBanner bannerData={bannerOne} /> : <Banner1 />}
      {bestSellers.length > 0 && <BestSellers bestSellers={bestSellers} />}
      {bannerTwo ? <PromoBanner bannerData={bannerTwo} /> : <Banner2 />}
      {topRated.length > 0 && <TopRated topRated={topRated} />}
      <PersonalizedSection personalized={personalized} />
      <RecentlyViewedSection recentlyViewed={recentlyViewed} />
    </main>
  );
}

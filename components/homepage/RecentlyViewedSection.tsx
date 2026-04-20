"use client";

import RecentlyViewed from "./RecentlyViewed";
import { Product } from "@/types/product";

export default function RecentlyViewedSection({ recentlyViewed }: { recentlyViewed: Product[] }) {
  if (!recentlyViewed || recentlyViewed.length === 0) return null;
  return <RecentlyViewed recentlyViewed={recentlyViewed} />;
}

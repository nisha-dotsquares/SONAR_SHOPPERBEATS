"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import Personalized from "./Personalized";
import { Product } from "@/types/product";

export default function PersonalizedSection({ personalized }: { personalized: Product[] }) {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  if (!isAuthenticated || personalized.length === 0) return null;
  return <Personalized personalized={personalized} />;
}

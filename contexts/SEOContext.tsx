"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { MetaInfo } from "@/types/seo";

interface SEOContextType {
  metadata: MetaInfo;
  updateMetadata: (newMetadata: Partial<MetaInfo>) => void;
}

const SEOContext = createContext<SEOContextType | undefined>(undefined);

export const useSEO = () => {
  const context = useContext(SEOContext);
  if (!context) {
    throw new Error("useSEO must be used within SEOProvider");
  }
  return context;
};

export const SEOProvider = ({ children }: { children: ReactNode }) => {
  const [metadata, setMetadata] = useState<MetaInfo>({
    title: "ShopperBeats",
    description:
      "Shop premium furniture, stylish home decor, and quality living essentials at ShopperBeats.",
    robots: "index, follow",
  });


  const updateMetadata = useCallback(
    (newMetadata: Partial<MetaInfo>) => {
      setMetadata((prev) => ({ ...prev, ...newMetadata }));
    },
    []
  );


  const value = useMemo(
    () => ({ metadata, updateMetadata }),
    [metadata, updateMetadata]
  );

  return <SEOContext.Provider value={value}>{children}</SEOContext.Provider>;
};

"use client";

import React from "react";
import CountdownTimer from "../ui/CountdownTimer";
import { HomepageSection, PromoBannerConfig } from "@/types/homepage";

interface PromoBannerProps {
  bannerData: HomepageSection | undefined;
}

export default function PromoBanner({ bannerData }: PromoBannerProps) {
  if (!bannerData) return null;

  const config = bannerData.config as PromoBannerConfig;

  return (
    <div className="mt-15 mb-70">
      <div className="container">
        <div
          className="dflex no-wrap sale-banner-bg"
          style={{
            backgroundImage: `url(${config.image})`,
          }}
        >
          {/* Center countdown */}
          {config.timer && config.to && (
            <div className="banner-center">
              <CountdownTimer
                from={config.from}
                to={config.to}
                bgColor={config.themeTimer?.["bg-color"] || (config.themeTimer as Record<string, string>)?.["bg_color"] || undefined}
                textColor={config.themeTimer?.["text-color"] || (config.themeTimer as Record<string, string>)?.["text_color"] || undefined}
              />
            </div>
          )}

          {/* Right aligned button */}
          <div className="sale-btn banner-right">
            <a
              href={config.cta_link}
              className="btn btn-white"
              style={{
                backgroundColor: config.themeBtn?.["bg-color"] || (config.themeBtn as Record<string, string>)?.["bg_color"] || undefined,
                color: config.themeBtn?.["text-color"] || (config.themeBtn as Record<string, string>)?.["text_color"] || undefined,
              }}
            >
              {config.title}
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}

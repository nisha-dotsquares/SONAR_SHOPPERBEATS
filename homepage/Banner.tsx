"use client";

import React from "react";
import ReusableSlider from "../ui/ReusableSlider";
import Link from "next/link";
import { HomepageSection, BannerItemContent } from "@/types/homepage";

interface SlideItem {
  img: string;
  subtitle: string;
  title: string;
  buttonText: string;
  cta_link: string;
}

interface BannerProps {
  heroBanner: HomepageSection | null;
}


export default function Banner({ heroBanner }: BannerProps) {

  const getSlides = (itemIndex: number): SlideItem[] => {
    if (!heroBanner || !heroBanner.config || !('items' in heroBanner.config) || !heroBanner.config.items || !heroBanner.config.items[itemIndex]) {
      return [];
    }
    const item = heroBanner.config.items[itemIndex];
    if ('content' in item && item.content) {
      return item.content.map(
        (contentItem: BannerItemContent) => ({
          img: contentItem.image,
          subtitle: contentItem.subtitle,
          title: contentItem.title,
          buttonText: contentItem.cta_text,
          cta_link: contentItem.cta_link,
        })
      );
    }
    return [];
  };

  const leftSlides: SlideItem[] = getSlides(0);
  const secondLeftSlides: SlideItem[] = getSlides(1);
  const rightTopSlides: SlideItem[] = getSlides(2);
  const rightBottomSlides: SlideItem[] = getSlides(3);
  return (
    <div className="banner mb-70">
      <div className="container">
        <div className="dflex">
          {/* LEFT MAIN SLIDER */}
          {leftSlides.length > 0 && (
            <div className="slide">
              <ReusableSlider
                items={leftSlides}
                effect="fade"
                slidesToShow={1}
                speed={500}
                autoplaySpeed={2000}
                arrows={false}
                infinite={true}
                pauseOnHover={false}
                renderItem={(item) => (
                  <>
                    <img src={item.img} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'fill' }} />
                    <div className="banner-content">
                      <div className="subtitle textwhite">{item.subtitle}</div>
                      <h2 className="textwhite">{item.title}</h2>
                      <Link href={item.cta_link} className="btn btn-white">
                        {item.buttonText}
                      </Link>
                    </div>
                  </>
                )}
              />
            </div>
          )}
          {secondLeftSlides.length > 0 && (
            <div className="slidee slide-2">
              <ReusableSlider
                items={secondLeftSlides}
                effect="fade"
                slidesToShow={1}
                speed={500}
                autoplaySpeed={2000}
                arrows={false}
                infinite={true}
                pauseOnHover={false}
                renderItem={(item) => (
                  <div className="right-slide">
                    <img src={item.img} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'fill' }} />
                    <div className="banner-content">
                      <div className="subtitle textwhite">{item.subtitle}</div>
                      <h2 className="textwhite">{item.title}</h2>
                      <Link href={item.cta_link} className="btn btn-white">
                        {item.buttonText}
                      </Link>
                    </div>
                  </div>
                )}
              />
            </div>
          )}
          {/* RIGHT SLIDER (2 stacked slides) */}
          {(rightTopSlides.length > 0 || rightBottomSlides.length > 0) && (
            <div className="slide3 slide-right">
              {rightTopSlides.length > 0 && (
                <div className="slide-right-inner">
                  <ReusableSlider
                    items={rightTopSlides}
                    effect="fade"
                    slidesToShow={1}
                    speed={500}
                    autoplaySpeed={2000}
                    arrows={false}
                    infinite={true}
                    pauseOnHover={false}
                    renderItem={(item) => (
                      <div className="right-slide">
                        <img src={item.img} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'fill' }} />
                        <div className="banner-content">
                          <div className="subtitle textwhite">{item.subtitle}</div>
                          <h2 className="textwhite">{item.title}</h2>
                          <Link href={item.cta_link} className="btn btn-white">
                            {item.buttonText}
                          </Link>
                        </div>
                      </div>
                    )}
                  />
                </div>
              )}
              {rightBottomSlides.length > 0 && (
                <div className="slide-right-inner">
                  <ReusableSlider
                    items={rightBottomSlides}
                    effect="fade"
                    slidesToShow={1}
                    speed={500}
                    autoplaySpeed={2000}
                    arrows={false}
                    infinite={true}
                    pauseOnHover={false}
                    renderItem={(item) => (
                      <div className="right-slide">
                        <img src={item.img} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'fill' }} />
                        <div className="banner-content">
                          <div className="subtitle textwhite">{item.subtitle}</div>
                          <h2 className="textwhite">{item.title}</h2>
                          <Link href={item.cta_link} className="btn btn-white">
                            {item.buttonText}
                          </Link>
                        </div>
                      </div>
                    )}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

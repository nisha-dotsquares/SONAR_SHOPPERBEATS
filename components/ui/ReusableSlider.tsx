import React, { useRef, useImperativeHandle, forwardRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { Autoplay, EffectFade, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/navigation";

interface ReusableSliderProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  effect?: "slide" | "fade";
  slidesToShow?: number;
  speed?: number;
  autoplaySpeed?: number;
  infinite?: boolean;
  arrows?: boolean;
  pauseOnHover?: boolean;
  centered?: boolean;
  gap?: number;
  slidesToScroll?: number;
  orientation?: "horizontal" | "vertical";
  onSlideChange?: (currentIndex: number, currentItem: T) => void;
  keyExtractor?: (item: T, index: number) => string | number;
}

export interface ReusableSliderRef {
  goToSlide: (index: number) => void;
}

function SliderComponent<T>(
  {
    items,
    renderItem,
    effect = "slide",
    slidesToShow = 5,
    speed = 600,
    autoplaySpeed = 0,
    infinite = true,
    pauseOnHover = true,
    gap = 0,
    orientation = "horizontal",
    onSlideChange,
    keyExtractor,
  }: ReusableSliderProps<T>,
  ref: React.Ref<ReusableSliderRef>
) {
  const swiperRef = useRef<SwiperType | null>(null);
  const modules = [Navigation];

  if (effect === "fade") modules.push(EffectFade);

  const itemsToRender = items.length > 0 ? [...items] : [];

  if (autoplaySpeed > 0) {
    modules.push(Autoplay);
  }

  useImperativeHandle(ref, () => ({
    goToSlide: (index: number) => {
      swiperRef.current?.slideToLoop(index, 0);
    },
  }));

  const isLoopEnabled = infinite && items.length >= slidesToShow;

  return (
    <Swiper
      observer={true}
      observeParents={true}
      watchSlidesProgress={true}
      modules={modules}
      effect={effect}
      slidesPerView={effect === "fade" ? 1 : slidesToShow}
      centeredSlides={false}
      spaceBetween={gap}
      slidesPerGroup={1}
      loop={isLoopEnabled}
      navigation={effect !== "fade"}
      speed={speed}
      mousewheel={false}
      freeMode={false}
      autoplay={
        autoplaySpeed > 0
          ? {
            delay: autoplaySpeed,
            disableOnInteraction: false,
          }
          : false
      }
      onSlideChange={(swiper) => {
        const currentIndex = swiper.realIndex;
        const currentItem = items[currentIndex];

        if (onSlideChange) onSlideChange(currentIndex, currentItem);
      }}
      onSwiper={(swiper) => {
        swiperRef.current = swiper;
        if (pauseOnHover && swiper.autoplay) {
          swiper.el.addEventListener("mouseenter", () => {
            if (swiper?.autoplay?.stop) swiper.autoplay.stop();
          });

          swiper.el.addEventListener("mouseleave", () => {
            if (swiper?.autoplay?.start) swiper.autoplay.start();
          });
        }
      }}
      allowTouchMove={true}
      className={`reusable-swiper ${orientation === "vertical" ? "swiper-vertical-fixed-height" : ""
        }`}
      direction={orientation}
      style={{ display: "flex", overflow: "hidden" }} // Pre-init layout
      breakpoints={{
        1536: { slidesPerView: effect === "fade" ? 1 : slidesToShow },
        1280: {
          slidesPerView: effect === "fade" ? 1 : Math.min(slidesToShow, 5),
        },
        1024: {
          slidesPerView: effect === "fade" ? 1 : Math.min(slidesToShow, 4),
        },
        900: { slidesPerView: effect === "fade" ? 1 : Math.min(slidesToShow, 3) },
        768: { slidesPerView: effect === "fade" ? 1 : Math.min(slidesToShow, 2) },
        640: { slidesPerView: effect === "fade" ? 1 : Math.min(slidesToShow, 2) },
        480: { slidesPerView: 1 },
        360: { slidesPerView: 1 },
      }}
    >
      {itemsToRender.map((item, index) => {
        const itemKey = keyExtractor 
          ? keyExtractor(item, index) 
          : (item as any).id || (item as any)._id || (item as any).slug || (item as any).url || index;
          
        return (
          <SwiperSlide
            key={itemKey}
            style={{
              width: effect === "fade" ? "100%" : `calc((100% - ${(slidesToShow - 1) * gap}px) / ${slidesToShow})`,
              flexShrink: 0
            }}
          >
            {renderItem(item, index)}
          </SwiperSlide>
        );
      })}
    </Swiper>
  );
}

export default forwardRef(SliderComponent) as <T>(
  props: ReusableSliderProps<T> & { ref?: React.Ref<ReusableSliderRef> }
) => React.ReactElement;


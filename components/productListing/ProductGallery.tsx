import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import ReusableSlider, { ReusableSliderRef } from "@/components/ui/ReusableSlider";
import { Product, ProductImage, Variant } from "@/types/product";

const THUMBS_VISIBLE = 6;

interface ProductGalleryProps {
  product: Product;
  selectedVariant: Variant | null;
}

const defaultImageUrl = "/images/image-coming-soon.jpg";

const getYouTubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const isYouTubeUrl = (url: string): boolean => {
  return getYouTubeVideoId(url) !== null;
};

const ProductGallery: React.FC<ProductGalleryProps> = ({ product, selectedVariant }) => {
  const sliderRef = useRef<ReusableSliderRef>(null);

  // Function to get sorted images


  const getImages = (variantId?: string): ProductImage[] => {
    let images: ProductImage[] = [];

    //  Use variant images if variantId is provided
    if (variantId) {
      const variant = product?.variants?.find(v => v.id === variantId);
      if (variant?.images) {
        const variantImages = Array.isArray(variant.images) ? variant.images : [{ image_url: variant.images }];
        images = variantImages.map((img) =>
          typeof img === "string" ? { image_url: img, is_main: false } : img
        );
      }
    }

    //  If no images yet, use product images
    if (!images.length && product.images) {
      const productImages = Array.isArray(product.images) ? product.images : [{ image_url: product.images }];
      images = productImages.map((img) =>
        typeof img === "string" ? { image_url: img, is_main: false } : img
      );
    }

    //  If still empty, use default image
    if (!images.length) {
      images = [{ image_url: defaultImageUrl, is_main: true }];
    }

    //  Sort: images first, then videos, with is_main priority within each type
    images.sort((a, b) => {
      const aIsVideo = !!a.video_url && !a.image_url;
      const bIsVideo = !!b.video_url && !b.image_url;

      // Images first
      if (aIsVideo !== bIsVideo) {
        return aIsVideo ? 1 : -1;
      }

      //  Then sort by order
      const orderA = a.order ?? a.image_order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order ?? b.image_order ?? Number.MAX_SAFE_INTEGER;

      return orderA - orderB;
    });



    return images;
  };


  const initialImages = getImages(selectedVariant?.id);
  const initialMedia = initialImages[0]?.image_url || initialImages[0]?.video_url || defaultImageUrl;

  const [images, setImages] = useState<ProductImage[]>(initialImages);
  const [activeThumbnail, setActiveThumbnail] = useState<string>(initialMedia);
  const [mainImage, setMainImage] = useState<string>(initialMedia);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [thumbStart, setThumbStart] = useState(0);
  // Track loaded URLs — ref for sync reads, state to trigger re-renders
  const loadedUrlsRef = useRef<Set<string>>(new Set());
  const [, forceUpdate] = useState(0);

  const isLoaded = (url: string) => loadedUrlsRef.current.has(url);

  const markLoaded = useCallback((url: string) => {
    if (!loadedUrlsRef.current.has(url)) {
      loadedUrlsRef.current.add(url);
      forceUpdate(n => n + 1);
    }
  }, []);

  useEffect(() => {
    const updatedImages = getImages(selectedVariant?.id);
    setImages(updatedImages);
    const firstMedia = updatedImages[0]?.image_url || updatedImages[0]?.video_url || defaultImageUrl;
    setActiveThumbnail(firstMedia);
    setMainImage(firstMedia);
    setThumbStart(0);
  }, [selectedVariant, product]);

  // Pre-load all available images to browser cache to minimize shimmer flickering
  useEffect(() => {
    if (images.length > 0) {
      images.forEach((img) => {
        const url = img.image_url || img.video_url;
        if (url && !isYouTubeUrl(url) && !loadedUrlsRef.current.has(url)) {
          const preImg = new window.Image();
          preImg.src = url;
          preImg.onload = () => markLoaded(url);
        }
      });
    }
  }, [images, markLoaded]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePosition({ x, y });
  };

  const handleThumbnailClick = useCallback((mediaUrl: string, index: number) => {
    setActiveThumbnail(mediaUrl);
    setMainImage(mediaUrl);
    // No skeleton reset — if already loaded it stays loaded
    sliderRef.current?.goToSlide(index);
  }, []);

  const shimmerStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.4s infinite, fadeIn 0.4s 0.2s forwards', // Delay shimmer appearance by 200ms
    borderRadius: 4,
    zIndex: 1,
    opacity: 0, // Start hidden to prevent flicker
  };

  return (
    <>
      <div className="product-info-image dflex desktop-product-slider">
        <div className="thumbnail-slider-horizontal">
          {/* <ReusableSlider
            items={images}
            slidesToShow={1}
            ref={sliderRef}
            slidesToScroll={1}
            gap={0}
            infinite={true}
            speed={0}
            arrows={true}
            pauseOnHover={true}
            orientation="vertical"
            onSlideChange={(currentIndex, currentItem) => {
              const mediaUrl = currentItem?.image_url || currentItem?.video_url;
              if (mediaUrl && mediaUrl !== activeThumbnail) {
                handleThumbnailClick(mediaUrl, currentIndex);
              }
            }}
            renderItem={(item, index) => { */}
          {/* Up arrow */}
          <button
            className="thumb-arrow thumb-arrow-up"
            onClick={() => {
              const currentActiveIndex = images.findIndex(
                img => (img.image_url || img.video_url) === activeThumbnail
              );
              // Loop: if at first image, wrap to last
              const prevIndex = currentActiveIndex <= 0 ? images.length - 1 : currentActiveIndex - 1;
              const prevItem = images[prevIndex];
              const prevUrl = prevItem?.image_url || prevItem?.video_url || "";
              handleThumbnailClick(prevUrl, prevIndex);
              // Adjust window: if wrapped to last, show the end of the list
              setThumbStart(() => {
                if (currentActiveIndex <= 0) {
                  return Math.max(0, images.length - THUMBS_VISIBLE);
                }
                return Math.min(prevIndex, thumbStart);
              });
            }}
            aria-label="Scroll thumbnails up"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>

          {/* Visible 5 thumbnails */}
          <div className="thumbnail-list">
            {images.slice(thumbStart, thumbStart + THUMBS_VISIBLE).map((item, i) => {
              const originalIndex = thumbStart + i;
              const mediaUrl = item?.image_url || item?.video_url;
              const isActive = activeThumbnail === mediaUrl;
              return (
                <div
                  className={`thumbnail-img ${isActive ? "active-thumbnail" : ""}`}
                  key={mediaUrl}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleThumbnailClick(mediaUrl || "", originalIndex)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleThumbnailClick(mediaUrl || "", originalIndex);
                    }
                  }}
                >
                  {item?.video_url && !item?.image_url ? (
                    isYouTubeUrl(item.video_url) ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${getYouTubeVideoId(item.video_url)}`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="YouTube video player"
                        className={`${isActive ? "active-thumbnail" : ""}`}
                        width={100}
                        height={100}
                      ></iframe>
                    ) : (
                      <video
                        src={item.video_url}
                        className={`${isActive ? "active-thumbnail" : ""}`}
                        width={100}
                        height={100}
                        muted
                      />
                    )
                  ) : (
                    <>
                      {!isLoaded(item?.image_url || defaultImageUrl) && <div style={shimmerStyle} />}
                      <Image
                        src={item?.image_url || defaultImageUrl}
                        className={`${isActive ? "active-thumbnail" : ""}`}
                        alt={`thumbnail-${originalIndex}`}
                        width={100}
                        height={100}
                        onLoad={() => markLoaded(item?.image_url || defaultImageUrl)}
                        style={{ opacity: isLoaded(item?.image_url || defaultImageUrl) ? 1 : 0, transition: 'opacity 0.3s ease' }}
                      />
                    </>
                  )}
                </div>
              );
          //     }}
          // />
            })}
          </div>

          {/* Down arrow */}
          <button
            className="thumb-arrow thumb-arrow-down"
            onClick={() => {
              const currentActiveIndex = images.findIndex(
                img => (img.image_url || img.video_url) === activeThumbnail
              );
              // Loop: if at last image, wrap to first
              const nextIndex = currentActiveIndex >= images.length - 1 ? 0 : currentActiveIndex + 1;
              const nextItem = images[nextIndex];
              const nextUrl = nextItem?.image_url || nextItem?.video_url || "";
              handleThumbnailClick(nextUrl, nextIndex);
              // Adjust window: if wrapped to first, reset to top
              setThumbStart(() => {
                if (currentActiveIndex >= images.length - 1) {
                  return 0;
                }
                const maxStart = Math.max(0, images.length - THUMBS_VISIBLE);
                return Math.min(maxStart, nextIndex >= thumbStart + THUMBS_VISIBLE ? thumbStart + 1 : thumbStart);
              });
            }}
            aria-label="Scroll thumbnails down"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
        <div
          className="product-main-image"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onMouseMove={handleMouseMove}
          style={{ overflow: "hidden", position: "relative" }}
        >
          {mainImage && images.find(img => (img.image_url || img.video_url) === mainImage)?.video_url && !images.find(img => (img.image_url || img.video_url) === mainImage)?.image_url ? (
            isYouTubeUrl(mainImage) ? (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${getYouTubeVideoId(mainImage)}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="YouTube video player"
              ></iframe>
            ) : (
              <video
                src={mainImage}
                controls
                autoPlay
                muted
                loop
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  transform: isHovered ? "scale(1.1)" : "scale(1)",
                  transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                  transition: "transform 0.2s ease-out",
                }}
              />
            )
          ) : (
            <>
              {!isLoaded(mainImage || defaultImageUrl) && <div style={shimmerStyle} />}
              <Image
                src={mainImage || defaultImageUrl}
                alt={product.title || 'Product Image'}
                width={400}
                height={400}
                onLoad={() => markLoaded(mainImage || defaultImageUrl)}
                style={{
                  transform: isHovered ? "scale(1.5)" : "scale(1)",
                  transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                  transition: isLoaded(mainImage || defaultImageUrl) ? 'transform 0.2s ease-out' : 'none',
                  cursor: "zoom-in",
                  opacity: isLoaded(mainImage || defaultImageUrl) ? 1 : 0,
                }}
              />
            </>
          )}
        </div>
      </div>

      <div className="mobile-product-slider">
        <ReusableSlider
          ref={sliderRef}
          items={images}
          slidesToShow={1}
          slidesToScroll={1}
          gap={0}
          infinite={true}
          centered={true}
          speed={500}
          arrows={true}
          pauseOnHover={true}
          renderItem={(item,index) => (
            <div className="mobile-slider-item" key={item.image_url || item.video_url}>
              {item?.video_url && !item?.image_url ? (
                isYouTubeUrl(item.video_url) ? (
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${getYouTubeVideoId(item.video_url)}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="YouTube video player"
                    style={{
                      objectFit: "contain",
                    }}
                  ></iframe>
                ) : (
                  <video
                    src={item.video_url}
                    controls
                    autoPlay
                    muted
                    loop
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                )
              ) : (
                <>
                  {!isLoaded(item?.image_url || defaultImageUrl) && <div style={shimmerStyle} />}
                  <Image
                    src={item?.image_url || defaultImageUrl}
                    alt={`slide-${index}`}
                    width={400}
                    height={400}
                    onLoad={() => markLoaded(item?.image_url || defaultImageUrl)}
                    style={{ opacity: isLoaded(item?.image_url || defaultImageUrl) ? 1 : 0, transition: 'opacity 0.3s ease' }}
                  />
                </>
              )}
            </div>
          )}
        />
      </div>
    </>
  );
};

export default ProductGallery;



"use client";

import React from "react";
import Image from "next/image";
import ReviewCard from "./ReviewCard";
import { Review } from "@/types/product";


interface ReviewStats {
  average_rating: number;
  total_reviews: number;
}

interface ReviewPopupProps {
  reviews: Review[];
  reviewStats: ReviewStats | null;
  onClose: () => void;
}

export default function ReviewPopup({
  reviews,
  reviewStats,
  onClose,
}: ReviewPopupProps) {
  const renderStars = (rating: number | null | undefined) => {
    if (rating === null || rating === undefined) {
      return null;
    }
    const stars = Array.from({ length: rating }, (_, i) => {
      if (i < Math.floor(rating)) return "fa fa-star star filled";
      if (i < rating) return "fa fa-star-half-alt star filled";
      return "fa fa-star star";
    });
    return (
      <div className="rating">
        {stars.map((cls, idx) => (
          <i key={idx} className={cls}></i>
        ))}
      </div>
    );
  };

  return (
    <div id="popupModal" className="reviewmodal">
      <div className="modal-content">
        <button className="close" onClick={onClose} aria-label="Close modal">
          &times;
        </button>
        <h6>
         Overall Rating ({Math.round(reviewStats?.average_rating ?? 0)}/5)
        </h6>
        <div className="rating rating-all">
          {renderStars(reviewStats?.average_rating)}
        </div>
        <div className="reviewmodal-block py-30">
          <h6>Photos</h6>
          <div className="dflex">
            <Image
              src="/images/image-coming-soon.jpg"
              alt="Review photo"
              width={100}
              height={100}
            />
            <Image
              src="/images/image-coming-soon.jpg"
              alt="Review photo"
              width={100}
              height={100}
            />
            <Image
              src="/images/image-coming-soon.jpg"
              alt="Review photo"
              width={100}
              height={100}
            />
            <Image
              src="/images/image-coming-soon.jpg"
              alt="Review photo"
              width={100}
              height={100}
            />
            <Image
              src="/images/image-coming-soon.jpg"
              alt="Review photo"
              width={100}
              height={100}
            />
            <Image
              src="/images/image-coming-soon.jpg"
              alt="Review photo"
              width={100}
              height={100}
            />
          </div>
        </div>
        <div className="reviewmodal-block">
          <h6>Reviews</h6>
          <div className="grid-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

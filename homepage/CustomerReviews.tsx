"use client";

import ReusableSlider from "../ui/ReusableSlider";
import ReviewCard from "../ui/ReviewCard";
import { Review } from "@/types/product";
interface CustomerReviewsHomeProps {
  customerReviews: Review[];
}

export default function CustomerReviewsHome({ customerReviews }: CustomerReviewsHomeProps) {
  const reviews = customerReviews || [];

  return (
    <div className="reviews pt-70 pb-70">
      <div className="container">
        <div className="dflex justify-between mb-30 title-wrapper">
          <h2>Customer Reviews</h2>
          <a href="#" className="btn btn-white">
            See All
          </a>
        </div>

        {reviews.length > 0 && (
<ReusableSlider<Review>
  items={customerReviews}
  slidesToShow={4}
  slidesToScroll={1}
  infinite={false}
  arrows={true}
  gap={20}
  speed={0}
  pauseOnHover={true}
  renderItem={(review) => (
    <ReviewCard key={review.id} review={review} />
  )}
/>

        )}
      </div>
    </div>
  );
}

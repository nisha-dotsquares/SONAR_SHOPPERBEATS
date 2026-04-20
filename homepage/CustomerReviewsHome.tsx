
"use client";

import { Review } from "@/types/product";
import ReusableSlider from "../ui/ReusableSlider";
import ReviewCard from "../ui/ReviewCard";

interface RawReview {
  id?: string;
  product_id?: string;
  reviewer_name?: string;
  user?: string;
  rating?: string | number;
  comment?: string;
  review_text?: string;
  created_at?: string;
  review_date?: string;
}

export default function CustomerReviewsHome({ customerReviews }: { customerReviews: RawReview[] }) {
  const reviews: Review[] = customerReviews.map((review: RawReview) => ({
    id: review.id || review.product_id || crypto.randomUUID(),
    user: review.reviewer_name || review.user || "Anonymous",
    rating: Number(review.rating || 5),
    comment: review.comment || review.review_text || "",
    created_at: review.created_at || review.review_date || new Date().toISOString(),
    reviewer_name: review.reviewer_name || review.user || "Anonymous",
  }));

  return (
    <div className="reviews pb-70">
      <div className="container">
        <div className="dflex justify-between mb-30 title-wrapper">
          <h2>Customer Reviews</h2>
          {/* <a href="#" className="btn btn-white">
            See All
          </a> */}
        </div>

        <ReusableSlider
          items={reviews}
          slidesToShow={5}
          slidesToScroll={1}
          infinite={false}
          arrows={true}
          gap={20}
          speed={0}
          pauseOnHover={true}
          renderItem={(review: Review) => (
            <ReviewCard key={review.id} review={review} />
          )}
        />
      </div>
    </div>
  );
}

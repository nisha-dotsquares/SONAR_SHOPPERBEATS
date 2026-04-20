
import React from "react";
import ReusableSlider from "../ui/ReusableSlider";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import { Review } from "@/types/product"; 

const ReviewCard = ({ review }: { review: Review }) => {
  if (!review) {
    return null;
  }

  const { rating, comment, reviewer_name, created_at } = review;

  const stars = Array.from({ length: 5 }, (_, i) => {
    if (i < Math.floor(rating))
      return <FaStar key={i} className="star filled" />;
    if (i < rating) return <FaStarHalfAlt key={i} className="star filled" />;
    return <FaRegStar key={i} className="star" />;
  });

  return (
    <div className="review-card">
      <div className="review-header">
        <div className="rating">{stars}</div>
        <span className="review-date">
          {new Date(created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>

      <h4 className="review-title">{comment.substring(0, 20)}...</h4>
      <p className="review-text">{comment}</p>
      <p className="review-customer">{reviewer_name}</p>
    </div>
  );
};

export default ReviewCard;

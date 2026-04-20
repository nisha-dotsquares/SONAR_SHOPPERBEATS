"use client";

import { useState, ChangeEvent, use, useEffect } from "react";
import Button from "@/components/ui/Button";
import { useSearchParams, useRouter } from "next/navigation";
import { useGetOrderByIdQuery, useAddReviewMutation } from "@/lib/redux/apis/orderApi";
import { useUploadAnyImageMutation } from "@/lib/redux/apis/productsApi";
import { useGetUserDetailsQuery } from "@/lib/redux/apis/authApi";
import { toast } from "react-toastify";
import Loader from "@/components/ui/loaders/Loader";
import { getImageUrl } from "@/lib/utils/imageUtils";

interface ReviewData {
  images: File[];
  rating: number;
  headline: string;
  comments: string;
}

interface ReviewFormProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default function ReviewForm({ params }: ReviewFormProps) {
  const { orderId } = use(params);
  const searchParams = useSearchParams();
  const productId = searchParams.get("product_id");
  const router = useRouter();

  const { data: order, isLoading: isOrderLoading } = useGetOrderByIdQuery(orderId);
  const { data: userDetails } = useGetUserDetailsQuery(undefined);
  const [addReview, { isLoading: isSubmitting }] = useAddReviewMutation();
  const [uploadImage] = useUploadAnyImageMutation();

  const [images, setImages] = useState<File[]>([]);
  const [rating, setRating] = useState(0);
  const [reviewerName, setReviewerName] = useState("");
  const [headline, setHeadline] = useState("");
  const [comments, setComments] = useState("");

  // Pre-fill the name field with user details when they load
  useEffect(() => {
    if (userDetails?.response?.first_name) {
      setReviewerName(
        `${userDetails.response.first_name} ${userDetails.response.last_name || ""}`.trim()
      );
    }
  }, [userDetails]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setImages((prev) => [...prev, ...selectedFiles]);
      // Reset input value so the same file could be selected again if needed
      e.target.value = "";
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleStarClick = (value: number) => {
    setRating(value);
  };


  const handleSubmit = async () => {
    if (!productId) {
      toast.error("An unexpected error occurred. Please try again later.");
      return;
    }
    if (rating === 0) {
      toast.error("Please provide a rating.");
      return;
    }
    if (!headline.trim()) {
      toast.error("Please provide a review headline.");
      return;
    }
    if (!comments.trim()) {
      toast.error("Please provide comments.");
      return;
    }

    try {
      const uploadedImageUrls: string[] = [];

      // Upload each image one by one and collect their returned URLs
      if (images.length > 0) {
        for (const file of images) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("upload_type", "product");
          formData.append("media_type", "image");
          const uploadRes = await uploadImage(formData).unwrap();
          if (uploadRes?.image_url || uploadRes?.url) {
            uploadedImageUrls.push(uploadRes.image_url || uploadRes.url || "");
          }
        }
      }

      const submittedName = reviewerName.trim() || "Anonymous User";

      const payload = {
        reviewer_name: submittedName,
        rating: rating,
        comment: comments,
        product_id: productId,
        order_id: orderId,
        title: headline,
        images: uploadedImageUrls
      };

      await addReview(payload).unwrap();
      toast.success("Review submitted successfully!");

      // Reset form
      setImages([]);
      setRating(0);
      setHeadline("");
      setComments("");

      router.push(`/user/orders/${orderId}`);
    } catch (error) {
      console.error("Failed to submit review:", error);
      toast.error("Failed to submit review.");
    }
  };

  if (isOrderLoading) {
    return <Loader />;
  }

  const snapshotProducts = order?.order_details?.customer_snapshot?.products || [];
  const product = snapshotProducts.find((p) => p.product_id === productId);

  if (!product) {
    return <div>Product not found in this order.</div>;
  }

  return (
    <div className="">
      <h4 className="mb-30">Add Review</h4>

      <table className="cart-table">
        <thead className="visually-hidden">
          <tr>
            <th scope="col">Product Information</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="item-info">
              <img src={product.image} alt={product.name} />
              <div>
                <h3>{product.title || product.name}</h3>
                {product?.variant_attributes?.length > 0 ? (
                  product?.variant_attributes?.map((attr: { name: string; value: string }, i: number) => (
                    <p key={i}>
                      <strong>{attr.name}:</strong> {attr.value}
                    </p>
                  ))
                ) : (
                  <>
                    {product.size && (
                      <p className="product-size">
                        <strong>Size:</strong> {product.size}
                      </p>
                    )}
                    {product.color && (
                      <p className="product-color">
                        <strong>Colour:</strong> {product.color}
                      </p>
                    )}
                  </>
                )}
                <p className="product-color mt-2">
                  <strong>Quantity:</strong> {product.quantity}
                </p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="form-item mt-30">
        <div className="label-text" style={{ fontWeight: 600, marginBottom: "8px" }}>Add Image (Optional)</div>
        <label htmlFor="image-upload" className="upload-box">
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={handleFileChange}
          />
          <span className="plus">
            <img src="/images/profile/add.svg" alt="Add" />
          </span>
          <p>Add Images</p>
        </label>
        {images.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", marginTop: "15px" }}>
            {images.map((img, idx) => (
              <div key={idx} style={{ position: "relative" }}>
                <img
                  src={URL.createObjectURL(img)}
                  alt="preview"
                  style={{ width: "80px", height: "80px", objectFit: "contain", borderRadius: "8px", border: "1px solid #ddd" }}
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  style={{ position: "absolute", top: "-8px", right: "-8px", background: "red", color: "white", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "none" }}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="form-item">
        <div className="label-text" style={{ fontWeight: 600, marginBottom: "8px" }}>Overall Rating*</div>
        <div className="fa-stars">
          {[1, 2, 3, 4, 5].map((val) => (
            <i
              key={val}
              role="button"
              tabIndex={0}
              aria-label={`Rate ${val} stars`}
              className={`fa-star ${rating >= val ? "fa-solid" : "fa-regular"
                }`}
              onClick={() => handleStarClick(val)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleStarClick(val);
                }
              }}
              style={{ cursor: "pointer", marginRight: "5px" }}
            ></i>
          ))}
        </div>
      </div>

      <div className="form-item">
        <label htmlFor="reviewerName">Display Name*</label>
        <input
          id="reviewerName"
          type="text"
          placeholder="Enter your name..."
          value={reviewerName}
          onChange={(e) => setReviewerName(e.target.value)}
        />
      </div>

      <div className="form-item">
        <label htmlFor="headline">Review Headline*</label>
        <input
          id="headline"
          type="text"
          placeholder="What is best in this product..."
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
        />
      </div>

      <div className="form-item">
        <label htmlFor="comments">Comments*</label>
        <textarea
          id="comments"
          placeholder="How you use this product, things you like about it..."
          value={comments}
          onChange={(e) => setComments(e.target.value)}
        ></textarea>
      </div>

      <Button
        type="button"
        className="btn btn-red btn-filled btn-sharp w-100 mt-30"
        onClick={handleSubmit}
        isLoading={isSubmitting}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Submitting..." : "Submit Review"}
      </Button>
    </div>
  );
}

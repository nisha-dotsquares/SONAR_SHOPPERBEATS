import React from "react";
import { Product } from "@/types/product";

export const getDeliveryTabContent = (product: Product) => {
  const location = product?.ships_from_location;

  let estimatedDelivery = null;

  if (location === "USA" || location === "China") {
    estimatedDelivery = (
      <p>Orders shipped from outside Australia: 15–21 business days</p>
    );
  } else if (location === "SBAU" || location === "Local 3PL") {
    estimatedDelivery = (
      <p>Orders shipped from Australia: 10–12 business days</p>
    );
  }

  return (
    <>
      <h6>Delivery Information</h6>
      <p>
        We aim to process and dispatch all orders as quickly as possible.
        Delivery times may vary based on the shipping origin and destination.
      </p>
      <br/>

      <h6>Estimated Delivery Timeframes</h6>
      {estimatedDelivery}
<br/>
      <h6>Important Information</h6>
      <ul style={{listStyleType: "disc"}}>
        <li>
          1. Order processing time and the most accurate delivery estimates are
          displayed at checkout before you place your order.
        </li>
        <li>
          2. Delivery times are estimates and may vary due to customs clearance,
          courier delays, public holidays, or unforeseen circumstances.
        </li>
        <li>3. Tracking details will be provided once the order has been shipped.</li>
        <li>4. Remote locations may require additional delivery time.</li>
      </ul>
    </>
  );
};

export const warrantyAndReturnContent = (
  <>
    <h3>Return & Refund Policy:</h3>
    <p>
      We want you to shop with confidence and be completely satisfied with your
      purchase. If something isn’t right, our team is here to help.
      <br /><br />

      <b>1. Change of Mind Returns</b>
      <br />
      We accept change of mind returns within 14 days of receiving your order,
      provided that:
      <ul>
        <li>The item is unused, unopened, and in its original packaging</li>
        <li>All tags, labels, and accessories are intact</li>
        <li>
          Return postage is at the customer’s expense unless otherwise stated
        </li>
      </ul>

      <b>2. Faulty or Incorrect Items</b>
      <ul>
        <li>Contact us within 7 days of delivery</li>
        <li>Provide your order number and photos/videos</li>
        <li>
          Return shipping costs for faulty or incorrect items will be covered by
          us
        </li>
      </ul>

      <b>Non-returnable items:</b>
      <ul>
        <li>Personal care, beauty, and grooming items</li>
        <li>Intimate apparel</li>
        <li>Customised or personalised products</li>
        <li>Clearance or final sale items (unless faulty)</li>
      </ul>

      <b>Need Help?</b>
      <br />
      📧 cs@shopperbeats.com.au  
      <br />
      📞 +61 406 958 192
    </p>
  </>
);

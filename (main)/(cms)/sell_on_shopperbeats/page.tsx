"use client";

import { useState } from "react";
import Image from "next/image";

import "../../../../styles/sell.css";
import "../../../../styles/about.css";
import Sidebar from "@/components/ui/Sidebar";
import SellerSignupModal from "@/components/ui/SellerSignupModal";
import Link from "next/link";

const sidebarLinks = [
  { href: "#plan", label: "Choose a selling plan" },
  { href: "#verify", label: "Read the seller verification guide" },
  { href: "#growth", label: "Consider your growth strategy" },
  { href: "#account", label: "Create a seller account" },
];
 type SectionKey = typeof sidebarLinks[number]["label"];
export const sellSections: Record<SectionKey, {
  image: string;
  title: string;
  paragraphs: string[];
  button: string;
}> = {

  "Choose a selling plan": {
    image: "/images/cms/plan.png",
    title: "Choose a selling plan",
    paragraphs: [
      "Select a selling plan that matches your business goals and expected sales volume.",
      "Whether you're just getting started or scaling an established brand, Shopperbeats offers flexible plans designed to support your growth."
    ],
    button: "Compare Plans",
  },

  "Read the seller verification guide": {
    image: "/images/cms/verify.png",
    title: "Seller verification guide",
    paragraphs: [
      "Verification helps us maintain a secure and trusted marketplace for both sellers and customers.",
      "Complete the required documentation and KYC process to activate your seller account and begin listing products."
    ],
    button: "Read Guide",
  },

  "Consider your growth strategy": {
    image: "/images/cms/growth.png",
    title: "Growth strategy",
    paragraphs: [
      "Plan how you’ll position your products, price competitively, and optimize your listings for maximum visibility.",
      "Use data insights, promotions, and advertising tools to expand your reach and scale your business efficiently."
    ],
    button: "Learn More",
  },

  "Create a seller account": {
    image: "/images/cms/form.png",
    title: "Create your seller account",
    paragraphs: [
      "Register your business details and submit your application to join the Shopperbeats marketplace.",
      "Once approved, you can start listing products and reach customers across Australia and beyond."
    ],
    button: "Create Account",
  },
} as const;


export default function SellPage() {



const [active, setActive] = useState<SectionKey>("Choose a selling plan");
const [showModal, setShowModal] = useState(false);

  const section = sellSections[active];

  return (
    <>
      {/* Banner */}
      <div className="sell-banner">
        <div className="container">
          <div className="dflex items-center no-wrap">

            <div className="sell-left">
              <div className="sell-content">
                <h2>
                  How to start <br /> selling on Shopperbeats
                </h2>
              <p>
                Whether you’re already running a successful ecommerce store,
                brainstorming your next big product, or simply love the world of
                online selling, Shopperbeats is the perfect place to grow. Here’s
                how to move forward with confidence.
              </p>

                <Link href="#" className="btn btn-red btn-filled">
                  Read the Shopperbeats selling starter guide.
                </Link>
              </div>
            </div>

            <div className="sell-right">
              <Image
                src="/images/cms/sell-img.png"
                alt="Sell Banner"
                width={500}
                height={500}
              />
            </div>

          </div>
        </div>
      </div>

      {/* Main */}
      <div className="about-page pt-40 pb-70">
        <div className="container">
          <div className="dflex">

            {/* Sidebar */}
            <Sidebar links={sidebarLinks} active={active} onChange={setActive} />

            {/* Section Content */}
            <div className="about-section sell-section">
          
              <div className="about-content">
                <h4>{section.title}</h4>
                {section.paragraphs.map((text, idx) => (
                  <p key={idx}>{text}</p>
                ))}
               <button
                  className="btn btn-red btn-outline btn-rounded"
                  onClick={() => {
                    if (active === "Create a seller account") {
                      setShowModal(true);
                    }
                  }}
                >
                  {section.button}
                </button>

              </div>

                   <div className="about-img">
                <Image
                  src={section.image}
                  alt={active}
                  width={500}
                  height={500}
                />
              </div>

              

            </div>

          </div>
        </div>
      </div>

      {/* Background CTA */}
      <div className="sell-bg mb-70">
        <div className="container">
          <div className="sell-bg-content align-center">
            <h3>Start selling today</h3>
            <p>Reach millions of shoppers browsing every day.</p>
            <button className="btn btn-red btn-filled" onClick={()=>setShowModal(true)}>Sign up</button>
          </div>
        </div>
      </div>

      <SellerSignupModal show={showModal} onClose={() => setShowModal(false)} />

    </>
  );
}

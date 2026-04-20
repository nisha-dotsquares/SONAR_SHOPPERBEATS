"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Accordion from "@/components/ui/Accordion";
import Banner from "@/components/ui/Banner";
import ContactBanner from "@/components/ui/ContactBanner";
import { useGetFaqsQuery, FAQItem } from "@/lib/redux/apis/faqApi";
import Loader from "@/components/ui/loaders/Loader";

// Predefined grid section metadata mapping
const faqGridMeta: Record<string, { title: string; description: string; icon: string }> = {
  orders: {
    title: "My Orders",
    description: "Track orders, check delivery status, cancellations, and order history.",
    icon: "/images/cms/orders.svg",
  },
  contact: {
    title: "Contact Us",
    description: "Get in touch with our team for queries, feedback, or assistance.",
    icon: "/images/cms/contact.svg",
  },
  shipping: {
    title: "Shipping Information",
    description: "Learn about delivery timelines, shipping charges, and service areas.",
    icon: "/images/cms/shopping.svg",
  },
  support: {
    title: "Technical Support",
    description: "Facing issues? Get help with technical problems and troubleshooting.",
    icon: "/images/cms/technical.svg",
  },
  returns: {
    title: "Returns & Refunds",
    description: "Understand return policies, refund process, and replacement options.",
    icon: "/images/cms/return-refund.svg",
  },
  account: {
    title: "My Account",
    description: "Manage your profile, login details, password, and account settings.",
    icon: "/images/cms/accounts.svg",
  },
  payment: {
    title: "Payment & Checkout",
    description: "Explore payment options, billing issues, and checkout process.",
    icon: "/images/cms/billing.svg",
  },
  warranty: {
    title: "Warranty & Returns",
    description: "Check warranty coverage, claims process, and product support.",
    icon: "/images/cms/return-refund.svg",
  },
  general: {
    title: "General Inquiries",
    description: "Find answers to common questions about our services and policies.",
    icon: "/images/cms/accounts.svg",
  }
};

export default function FAQPage() {
  const [activeTab, setActiveTab] = useState<string>("");
  const { data: faqApiData, isLoading, isError } = useGetFaqsQuery();

  // Group FAQs by type
  const faqsByType = useMemo(() => {
    if (!faqApiData) return {};
    const grouped: Record<string, FAQItem[]> = {};
    faqApiData.forEach((item) => {
      const typeKey = (item.type || "general").toLowerCase();
      if (!grouped[typeKey]) {
        grouped[typeKey] = [];
      }
      grouped[typeKey].push(item);
    });
    // Sort items by order
    for (const key in grouped) {
      grouped[key].sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    return grouped;
  }, [faqApiData]);

  // Generate dynamic grid/tabs based on available types
  const dynamicTabs = useMemo(() => {
    return Object.keys(faqsByType).map(type => {
      const predefined = faqGridMeta[type];
      return {
        key: type,
        title: predefined ? predefined.title : type.charAt(0).toUpperCase() + type.slice(1),
        description: predefined ? predefined.description : `Questions about ${type}`,
        icon: predefined ? predefined.icon : "/images/cms/account.svg" // fallback icon always
      };
    });
  }, [faqsByType]);

  // Set initial active tab when data is loaded
  useEffect(() => {
    if (dynamicTabs.length > 0 && !activeTab) {
      setActiveTab(dynamicTabs[0].key);
    }
  }, [dynamicTabs, activeTab]);

if (isLoading) {
  return (
    <div className="text-center py-10">
      <Loader />
    </div>
  );
}
  return (
    <div className="faq-page">
      {/* Banner */}
      <Banner title="Frequently Asked Questions" image="/images/cms/faq.svg" />

      <div className="faq pt-40 pb-70">
        <div className="container">

          {isError && (
             <div className="text-center py-10 text-red-500">
             <p>Failed to load FAQs. Please try again later.</p>
           </div>
          )}

          {!isLoading && !isError && dynamicTabs.length === 0 && (
             <div className="text-center py-10">
               <p>No FAQs available at the moment.</p>
             </div>
          )}

          {/* 4-Grid Section */}
          {!isLoading && dynamicTabs.length > 0 && (
            <div className="grid-4">
              {dynamicTabs.map((grid) => (
                <button
                  key={grid.key}
                  type="button"
                  className={`bg-card py-30 ${activeTab === grid.key ? "active" : ""}`}
                  onClick={() => setActiveTab(grid.key)}
                  style={{ cursor: "pointer", display: "block", width: "100%", textAlign: "center" }}
                >
              <span className="flex justify-center mb-3">
                <span
                  className={`
                    w-14 h-14 flex items-center justify-center 
                    rounded-full bg-yellow-400 
                    shadow-md 
                    transition-all duration-200
                    group-hover:bg-yellow-500 group-hover:scale-105
                    ${activeTab === grid.key ? "bg-yellow-500" : ""}
                  `}
                >
                  <Image
                    src={grid.icon}
                    width={28}
                    height={28}
                    alt={grid.title}
                  />
                </span>
              </span>
                  <h6>{grid.title}</h6>
                  <p>{grid.description}</p>
                </button>
              ))}
            </div>
          )}

          {/* FAQ Accordion */}
          {!isLoading && activeTab && faqsByType[activeTab] && (
            <div className="mt-40">
              <Accordion
                items={faqsByType[activeTab].map((item: FAQItem, index: number) => ({
                  id: String(item.id),
                  title: item.question,
                  content: <p>{item.answer}</p>,
                }))}
                variation={2}
              />
            </div>
          )}
        </div>
      </div>

      <ContactBanner />
    </div>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { FaFacebookF, FaLinkedinIn, FaTiktok } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import Button from "./Button";
import ScrollToTopLink from "./ScrollToTopLink";
import { useSubscribeToMailingListMutation } from "@/lib/redux/apis/marketingApi";
import { useGetSocialMediaLinksQuery } from "@/lib/redux/apis/authApi";
import { useState } from "react";
import { toast } from "react-toastify";
import { MenuItem, FooterMenuData } from "@/types/menu";


const FOOTER_LINKS_STATIC = [
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/cms/About-us" },
      { label: "Sell On Shopperbeats", href: "/sell_on_shopperbeats" },
      { label: "Brands", href: "/brand" },
    ],
  },
  {
    title: "My Account",
    links: [
      { label: "Login", href: "/login" },
      { label: "Sign up", href: "/signup" },
      { label: "My Cart", href: "/cart" },
      { label: "Track My Order", href: "/cms/track" },
    ],
  },
  {
    title: "Help & Support",
    links: [
      { label: "My Orders", href: "/user/orders" },
      { label: "Shipping & Delivery", href: "/cms/shipping-delivery" },
      { label: "Return & Warranty", href: "/cms/return-refunds" },
      { label: "Shop With Peace Of Mind", href: "/cms/shop-with-peace" },
      { label: "Payment Policy", href: "/cms/payment-policy" },
      { label: "Contact Us", href: "/contact" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/cms/privacy-policy" },
      { label: "Terms & Conditions", href: "/cms/terms-condition" },
      { label: "Intellectual Property Complaints", href: "/cms/intellectual-property-complaints" },
    ],
  },
];


const SOCIAL_LINKS = [
  { icon: <FaFacebookF />, href: "#" },
  { icon: <FaLinkedinIn />, href: "#" },
  { icon: <FaTiktok />, href: "#" },
  { icon: <FaXTwitter />, href: "#" },
];

export default function Footer({ footerMenuData }: { footerMenuData: FooterMenuData }) {
  const [subscribeToMailingList, { isLoading: isSubscribing }] = useSubscribeToMailingListMutation();
  const { data: socialLinks } = useGetSocialMediaLinksQuery();
  const [email, setEmail] = useState("");

  const footerMenus = [
    { title: "Company", data: footerMenuData?.company },
    { title: "My Account", data: footerMenuData?.myAccount },
    { title: "Help & Support", data: footerMenuData?.helpSupport },
    { title: "Legal", data: footerMenuData?.legal },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      const result = await subscribeToMailingList({ email }).unwrap();
      const successMessage = result?.response?.response || result?.message || "Successfully subscribed to mailing list!";

      setEmail("");
      toast.success(successMessage);
    } catch (error) {
      const err = error as { data?: { response?: { response?: string }; message?: string } };
      const errorMessage = err?.data?.response?.response || err?.data?.message || "Failed to subscribe. Please try again.";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="page-footer">
      {/* Top Highlights Section */}
      <div className="shipping-steps bg-white py-40">
        <div className="container">
          <div className="dflex">
            {[
              { img: "free-shipping", text: "Fast & Limited Free Shipping" },
              { img: "customer", text: "Expert Customer Service" },
              { img: "peace-mind", text: "Shop With Peace of Mind" },
              { img: "incredible", text: "Incredible Value Every Day" },
            ].map((item) => (
              <div key={item.img} className="shipping-block">
                <div className="icon">
                  <Image
                    src={`/images/${item.img}.svg`}
                    alt={item.text}
                    width={60}
                    height={60}
                  />
                </div>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <footer>
        <div className="container">
          <div className="footer-wrapper">

            {/* Dynamic Footer Menus */}
            {footerMenus.map((section) => {
              const staticFallback = FOOTER_LINKS_STATIC.find(staticSection => staticSection.title === section.title);
              return (
                <div className="footer-block" key={section.title}>
                  <h5 className="textwhite mb-24">{section.title}</h5>
                  {(!section.data && staticFallback) ? (
                    <ul>
                      {staticFallback.links.map((link) => (
                        <li key={link.href}>
                          <ScrollToTopLink href={link.href}>{link.label}</ScrollToTopLink>
                        </li>
                      ))}
                    </ul>
                  ) : section.data?.items ? (
                    <ul>
                      {section.data.items.map((link: MenuItem) => (
                        <li key={link.url}>
                          <ScrollToTopLink href={link.url}>{link.title}</ScrollToTopLink>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            })}

            {/* Newsletter */}
            <div className="footer-block footer-newsletter">
              <h5 className="textwhite mb-24">JOIN OUR MAILING LIST</h5>
              <p>Enter your email to get $10 off and free shipping</p>

              <form onSubmit={handleSubmit}>
                <input type="email" name="email" placeholder="Your Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" aria-label="Subscribe" disabled={isSubscribing}>
                  <Image
                    src="/images/arrow-right.svg"
                    alt="Subscribe"
                    width={20}
                    height={20}
                  />
                </Button>
              </form>

              <ul className="social">
                {socialLinks?.map((item) => (
                  <li key={item.id}>
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      <i className={`fa-brands fa-${item.icon_class}`}></i>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="footer-copyright">
            <p>
              © 2026 Shopperbeats Pty Ltd (ABN 32 637 549 770). All Rights Reserved
            </p>

            <div className="payment">
              {["visa", "payment", "american", "paypal", "afterpay", "zip"].map(
                (item) => (
                  <Image
                    key={item}
                    src={`/images/${item}.svg`}
                    alt={item}
                    width={40}
                    height={25}
                  />
                )
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

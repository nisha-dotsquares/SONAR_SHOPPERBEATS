"use client";
import Banner from "@/components/ui/Banner";
import Sidebar from "@/components/ui/Sidebar";
import { usePathname, useRouter } from "next/navigation";
import { useGetUserDetailsQuery } from "../../../lib/redux/apis/authApi";
import { useSelector } from "react-redux";
import { RootState } from "../../../lib/redux/store";
import { useEffect } from "react";
import "../../../styles/account.css";
import Loader from "@/components/ui/loaders/Loader";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const { isLoading } = useGetUserDetailsQuery();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return <Loader />;
  }

  const sidebarLinks = [
    { href: "/user/personal-information", label: "Personal Information" },
    { href: "/user/orders", label: "My Orders" },
    { href: "/user/addresses", label: "Manage Address" },
    { href: "/user/wishlist", label: "Wishlist" },
    { href: "/user/change-password", label: "Change Password" },
    { href: "/user/logout", label: "Logout" },
  ];

  const getPageTitle = () => {
    switch (pathname) {
      case "/user/personal-information":
        return "Personal Information";
      case "/user/orders":
        return "My Orders";
      case "/user/addresses":
        return "Manage Address";
      case "/user/wishlist":
        return "Wishlist";
      case "/user/change-password":
        return "Change Password";
      case "/user/logout":
        return "Logout";
      default:
        return "My Orders";
    }
  };

  return (
    <div>
      <Banner
        title={getPageTitle()}
        image="/images/profile/profile-banner.svg"
      />
      <div className="profile-page pt-40 pb-70">
        <div className="container">
          <div className="dflex">
            <Sidebar links={sidebarLinks} />
            <div className="content">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

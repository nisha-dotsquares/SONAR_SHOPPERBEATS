"use client";

import { useRouter } from "next/navigation";
import {toast} from "react-toastify";
import { useLogoutMutation } from "../../../../lib/redux/apis/authApi";
import Button from "@/components/ui/Button";

export default function Logout() {
  const router = useRouter();

  const [logout, { isLoading }] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      toast.success("Logout successful!");
      router.refresh();

      router.push("/login");
    } catch (err) {
      toast.error("Logout failed. Please try again.");
      console.error("Logout error:", err);
    }
  };

  return (
    <div className="content wishlist-content">
      <h4 className="mb-20">Logout</h4>
      <p className="mb-20">Are you sure you want to logout?</p>
      <Button
        onClick={handleLogout}
        disabled={isLoading}
        isLoading={isLoading}
        className="btn btn-red btn-filled btn-sharp"
        debounceDelay={500}
      >
        {isLoading ? "Logging out..." : "Yes, Logout"}
      </Button>
    </div>
  );
}

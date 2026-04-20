"use client";
import { useState } from "react";
import { useFormValidation } from "../../../../lib/hooks/useFormValidation";
import * as yup from "yup";
import { useChangePasswordMutation, useLogoutMutation } from "../../../../lib/redux/apis/authApi";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import {toast} from "react-toastify";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { confirmPassword, strongPassword } from "@/lib/hooks/useYupValidation";

const schema = yup.object().shape({
  current_password: yup.string().required("Old password is required"),
  new_password: strongPassword,
  confirm_password:confirmPassword("new_password")
});

interface ChangePasswordFormData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export default function ChangePasswordPage() {
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [logout] = useLogoutMutation();

  const { formData, formErrors, handleChange, handleSubmit } =
    useFormValidation(schema, {
      current_password: "",
      new_password: "",
      confirm_password: "",
    });

  const router = useRouter();
  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      await changePassword({
        current_password: data.current_password,
        new_password: data.new_password,
      }).unwrap();
      toast.success("Password changed successfully!");
      try {
        await logout().unwrap();
      } catch {
      }
      router.push("/login");
    } catch (error) {
      toast.error("Failed to change password. Please check your current password.");
    }
  };
return(
<div className="wishlist-content">
      <h4 className="mb-30">Change Password</h4>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Old Password */}
        <div className="form-item">
          <label htmlFor="current_password">Current Password</label>
          <div className="password-input">
            <input
              id="current_password"
              type={showOldPassword ? "text" : "password"}
              name="current_password"
              value={formData.current_password}
              onChange={handleChange}
              placeholder="Enter Password"
            />
            <button
              type="button"
              onClick={() => setShowOldPassword(!showOldPassword)}
              className="eyeIcon"
            >
              {showOldPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {formErrors.current_password && (
            <p className="error">{formErrors.current_password}</p>
          )}
        </div>

        {/* New Password */}
        <div className="form-item">
          <label htmlFor="new_password">New Password</label>
          <div className="password-input">
            <input
              id="new_password"
              type={showNewPassword ? "text" : "password"}
              name="new_password"
              value={formData.new_password}
              onChange={handleChange}
              placeholder="Enter New Password"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="eyeIcon"
            >
              {showNewPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {formErrors.new_password && (
            <p className="error">{formErrors.new_password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="form-item">
          <label htmlFor="confirm_password">Confirm New Password</label>
          <div className="password-input">
            <input
              id="confirm_password"
              type={showConfirmPassword ? "text" : "password"}
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              placeholder="Re-enter New Password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="eyeIcon"
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {formErrors.confirm_password && (
            <p className="error">{formErrors.confirm_password}</p>
          )}
        </div>

        {/* Submit */}
        <Button type="submit" className="btn btn-red btn-filled btn-sharp w-100" disabled={isLoading} isLoading={isLoading}>
          {isLoading ? "Changing Password..." : "Save"}
        </Button>
      </form>
    </div>
  );
}

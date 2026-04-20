"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/redux/store";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  // useEffect(() => {
  //   if (isAuthenticated) {
  //     router.replace("/");
  //   }
  // }, [isAuthenticated, router]);

  return <>{children}</>;
}

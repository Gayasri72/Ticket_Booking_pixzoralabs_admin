"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface User {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  permissions?: string[];
}

export function useAuthUser() {
  const { data: session, status } = useSession();

  return {
    user: (session?.user as User) || {},
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
  };
}

export function useAdmin() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuthUser();

  useEffect(() => {
    if (
      !isLoading &&
      (!isAuthenticated ||
        (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN"))
    ) {
      router.push("/admin/signin");
    }
  }, [isLoading, isAuthenticated, user.role, router]);

  return {
    user,
    isLoading,
    isAdmin: user?.role === "ADMIN",
    isSuperAdmin: user?.role === "SUPER_ADMIN",
  };
}

export function usePermission(permissionName: string) {
  const { user } = useAuthUser();

  return {
    hasPermission: user?.permissions?.includes(permissionName) || false,
    isSuperAdmin: user?.role === "SUPER_ADMIN",
    permissions: user?.permissions || [],
  };
}

export function useSuperAdmin() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuthUser();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user.role !== "SUPER_ADMIN")) {
      router.push("/admin");
    }
  }, [isLoading, isAuthenticated, user.role, router]);

  return {
    user,
    isLoading,
    isSuperAdmin: user?.role === "SUPER_ADMIN",
  };
}

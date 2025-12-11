"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function AdminPage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/admin/dashboard");
    } else if (status === "unauthenticated") {
      router.push("/admin/signin");
    }
  }, [status, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-slate-600">Redirecting...</p>
    </div>
  );
}

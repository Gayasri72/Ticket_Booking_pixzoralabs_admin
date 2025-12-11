"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface AdminHeaderProps {
  title: string;
  description?: string;
}

export function AdminHeader({ title, description }: AdminHeaderProps) {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/admin/signin" });
  };

  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
        {description && (
          <p className="text-slate-600 mt-2">{description}</p>
        )}
      </div>
      <Button
        onClick={handleSignOut}
        variant="outline"
        className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
      >
        Sign Out
      </Button>
    </div>
  );
}

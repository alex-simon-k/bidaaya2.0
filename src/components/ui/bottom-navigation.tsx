"use client";

import { Briefcase, Building, User } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    {
      icon: Briefcase,
      label: "Internships",
      href: "/dashboard/projects",
      active: pathname.includes("/projects") || pathname === "/dashboard"
    },
    {
      icon: Building,
      label: "Companies",
      href: "/dashboard/companies",
      active: pathname.includes("/companies")
    },
    {
      icon: User,
      label: "Profile",
      href: "/dashboard/profile",
      active: pathname.includes("/profile")
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-bidaaya-dark/95 backdrop-blur border-t border-bidaaya-light/10 z-30 md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-colors",
                item.active
                  ? "text-bidaaya-accent bg-bidaaya-accent/10"
                  : "text-bidaaya-light/60 hover:text-bidaaya-light hover:bg-bidaaya-light/5"
              )}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

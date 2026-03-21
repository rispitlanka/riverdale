"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  HomeIcon,
  TagIcon,
  BeakerIcon,
  SparklesIcon,
  CubeIcon,
  CurrencyDollarIcon,
  PhotoIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";

type NavItem = {
  label: string;
  href: string;
  Icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactNode;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", Icon: HomeIcon },
  { label: "Categories", href: "/admin/categories", Icon: TagIcon },
  { label: "Metals", href: "/admin/metals", Icon: BeakerIcon },
  // {
  //   label: "Bulk Metal Update",
  //   href: "/admin/metals/bulk-update",
  //   Icon: BeakerIcon,
  // },
  { label: "Jewellery", href: "/admin/jewellery", Icon: SparklesIcon },
  { label: "Products", href: "/admin/products", Icon: CubeIcon },
  { label: "Today Prices", href: "/admin/today-prices", Icon: CurrencyDollarIcon },
  { label: "Banners", href: "/admin/banners", Icon: PhotoIcon },
  { label: "Orders", href: "/admin/orders", Icon: ShoppingBagIcon },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore network errors on logout
    } finally {
      router.push("/login");
    }
  }

  return (
    <aside className="flex h-screen w-64 flex-col bg-gray-900 text-gray-100">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-800">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#B8860B]/10 text-[#B8860B] font-bold">
          G
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-wide text-[#F5DEB3]">
            Gold Admin
          </span>
          <span className="text-xs text-gray-400">Jewellery e-commerce</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-gray-800 text-[#F5DEB3] border-l-4 border-[#B8860B]"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white",
              ].join(" ")}
            >
              <item.Icon className="h-4 w-4 flex-shrink-0 text-gray-400 group-hover:text-[#F5DEB3]" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-800 px-4 py-3 flex items-center justify-between text-xs text-gray-500">
        <span>&copy; {new Date().getFullYear()} Gold Admin</span>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-md border border-gray-700 px-2 py-1 text-[11px] font-medium text-gray-200 hover:bg-gray-800"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}


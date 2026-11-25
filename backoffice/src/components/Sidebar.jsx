import Link from "next/link";
import {
  UserIcon,
  Logout01Icon,
  DashboardSquare01Icon,
  ShoppingBag01Icon,
  PackageIcon,
  UserGroupIcon,
  Settings01Icon,
  Tag01Icon,
  Audit01Icon
} from "hugeicons-react";

export default function Sidebar({ user, activeTab, logout }) {
  // Sidebar items categorized by section
  const sidebarSections = [
    {
      title: "ภาพรวม",
      items: [
        { id: "dashboard", label: "แผงควบคุม", icon: DashboardSquare01Icon, adminOnly: false },
      ],
    },
    {
      title: "จัดการร้านค้า",
      items: [
        { id: "products", label: "รายการสินค้า", icon: PackageIcon, adminOnly: false },
        { id: "customization", label: "การปรับแต่งสินค้า", icon: Tag01Icon, adminOnly: false },
        { id: "orders", label: "รายการสั่งซื้อ", icon: ShoppingBag01Icon, adminOnly: false },
        { id: "customers", label: "ข้อมูลลูกค้า", icon: UserGroupIcon, adminOnly: false },
      ],
    },
    {
      title: "ผู้ดูแลระบบ",
      items: [
        { id: "staff", label: "จัดการพนักงาน", icon: UserGroupIcon, adminOnly: true },
        { id: "settings", label: "ตั้งค่าระบบ", icon: Settings01Icon, adminOnly: true },
        { id: "audit-logs", label: "ประวัติการดำเนินการ", icon: Audit01Icon, adminOnly: true },
      ],
    },
  ];

  const isAdmin = user?.role === "admin";

  return (
    <aside className="w-72 bg-[#FFF9FA] border-r border-[#F7DCE2] flex flex-col justify-between py-6 px-4 shrink-0 shadow-sm">
      <div>
        {/* Logo */}
        <div className="mb-8 px-2">
          <div className="flex items-center gap-2.5 text-[#3B262B] select-none">
            <svg
              className="w-6 h-6 transition-transform duration-300 hover:scale-110 text-[#E06D85]"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
            <span className="text-xl font-bold uppercase tracking-[0.15em] font-sans text-[#3B262B]">
              Little U
            </span>
          </div>
          <p className="text-[10px] text-[#C9566F] font-semibold tracking-widest uppercase mt-1.5 ml-8.5">
            Backoffice Portal
          </p>
        </div>

        {/* Navigation Sections */}
        <nav className="space-y-6">
          {sidebarSections.map((section) => {
            // Filter items within the section based on admin role
            const visibleItems = section.items.filter(
              (item) => !item.adminOnly || isAdmin
            );

            // Skip rendering the section if there are no visible items
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-1.5">
                <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-1">
                  {section.title}
                </span>

                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const IconComponent = item.icon;
                    const isActive = activeTab === item.id;
                    const href = item.id === "dashboard" ? "/dashboard" : `/dashboard/${item.id}`;
                    return (
                      <Link
                        key={item.id}
                        href={href}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${isActive
                            ? "bg-[#FFF5F7] text-[#E06D85] font-semibold"
                            : "text-[#3B262B]/75 hover:bg-[#FFF5F7]/70 hover:text-[#3B262B]"
                          }`}
                      >
                        <IconComponent size={18} className={isActive ? "text-[#E06D85]" : "text-gray-400"} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer / User Profile & Logout */}
      <div className="border-t border-[#F7DCE2] pt-4 space-y-4">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-[#FFF5F7] flex items-center justify-center text-[#E06D85] font-bold text-base border border-[#F7DCE2]">
            {user?.firstName ? user.firstName[0].toUpperCase() : <UserIcon size={18} />}
          </div>
          <div className="overflow-hidden flex-1">
            <span className="block text-sm font-bold text-[#3B262B] truncate">
              {user?.firstName} {user?.lastName}
            </span>
            {isAdmin ? (
              <span className="inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FFF5F7] text-[#E06D85] border border-[#F7DCE2]">
                Admin
              </span>
            ) : (
              <span className="inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                Staff
              </span>
            )}
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#C9566F] hover:bg-[#FFF5F7] hover:text-[#E06D85] transition-colors cursor-pointer border border-transparent hover:border-[#F7DCE2]"
        >
          <Logout01Icon size={18} />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
}
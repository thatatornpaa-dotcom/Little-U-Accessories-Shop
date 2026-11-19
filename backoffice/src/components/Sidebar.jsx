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
  Store01Icon,
  Wallet01Icon,
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
        { id: "shops", label: "ร้านค้า / อนุมัติร้าน", icon: Store01Icon, adminOnly: false },
        { id: "products", label: "รายการสินค้า", icon: PackageIcon, adminOnly: false },
        { id: "customization", label: "การปรับแต่งสินค้า", icon: Tag01Icon, adminOnly: false },
        { id: "orders", label: "รายการสั่งซื้อ", icon: ShoppingBag01Icon, adminOnly: false },
        { id: "customers", label: "ข้อมูลลูกค้า", icon: UserGroupIcon, adminOnly: false },
      ],
    },
    {
      title: "ระบบการเงิน",
      items: [
        { id: "payouts", label: "คำขอถอนเงิน", icon: Wallet01Icon, adminOnly: true },
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
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col justify-between py-6 px-4 shrink-0 shadow-sm">
      <div>
        {/* Logo */}
        <div className="mb-8 px-2">
          <div className="flex items-center gap-2.5 text-neutral-900 select-none">
            <svg className="w-6 h-6 transition-transform duration-300 hover:rotate-12 text-[#6B7A4E]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
              <path d="M8.5 12C8.5 13.933 10.067 15.5 12 15.5C13.933 15.5 15.5 13.933 15.5 12C15.5 10.067 13.933 8.5 12 8.5C10.067 8.5 8.5 10.067 8.5 12Z" fill="currentColor" />
              <path d="M12 5C8.134 5 5 8.134 5 12C5 15.866 8.134 19 12 19C15.866 19 19 15.866 19 12C19 8.134 15.866 5 12 5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span className="text-xl font-bold uppercase tracking-[0.15em] font-sans">
              Bare & Bold
            </span>
          </div>
          <p className="text-[10px] text-gray-400 font-semibold tracking-widest uppercase mt-1.5 ml-8.5">
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
                            ? "bg-brand/10 text-brand font-semibold"
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                          }`}
                      >
                        <IconComponent size={18} className={isActive ? "text-brand" : "text-gray-400"} />
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
      <div className="border-t border-gray-100 pt-4 space-y-4">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-base border border-brand/20">
            {user?.firstName ? user.firstName[0].toUpperCase() : <UserIcon size={18} />}
          </div>
          <div className="overflow-hidden flex-1">
            <span className="block text-sm font-bold text-gray-800 truncate">
              {user?.firstName} {user?.lastName}
            </span>
            {isAdmin ? (
              <span className="inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand/10 text-brand border border-brand/20">
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
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer border border-transparent hover:border-rose-100"
        >
          <Logout01Icon size={18} />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
}

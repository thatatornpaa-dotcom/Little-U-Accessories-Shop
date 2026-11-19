"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search01Icon,
  FavouriteIcon,
  ShoppingBag01Icon,
  UserIcon,
  UserCircleIcon,
  PackageIcon,
  Logout01Icon,
  Settings02Icon,
} from "hugeicons-react";
import AuthModal from "../auth/AuthModal";
import CartDrawer from "../cart/CartDrawer";
import { wishlistService } from "@/services/wishlist.service";
import { useAuth } from "@/context/AuthContext";

const NAV_LINKS = [
  { label: "หน้าแรก", href: "/" },
  { label: "ร้านค้า", href: "/products" },
  { label: "ติดต่อเรา", href: "/contact" },
  { label: "เอกสารระบบ", href: "/docs" },
  { label: "การ์ดสุ่มดวง", href: "/fortune-card" },
];

export default function Header({
  isLoggedIn: initialIsLoggedIn = false,
  onAuthStatusChange,
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [user, setUser] = useState(null);
  const [avatar, setAvatar] = useState(null);

  const profileMenuRef = useRef(null);
  const wishlistMenuRef = useRef(null);

  const {
    user: authUser,
    shop,
    isLoggedIn: contextLoggedIn,
    loading: authLoading,
    logout: contextLogout,
    refresh: refreshAuth,
  } = useAuth();

  useEffect(() => {
    setIsLoggedIn(initialIsLoggedIn);
  }, [initialIsLoggedIn]);

  // ให้ Header ใช้สถานะล่าสุดจาก AuthContext เป็นแหล่งความจริง
  useEffect(() => {
    if (authLoading) return;
    setIsLoggedIn(contextLoggedIn);
    setUser(authUser || null);
    if (authUser) {
      setAvatar(localStorage.getItem("avatar"));
    }
  }, [authLoading, contextLoggedIn, authUser]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadProfile = () => {
      const token = localStorage.getItem("bare_auth_token");

      if (token) {
        setIsLoggedIn(true);

        const savedUser = localStorage.getItem("bare_user");
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }

        const savedAvatar = localStorage.getItem("avatar");
        setAvatar(savedAvatar);
      }
    };

    loadProfile();

    window.addEventListener("profileUpdated", loadProfile);

    return () => {
      window.removeEventListener("profileUpdated", loadProfile);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setIsProfileOpen(false);
      }
      if (
        wishlistMenuRef.current &&
        !wishlistMenuRef.current.contains(event.target)
      ) {
        setIsWishlistOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const updateCartCount = () => {
    if (typeof window !== "undefined") {
      const localCart = localStorage.getItem("bare_cart");
      if (localCart) {
        try {
          const parsed = JSON.parse(localCart);
          if (Array.isArray(parsed)) {
            const count = parsed.reduce(
              (acc, item) => acc + (item.quantity || 1),
              0,
            );
            setCartCount(count);
            return;
          }
        } catch (e) {}
      }
      setCartCount(0);
    }
  };

  const updateWishlist = async () => {
    const items = await wishlistService.fetchWishlist();
    setWishlistItems(items);
  };

  useEffect(() => {
    updateCartCount();
    updateWishlist();
    window.addEventListener("cartUpdated", updateCartCount);
    window.addEventListener("storage", updateCartCount);
    window.addEventListener("wishlistUpdated", updateWishlist);
    return () => {
      window.removeEventListener("cartUpdated", updateCartCount);
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("wishlistUpdated", updateWishlist);
    };
  }, [isLoggedIn]);

  const handleLogout = async () => {
    localStorage.removeItem("bare_auth_token");
    localStorage.removeItem("bare_user");
    localStorage.removeItem("bare_user_email");
    localStorage.removeItem("profile");
    localStorage.removeItem("avatar");
    localStorage.removeItem("addresses");
    localStorage.removeItem("bare_cart");

    await contextLogout();
    setUser(null);
    setAvatar(null);
    setIsLoggedIn(false);
    setIsProfileOpen(false);
    if (onAuthStatusChange) {
      onAuthStatusChange(false);
    }
    router.push("/");
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const handleAuthSuccess = (user) => {
    const hasToken = !!localStorage.getItem("bare_auth_token");

    setIsLoggedIn(hasToken);
    setUser(user);
    refreshAuth();

    const savedAvatar = localStorage.getItem("avatar");
    setAvatar(savedAvatar);

    if (onAuthStatusChange) {
      onAuthStatusChange(hasToken, user);
    }
  };

  return (
    <>
      {/* Main Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[#FFF9FA]/95 backdrop-blur-md border-b border-[#FADCE3] shadow-sm">
        <div className="max-w-[1440px] mx-auto px-6 h-18 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 hover:text-[#E87A90] transition select-none text-[#3B262B]"
            prefetch={false}
          >
            <svg
              className="w-6 h-6 text-[#E87A90] transition-transform duration-300 hover:scale-110"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"
                fill="currentColor"
              />
            </svg>
            <span className="text-2xl font-bold tracking-wide font-sans text-[#E87A90]">
              Little U
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-8 text-[14px] font-anuphan font-bold">
            {NAV_LINKS.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`transition ${
                    isActive
                      ? "text-[#E87A90] border-b-2 border-[#E87A90] pb-1"
                      : "text-[#3B262B] hover:text-[#E87A90]"
                  }`}
                  prefetch={false}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Action Icons & Profile Access */}
          <div className="flex items-center gap-5 text-[#3B262B]">
            <Link
              href="/products"
              className="w-10 h-10 flex items-center justify-center hover:text-[#E87A90] transition"
            >
              <Search01Icon size={20} strokeWidth={2} />
            </Link>

            {/* Wishlist Dropdown */}
            <div className="relative" ref={wishlistMenuRef}>
              <button
                onClick={() => setIsWishlistOpen(!isWishlistOpen)}
                className="relative w-10 h-10 flex items-center justify-center hover:text-[#E87A90] transition cursor-pointer"
              >
                <FavouriteIcon size={20} strokeWidth={2} />
                {wishlistItems.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E87A90] rounded-full animate-pulse" />
                )}
              </button>

              {isWishlistOpen && (
                <div className="absolute right-0 mt-3 w-72 rounded-xl bg-white border border-[#FADCE3] shadow-xl overflow-hidden z-50 p-4 font-anuphan">
                  <h3 className="font-extrabold text-sm text-[#3B262B] mb-3 pb-2 border-b border-[#FFF0F3]">
                    รายการโปรดของคุณ ({wishlistItems.length})
                  </h3>

                  {wishlistItems.length === 0 ? (
                    <div className="text-center py-6 text-xs text-zinc-400 font-bold">
                      ไม่มีสินค้าในรายการโปรด
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto space-y-3">
                      {wishlistItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex gap-3 items-center justify-between group"
                        >
                          <Link
                            href={`/products/${item.name
                              ?.toLowerCase()
                              .replace(/ /g, "-")}`}
                            onClick={() => setIsWishlistOpen(false)}
                            className="flex items-center gap-2 flex-1 min-w-0"
                          >
                            <img
                              src={
                                item.images?.[0]?.url ||
                                item.images?.[0] ||
                                item.imageUrl ||
                                "/placeholder.jpg"
                              }
                              alt={item.name}
                              className="w-10 h-10 object-cover rounded-lg bg-[#FFF5F7] border border-[#FADCE3] flex-shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-[#3B262B] truncate hover:text-[#E87A90]">
                                {item.name}
                              </p>
                              <p className="text-[10px] text-zinc-400">
                                ฿{Number(item.price).toLocaleString()}
                              </p>
                            </div>
                          </Link>
                          <button
                            onClick={() =>
                              wishlistService.removeFromWishlist(item.id)
                            }
                            className="text-zinc-300 hover:text-[#E87A90] p-1.5 transition cursor-pointer rounded-full hover:bg-[#FFF5F7]"
                            title="ลบจากรายการโปรด"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              strokeWidth="2.5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative hover:text-[#E87A90] transition cursor-pointer"
            >
              <ShoppingBag01Icon size={20} strokeWidth={2} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-[#E87A90] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            <div className="relative" ref={profileMenuRef}>
              {isLoggedIn ? (
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="w-10 h-10 flex items-center justify-center hover:text-[#E87A90] transition cursor-pointer"
                >
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="Profile"
                      className="w-9 h-9 rounded-full object-cover border border-[#FADCE3]"
                    />
                  ) : (
                    <UserCircleIcon size={21} strokeWidth={2} />
                  )}
                </button>
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFF5F7] hover:bg-[#FCE4EA] border border-[#F7C8D3] transition text-xs font-bold text-[#3B262B] cursor-pointer"
                >
                  <UserIcon size={14} strokeWidth={2.5} />
                  <span>เข้าสู่ระบบ</span>
                </button>
              )}

              {isProfileOpen && isLoggedIn && (
                <div className="absolute right-0 mt-3 w-56 rounded-xl bg-white border border-[#FADCE3] shadow-xl overflow-hidden z-50 py-1 font-anuphan">
                  <div className="px-4 py-3 border-b border-[#FFF0F3]">
                    <p className="text-xs text-zinc-400">บัญชีผู้ใช้</p>
                    <p className="text-sm font-bold text-[#3B262B] truncate mt-0.5">
                      {user
                        ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
                        : localStorage.getItem("bare_user_email")}
                    </p>
                  </div>

                  {/* Seller zone */}
                  {shop?.status === "APPROVED" ? (
                    <>
                      <Link
                        href="/seller"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFF5F7] text-sm font-bold text-[#E87A90] transition"
                      >
                        <Settings02Icon size={18} />
                        Seller Center
                      </Link>
                      <Link
                        href={`/shop/${shop.slug}`}
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFF5F7] text-sm font-bold text-[#3B262B] transition"
                      >
                        <ShoppingBag01Icon size={18} />
                        ดูร้านของฉัน
                      </Link>
                    </>
                  ) : shop ? (
                    <Link
                      href="/become-seller"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFF5F7] text-sm font-bold text-amber-600 transition"
                    >
                      <ShoppingBag01Icon size={18} />
                      ร้านรอการอนุมัติ
                    </Link>
                  ) : (
                    <Link
                      href="/become-seller"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFF5F7] text-sm font-bold text-[#3B262B] transition"
                    >
                      <ShoppingBag01Icon size={18} />
                      สมัครเปิดร้าน
                    </Link>
                  )}

                  <Link
                    href="/orders"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFF5F7] text-sm font-bold text-[#3B262B] transition"
                  >
                    <PackageIcon size={18} />
                    ประวัติคำสั่งซื้อ
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFF5F7] text-sm font-bold text-[#3B262B] transition"
                  >
                    <Settings02Icon size={18} />
                    โปรไฟล์
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#FFF5F5] text-left text-sm font-bold text-red-600 border-t border-[#FFF0F3] cursor-pointer"
                  >
                    <Logout01Icon size={18} />
                    ออกจากระบบ
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
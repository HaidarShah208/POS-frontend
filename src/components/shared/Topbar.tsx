"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import { logout, saveAuthToStorage } from "@/redux/api/auth";
import { cn } from "@/lib/utils";

type TopbarProps = {
  onMenuClick?: () => void;
};

 

export function Topbar({ onMenuClick }: TopbarProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth?.user);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    saveAuthToStorage(null);
    router.push("/auth/login");
  };

 

  return (
    <header className="sticky top-0 z-40 flex justify-between h-15 items-center gap-4 border-b border-(--border) bg-background px-4">
      <div className="flex flex-1 items-center gap-2 max-w-xl">
        <Button
          variant="ghost"
          size="icon"
          className={cn("lg:hidden shrink-0")}
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </Button>
      
        <span className="text-sm font-medium text-[var(--muted-foreground)] sm:hidden">POS</span>
      </div>

      <div className="flex items-center  gap-1">
        

        <div className="relative" ref={profileRef}>
          <Button variant="ghost" size="sm" onClick={() => setProfileOpen(!profileOpen)} className="gap-2">
            <span className="hidden sm:inline">{user?.name ?? "User"}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </Button>
          {profileOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-[var(--border)] bg-[var(--background)] shadow-lg py-2 z-50">
              <p className="px-4 py-2 text-sm text-[var(--muted-foreground)] truncate">{user?.email}</p>
              <p className="px-4 py-0 text-xs text-[var(--muted-foreground)] capitalize">{user?.role}</p>
              <Link href="/pos" className="block px-4 py-2 text-sm hover:bg-[var(--muted)]">Open POS</Link>
              <button className="block w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)]" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

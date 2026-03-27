"use client";

import { useCallback, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export function DashboardShell({
  userEmail,
  children,
}: {
  userEmail: string;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setMobileSidebarOpen((prev) => !prev);
      return;
    }
    setSidebarOpen((prev) => !prev);
  }, []);

  return (
    <div className="flex min-h-dvh bg-[var(--background)] text-zinc-100">
      <div
        className={`hidden overflow-hidden border-r border-zinc-800/60 transition-all duration-300 ease-in-out md:block ${
          sidebarOpen ? "w-[280px]" : "w-0"
        }`}
      >
        <Sidebar userEmail={userEmail} onCloseMobile={() => setMobileSidebarOpen(false)} />
      </div>

      {mobileSidebarOpen ? (
        <>
          <button
            aria-label="Fechar menu lateral"
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-[280px] border-r border-zinc-800/80 bg-zinc-950 md:hidden">
            <Sidebar userEmail={userEmail} onCloseMobile={() => setMobileSidebarOpen(false)} />
          </aside>
        </>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <Header userEmail={userEmail} onToggleSidebar={toggleSidebar} />
        <main className="min-h-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

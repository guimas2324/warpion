import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-dvh bg-[var(--background)] text-zinc-100">
      <div className="mx-auto flex min-h-dvh w-full max-w-[1400px] gap-4 p-4">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <Header userEmail={user.email ?? ""} />
          <div className="min-h-0 flex-1 rounded-2xl border border-zinc-700 bg-[var(--card)] shadow-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}


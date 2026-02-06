"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { User } from "@supabase/supabase-js";

export function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (loading) {
    return <div className="h-8 w-20 animate-pulse bg-surface-overlay" />;
  }

  if (!user) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push("/login")}
      >
        Sign In
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-mono text-muted-foreground truncate max-w-[160px]">
        {user.email}
      </span>
      <Button variant="ghost" size="sm" onClick={handleLogout}>
        Log out
      </Button>
    </div>
  );
}

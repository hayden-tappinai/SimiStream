import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { UserMenu } from "./UserMenu";

interface TopNavProps {
  professionName?: string;
  isLive?: boolean;
}

export function TopNav({ professionName, isLive }: TopNavProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b-2 border-border bg-surface-raised px-6">
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center border-2 border-border bg-accent font-bold text-accent-foreground shadow-brutal-sm text-xs font-mono">
            SD
          </div>
          <span className="text-lg font-bold tracking-tight">SimDrill</span>
        </Link>
        {professionName && (
          <>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium truncate max-w-[300px] font-mono">
              {professionName}
            </span>
          </>
        )}
      </div>
      <div className="flex items-center gap-3">
        {isLive && (
          <Badge variant="live" className="gap-1.5">
            <span className="h-2 w-2 rounded-full bg-live animate-pulse-live" />
            ACTIVE
          </Badge>
        )}
        <UserMenu />
      </div>
    </header>
  );
}

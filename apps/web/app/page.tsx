import Link from "next/link";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      {/* Floating theme toggle for pages without navigation */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="max-w-3xl text-center space-y-8">
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
          The First Ever{" "}
          <span className="text-accent">World Model</span>{" "}
          Training Platform
        </h1>

        <p className="text-lg text-muted-foreground sm:text-xl max-w-xl mx-auto">
          Train AI agents in immersive simulated worlds powered by real-time
          visual generation.
        </p>

        <div>
          <Link
            href="/dashboard"
            className="inline-block border-brutal shadow-brutal bg-accent px-8 py-4 text-lg font-bold text-accent-foreground transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
          >
            Enter SimiStream
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { SparklesIcon } from "hugeicons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useLayoutDiagnostics } from "@/hooks/use-layout-diagnostics";
import { useAppStore } from "@/providers/store-provider";
import { cn } from "@/lib/utils";

type PanelContent = {
  title: string;
  description?: string;
  body: ReactNode;
  footer?: ReactNode;
};

type AppShellProps = {
  title: string;
  description: string;
  primaryPanel: PanelContent;
  secondaryPanel?: PanelContent;
};

const navLinks = [
  { href: "/play", label: "Play" },
  { href: "/docs", label: "Docs" },
  { href: "/examples", label: "Examples" },
];

export function AppShell({
  title,
  description,
  primaryPanel,
  secondaryPanel,
}: AppShellProps) {
  const pathname = usePathname();
  const arrangement = useAppStore((state) => state.arrangement);
  const setArrangement = useAppStore((state) => state.setArrangement);

  useLayoutDiagnostics("app-shell");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateArrangement = () => {
      const next = window.innerWidth < 768 ? "stacked" : "split";
      setArrangement(next);
    };

    updateArrangement();
    window.addEventListener("resize", updateArrangement);
    return () => window.removeEventListener("resize", updateArrangement);
  }, [setArrangement]);

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-background to-muted/40">
      <header className="border-b bg-background/90 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <SparklesIcon className="h-5 w-5 text-primary" />
            <span className="text-foreground">Loom App Shell</span>
          </div>
          <nav className="flex items-center gap-1 text-sm font-medium">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (pathname?.startsWith(link.href) &&
                  link.href !== "/play"); // /play is the default root

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-full px-3 py-1 text-foreground/80 transition hover:text-foreground",
                    isActive && "bg-accent text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm">
              Export
            </Button>
          </div>
        </div>
      </header>
      <main className="container flex-1 py-10">
        <section className="mb-10 space-y-3 text-center md:text-left">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Responsive Layout · {arrangement === "stacked" ? "Stacked" : "Split"}
          </p>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
            <p className="mt-2 text-base text-muted-foreground md:max-w-2xl">
              {description}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <Button size="sm" variant="secondary" className="w-full sm:w-auto">
              Save preset
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground"
              disabled
            >
              Share (soon)
            </Button>
          </div>
        </section>
        <div
          className={cn(
            "grid grid-cols-1 gap-6",
            arrangement === "split" && "md:grid-cols-2",
          )}
        >
          <Panel {...primaryPanel} priority />
          {secondaryPanel ? <Panel {...secondaryPanel} /> : null}
        </div>
      </main>
      <footer className="border-t bg-background/80 py-6">
        <div className="container flex flex-col gap-2 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Loom DSL · Adaptive layout shell</p>
          <p>Export CTA, theme switcher, and diagnostics are placeholders.</p>
        </div>
      </footer>
    </div>
  );
}

type PanelProps = PanelContent & { priority?: boolean };

function Panel({ title, description, body, footer, priority }: PanelProps) {
  return (
    <motion.section
      layout
      className={cn(
        "panel-surface flex min-h-[320px] flex-col gap-4 p-6",
        priority && "ring-1 ring-primary/10",
      )}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {priority ? "Primary surface" : "Secondary surface"}
        </p>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="flex-1">{body}</div>
      {footer ? (
        <div className="border-t pt-4 text-sm text-muted-foreground">
          {footer}
        </div>
      ) : null}
    </motion.section>
  );
}

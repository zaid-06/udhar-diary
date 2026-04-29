import type { ReactNode } from "react";
import { BadgeCheck, Building2, Wallet } from "lucide-react";

type AuthSplitLayoutProps = {
  heading: string;
  tagline?: string;
  description: string;
  children: ReactNode;
};

export function AuthSplitLayout({ heading, tagline, description, children }: AuthSplitLayoutProps) {
  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950">
      <div className="flex h-full flex-col-reverse md:flex-row">
        <section className="relative flex h-full items-center overflow-hidden bg-gradient-to-br from-sky-600 via-blue-700 to-cyan-600 px-6 py-10 text-primary-foreground md:w-1/2 md:px-12 lg:px-16 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
          <div
            className="absolute -top-28 -left-16 h-64 w-64 rounded-full bg-white/20 blur-3xl dark:bg-cyan-300/15"
            aria-hidden
          />
          <div
            className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-cyan-100/30 blur-3xl dark:bg-blue-300/15"
            aria-hidden
          />

          <div className="relative mx-auto w-full max-w-xl space-y-6">
            {tagline ? (
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-sky-100 dark:text-cyan-200">
                {tagline}
              </p>
            ) : null}
            <h1 className="text-3xl font-bold leading-tight text-white md:text-4xl">{heading}</h1>
            <p className="max-w-lg text-sm text-sky-50/95 dark:text-cyan-100/90 md:text-base">
              {description}
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur-sm dark:border-white/20 dark:bg-white/10">
                <BadgeCheck className="h-4 w-4" />
                Secure Login
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur-sm dark:border-white/20 dark:bg-white/10">
                <Building2 className="h-4 w-4" />
                Customer Management
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur-sm dark:border-white/20 dark:bg-white/10">
                <Wallet className="h-4 w-4" />
                Udhar Tracking
              </div>
            </div>
          </div>
        </section>

        <section className="flex h-full items-center justify-center overflow-y-auto bg-gradient-to-b from-slate-50 to-white px-4 py-8 md:w-1/2 md:px-8 dark:from-slate-950 dark:to-slate-900">
          <div className="w-full max-w-md">{children}</div>
        </section>
      </div>
    </div>
  );
}


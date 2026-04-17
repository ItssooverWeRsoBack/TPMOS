"use client";

import { Suspense } from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { CommandPalette } from "./command-palette";
import { MobileNav } from "./mobile-nav";
import { OnboardingWizard } from "./onboarding-wizard";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Suspense>
        <div className="hidden lg:flex">
          <Sidebar />
        </div>
      </Suspense>
      <div className="flex w-full flex-1 flex-col overflow-hidden">
        <Suspense fallback={<div className="h-14 border-b border-border bg-background" />}>
          <div className="flex items-center">
            <div className="pl-3 lg:hidden">
              <MobileNav />
            </div>
            <div className="flex-1">
              <TopBar />
            </div>
          </div>
        </Suspense>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <CommandPalette />
      <OnboardingWizard />
    </div>
  );
}

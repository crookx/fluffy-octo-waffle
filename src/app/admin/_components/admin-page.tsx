'use client';
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { PropsWithChildren } from "react";

type BreadcrumbItem = {
  href: string;
  label: string;
};

interface AdminPageProps extends PropsWithChildren {
  title: string;
  description?: React.ReactNode;
  breadcrumbs: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export function AdminPage({ title, description, breadcrumbs, actions, children }: AdminPageProps) {
  return (
    <div className="flex w-full flex-col">
      <header className="sticky top-0 z-10 flex h-auto min-h-16 flex-wrap items-center justify-between gap-4 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6 flex-shrink-0">
        <div className="flex w-full items-center gap-4">
          <div className="lg:hidden">
            <SidebarTrigger />
          </div>
          <div className="flex-1 space-y-0.5 min-w-0">
            <Breadcrumbs items={breadcrumbs} className="mb-0" />
            <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl" title={title}>{title}</h1>
          </div>
        </div>
        {actions && (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            {actions}
          </div>
        )}
      </header>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 w-full">
        {description && <div className="text-muted-foreground mb-4">{description}</div>}
        {children}
      </div>
    </div>
  )
}

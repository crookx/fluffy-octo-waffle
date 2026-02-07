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
    description?: string;
    breadcrumbs: BreadcrumbItem[];
    actions?: React.ReactNode;
}

export function AdminPage({ title, description, breadcrumbs, actions, children }: AdminPageProps) {
    return (
        <div className="flex w-full h-full flex-col overflow-hidden">
            <header className="sticky top-0 z-10 flex h-auto min-h-16 flex-wrap items-center justify-between gap-4 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6 flex-shrink-0">
                <div className="flex items-center gap-4 w-full">
                    <div className="lg:hidden">
                        <SidebarTrigger />
                    </div>
                    <div className="flex-1 space-y-0.5 min-w-0">
                        <Breadcrumbs items={breadcrumbs} className="mb-0" />
                        <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl" title={title}>{title}</h1>
                    </div>
                </div>
                {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
            </header>
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 w-full">
                 {description && <p className="text-muted-foreground mb-4">{description}</p>}
                {children}
            </div>
        </div>
    )
}

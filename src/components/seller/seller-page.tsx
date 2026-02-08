'use client';

import { PropsWithChildren } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { SellerShell } from './seller-shell';

interface SellerPageProps extends PropsWithChildren {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function SellerPage({ title, description, actions, children }: SellerPageProps) {
  return (
    <SellerShell>
      <div className="flex w-full h-full flex-col overflow-hidden">
        <header className="sticky top-0 z-10 flex w-full flex-col gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6 sm:flex-row sm:items-center sm:justify-between flex-shrink-0">
          <div className="flex w-full items-center gap-4">
            <div className="lg:hidden">
              <SidebarTrigger />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl" title={title}>{title}</h1>
              {description && <p className="mt-1 text-sm text-muted-foreground truncate">{description}</p>}
            </div>
          </div>
          {actions && <div className="mt-2 flex w-full items-center justify-end gap-2 sm:mt-0 sm:w-auto">{actions}</div>}
        </header>
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 w-full">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </div>
      </div>
    </SellerShell>
  );
}

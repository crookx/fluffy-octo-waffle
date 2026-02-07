'use client';

import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { PropsWithChildren } from 'react';
import { SellerNav } from './seller-nav';

export function SellerShell({ children }: PropsWithChildren) {
  return (
    <SidebarProvider className="w-full h-full">
      <Sidebar>
        <SellerNav />
      </Sidebar>
      <SidebarInset className="w-full h-full flex flex-col overflow-hidden">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

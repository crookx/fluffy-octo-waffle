import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { PropsWithChildren } from 'react';
import { AdminNav } from './_components/admin-nav';

export default function AdminLayout({ children }: PropsWithChildren) {
  return (
    <SidebarProvider className="w-full h-full">
      <Sidebar>
        <AdminNav />
      </Sidebar>
      <SidebarInset className="w-full h-full flex flex-col overflow-hidden">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, List, ArrowUpRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAdminStatsAction } from '../actions';
import { Skeleton } from '@/components/ui/skeleton';
import { AnalyticsChart } from './_components/analytics-chart';
import { AdminPage } from './_components/admin-page';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';


type Stats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  // Fetch stats once on component mount
  useEffect(() => {
    getAdminStatsAction()
      .then(setStats)
      .then(() => setUpdatedAt(new Date()))
      .catch(console.error);
  }, []);

  const statusCards = [
    {
      title: 'Total Listings',
      value: stats?.total ?? null,
      icon: List,
      href: '/admin/listings',
      helper: 'All time',
    },
    {
      title: 'Pending Review',
      value: stats?.pending ?? null,
      icon: Clock,
      href: '/admin/listings?status=pending',
      helper: 'Needs action',
    },
    {
      title: 'Approved Listings',
      value: stats?.approved ?? null,
      icon: CheckCircle,
      href: '/admin/listings?status=approved',
      helper: 'Last 30 days',
    },
    {
      title: 'Rejected Listings',
      value: stats?.rejected ?? null,
      icon: XCircle,
      href: '/admin/listings?status=rejected',
      helper: 'Last 30 days',
    },
  ];

  const summaryChips = [
    stats?.pending ? { label: `${stats.pending} pending reviews`, tone: 'warning' as const } : null,
    stats?.approved ? { label: `${stats.approved} approvals in 30 days`, tone: 'success' as const } : null,
    stats?.rejected ? { label: `${stats.rejected} rejections in 30 days`, tone: 'destructive' as const } : null,
  ].filter(Boolean);

  return (
    <AdminPage
      title="Dashboard"
      description={
        <div className="flex flex-wrap items-center gap-2">
          <span>An overview of the platform's activity and listing statuses.</span>
          {updatedAt && (
            <span className="text-xs text-muted-foreground">
              Updated {formatDistanceToNow(updatedAt, { addSuffix: true })}
            </span>
          )}
          {summaryChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {summaryChips.map((chip, index) => (
                <Badge key={`${chip?.label}-${index}`} variant={chip?.tone}>
                  {chip?.label}
                </Badge>
              ))}
            </div>
          )}
        </div>
      }
      breadcrumbs={[{ href: '/admin', label: 'Dashboard' }]}
      actions={(
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm">
            <Link href="/admin/listings?status=pending">
              Review Pending
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/inbox">Open Inbox</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/analytics">View Analytics</Link>
          </Button>
        </div>
      )}
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Overview</h2>
          <p className="text-sm text-muted-foreground">Quick status checks and review shortcuts.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-10">
        {statusCards.map((card) => (
          <Link key={card.title} href={card.href} className="group">
            <Card className="transition-all group-hover:border-primary/50 group-hover:shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {stats ? (
                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-bold">{card.value}</div>
                    <span className="text-xs text-muted-foreground">{card.helper}</span>
                  </div>
                ) : (
                  <Skeleton className="h-8 w-16" />
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mb-3">
        <h2 className="text-lg font-semibold">Analytics</h2>
        <p className="text-sm text-muted-foreground">Track approval velocity and workload trends.</p>
      </div>

      <div className="mb-8">
        <AnalyticsChart />
      </div>

    </AdminPage>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { getChartDataAction } from '@/app/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subDays, isAfter } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type ChartData = {
  date: string;
  displayDate: string;
  count: number;
}

const chartConfig = {
  count: {
    label: "Approved",
    color: "hsl(var(--success))",
  },
} satisfies ChartConfig

export function AnalyticsChart() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30');

  useEffect(() => {
    getChartDataAction()
      .then(chartData => {
        const formattedData = chartData.map(d => ({
          ...d,
          displayDate: format(new Date(d.date), 'MMM d'),
        }))
        setData(formattedData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredData = data.filter((item) => {
    const cutoff = subDays(new Date(), Number.parseInt(range, 10));
    return isAfter(new Date(item.date), cutoff);
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle>Listings Approved Daily</CardTitle>
          <CardDescription>Number of listings approved in the last {range} days.</CardDescription>
        </div>
        <div className="w-full sm:w-44">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger>
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredData.length === 0 ? (
          <div className="flex h-[350px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed">
            <p className="text-sm font-medium">No approvals recorded in this range.</p>
            <p className="text-xs text-muted-foreground">Try expanding the timeframe or check back later.</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <BarChart accessibilityLayer data={filteredData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="displayDate"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 6)}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                width={30}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent />}
              />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={4}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

    

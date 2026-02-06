'use client';

import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, Tooltip, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { getChartDataAction } from '@/app/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

type ChartData = {
    date: string;
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

    useEffect(() => {
        getChartDataAction()
            .then(chartData => {
                const formattedData = chartData.map(d => ({
                    ...d,
                    date: format(new Date(d.date), 'MMM d'), // Format date for display
                }))
                setData(formattedData);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

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
            <CardHeader>
                <CardTitle>Listings Approved Daily</CardTitle>
                <CardDescription>Number of listings approved in the last 30 days.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[350px] w-full">
                    <BarChart accessibilityLayer data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
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
            </CardContent>
        </Card>
    )
}

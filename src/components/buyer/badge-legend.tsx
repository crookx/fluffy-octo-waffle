'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Check, Gem, Trophy } from 'lucide-react';

/**
 * BadgeLegend - Explains what trust badges mean
 * Shows what Gold, Silver, and Bronze badges represent
 */
export function BadgeLegend({
  distribution,
}: {
  distribution?: Partial<Record<'Gold' | 'Silver' | 'Bronze', number>>;
}) {
  const total = (distribution?.Gold || 0) + (distribution?.Silver || 0) + (distribution?.Bronze || 0);
  const pct = (value: number) => (total > 0 ? `${Math.round((value / total) * 100)}% of listings` : 'No data yet');

  const badges = [
    {
      name: 'Gold',
      icon: Trophy,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
      percentage: pct(distribution?.Gold || 0),
      requirements: ['Title deed uploaded', 'Land survey uploaded', 'Rate clearance uploaded', 'Seller ID verified', '3+ photos uploaded'],
      description: 'Highest trust level with complete and verified legal documentation.',
    },
    {
      name: 'Silver',
      icon: Gem,
      color: 'text-slate-600',
      bg: 'bg-slate-100',
      percentage: pct(distribution?.Silver || 0),
      requirements: ['Title deed or survey uploaded', 'Seller ID verified', '2+ photos uploaded'],
      description: 'Strong documentation coverage with key records verified.',
    },
    {
      name: 'Bronze',
      icon: Award,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
      percentage: pct(distribution?.Bronze || 0),
      requirements: ['At least one document uploaded', 'Basic listing information complete'],
      description: 'Starter trust level with basic documentation submitted.',
    },
  ];

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader>
        <CardTitle className="text-lg">Understanding Trust Badges</CardTitle>
        <CardDescription>
          Compare documentation quality instantly so you can prioritize the listings with the strongest proof.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {badges.map((badge) => {
            const Icon = badge.icon;
            return (
              <div key={badge.name} className="space-y-3 rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`rounded-full p-2 ${badge.bg}`}>
                      <Icon className={`h-5 w-5 ${badge.color}`} />
                    </div>
                    <span className="font-semibold">{badge.name} Badge</span>
                  </div>
                  <Badge variant="outline">{badge.percentage}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{badge.description}</p>
                <ul className="space-y-1.5 text-xs text-foreground/80">
                  {badge.requirements.map((requirement) => (
                    <li key={requirement} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 text-primary" />
                      <span>{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 dark:border-blue-800">
          💡 <strong>Note:</strong> Badges indicate documentation quality, not a legal guarantee of title. Always conduct your own due diligence and consult with a lawyer before purchasing.
        </p>
      </CardContent>
    </Card>
  );
}

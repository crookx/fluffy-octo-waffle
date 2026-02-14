import { Badge } from '@/components/ui/badge';
import type { BadgeValue } from '@/lib/types';
import {
  Award,
  BadgeCheck,
  Check,
  Shield,
  ShieldQuestion,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type BadgeInfo = {
  variant: 'gold' | 'silver' | 'bronze' | 'secondary';
  icon: React.ElementType;
  label: string;
  subtitle: string;
  requirements: string[];
};

const badgeMap: Record<BadgeValue, BadgeInfo> = {
  Gold: {
    variant: 'gold',
    icon: Award,
    label: 'Gold Verified',
    subtitle: 'Highest trust level',
    requirements: [
      'Title deed uploaded',
      'Land survey uploaded',
      'Rate clearance uploaded',
      'Seller ID verified',
      '3+ photos uploaded',
    ],
  },
  Silver: {
    variant: 'silver',
    icon: BadgeCheck,
    label: 'Silver Verified',
    subtitle: 'Strong trust level',
    requirements: ['Title deed or survey uploaded', 'Seller ID verified', '2+ photos uploaded'],
  },
  Bronze: {
    variant: 'bronze',
    icon: Shield,
    label: 'Bronze',
    subtitle: 'Basic trust level',
    requirements: ['At least one document uploaded', 'Basic listing information complete'],
  },
  None: {
    variant: 'secondary',
    icon: ShieldQuestion,
    label: 'Not Badged',
    subtitle: 'No trust level assigned yet',
    requirements: ['Listing has insufficient verified evidence at the moment'],
  },
};

const badgeVariants = {
  gold: "bg-yellow-400/20 text-yellow-700 border-yellow-400/50 hover:bg-yellow-400/30",
  silver: "bg-slate-400/20 text-slate-700 border-slate-400/50 hover:bg-slate-400/30",
  bronze: "bg-amber-600/20 text-amber-800 border-amber-600/50 hover:bg-amber-600/30",
  secondary: "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80",
};

export function TrustBadge({
  badge,
  className,
  showTooltip = true,
}: {
  badge: BadgeValue | null;
  className?: string;
  showTooltip?: boolean;
}) {
  if (!badge) return null;
  const { variant, icon: Icon, label, subtitle, requirements } = badgeMap[badge];

  const BadgeComponent = (
    <Badge
      className={cn(
        'cursor-help',
        badgeVariants[variant],
        className
      )}
    >
      <Icon className="mr-1.5 h-3.5 w-3.5" />
      {label}
    </Badge>
  );

  if (!showTooltip) {
    return BadgeComponent;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
          {BadgeComponent}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className={cn('rounded-full p-2', badgeVariants[variant])}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{label}</h3>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Requirements met:</p>
            <div className="space-y-2">
              {requirements.map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

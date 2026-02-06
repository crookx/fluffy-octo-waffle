import { Badge } from '@/components/ui/badge';
import type { BadgeValue } from '@/lib/types';
import {
  Award,
  BadgeCheck,
  Shield,
  ShieldQuestion,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type BadgeInfo = {
  variant: 'gold' | 'silver' | 'bronze' | 'secondary';
  icon: React.ElementType;
  label: string;
  description: string;
};

const badgeMap: Record<BadgeValue, BadgeInfo> = {
  Gold: {
    variant: 'gold',
    icon: Award,
    label: 'Gold',
    description: 'Highest trust level based on submitted documents. Not a legal guarantee.',
  },
  Silver: {
    variant: 'silver',
    icon: BadgeCheck,
    label: 'Silver',
    description: 'High trust level based on submitted documents. Not a legal guarantee.',
  },
  Bronze: {
    variant: 'bronze',
    icon: Shield,
    label: 'Bronze',
    description: 'Good trust level based on submitted documents. Not a legal guarantee.',
  },
  None: {
    variant: 'secondary',
    icon: ShieldQuestion,
    label: 'Not Badged',
    description: 'No trust badge assigned yet. Verification may be incomplete.',
  },
};

const badgeVariants = {
  gold: "bg-yellow-400/20 text-yellow-700 border-yellow-400/50 hover:bg-yellow-400/30",
  silver: "bg-slate-400/20 text-slate-700 border-slate-400/50 hover:bg-slate-400/30",
  bronze: "bg-amber-600/20 text-amber-800 border-amber-600/50 hover:bg-amber-600/30",
  secondary: "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80",
}

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
  const { variant, icon: Icon, label, description } = badgeMap[badge];

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
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          {BadgeComponent}
        </TooltipTrigger>
        <TooltipContent>
          <p>{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

import { Badge } from '@/components/ui/badge';
import type { ListingStatus } from '@/lib/types';
import {
  ShieldCheck,
  ShieldAlert,
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
  variant: 'success' | 'destructive' | 'secondary' | 'warning' | 'outline';
  icon: React.ElementType;
  label: string;
  description: string;
};

const badgeMap: Record<ListingStatus, BadgeInfo> = {
  approved: {
    variant: 'success',
    icon: ShieldCheck,
    label: 'Approved',
    description: 'Reviewed based on seller-submitted documents. Approval is not a legal guarantee of title.',
  },
  pending: {
    variant: 'warning',
    icon: ShieldQuestion,
    label: 'Pending',
    description: 'Submitted for review. No approval or verification has been completed yet.',
  },
  rejected: {
    variant: 'destructive',
    icon: ShieldAlert,
    label: 'Rejected',
    description: 'Rejected after review of submitted information. Do not proceed without independent verification.',
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: ListingStatus;
  className?: string;
}) {
  const { variant, icon: Icon, label, description } = badgeMap[status];

  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <Badge
            variant={variant}
            className={cn('cursor-help', className)}
          >
            <Icon className="mr-1.5 h-3.5 w-3.5" />
            {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

import type { LucideIcon } from 'lucide-react';
import { PageHeader } from '../ui/PageHeader';
import { EmptyState } from '../ui/EmptyState';

interface ComingSoonProps {
  title: string;
  description: string;
  icon: LucideIcon;
  phase: string;
}

export function ComingSoon({
  title,
  description,
  icon,
  phase,
}: ComingSoonProps) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={icon}
        title={`${title} — coming in ${phase}`}
        description="This module is part of the phased ERP rollout. The foundation, navigation, and design system are live; full functionality lands in the upcoming build phase."
      />
    </div>
  );
}

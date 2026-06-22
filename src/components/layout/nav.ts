import {
  LayoutDashboard,
  Calendar,
  FolderKanban,
  Users2,
  Contact,
  Package,
  FileText,
  ReceiptText,
  Wallet,
  Bell,
  Lock,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '../../types/roles';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  roles?: UserRole[]; // undefined = all authenticated users
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', to: '/', icon: LayoutDashboard },
      { label: 'Calendar', to: '/calendar', icon: Calendar },
      { label: 'Projects', to: '/projects', icon: FolderKanban },
    ],
  },
  {
    title: 'Directory',
    items: [
      {
        label: 'Clients',
        to: '/clients',
        icon: Users2,
        roles: ['super_admin', 'admin', 'senior_manager', 'manager'],
      },
      {
        label: 'Employees',
        to: '/employees',
        icon: Contact,
        roles: ['super_admin', 'admin', 'senior_manager', 'manager'],
      },
      { label: 'Materials', to: '/materials', icon: Package },
    ],
  },
  {
    title: 'Finance',
    items: [
      {
        label: 'Quotations',
        to: '/quotations',
        icon: FileText,
        roles: ['super_admin', 'admin', 'senior_manager', 'manager'],
      },
      {
        label: 'Invoices',
        to: '/invoices',
        icon: ReceiptText,
        roles: ['super_admin', 'admin', 'senior_manager', 'manager'],
      },
      {
        label: 'Personal Accounts',
        to: '/admin/accounts',
        icon: Wallet,
        roles: ['super_admin'],
      },
    ],
  },
  {
    title: 'Admin',
    items: [
      { label: 'Notifications', to: '/admin/notifications', icon: Bell },
      {
        label: 'Users',
        to: '/users',
        icon: ShieldCheck,
        roles: ['super_admin', 'admin'],
      },
      { label: 'Settings', to: '/settings', icon: Settings },
    ],
  },
];

export const LOCK_ICON = Lock;

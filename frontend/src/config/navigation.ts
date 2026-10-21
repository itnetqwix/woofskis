export interface NavItem {
  title: string;
  href: string;
  disabled?: boolean;
  external?: boolean;
  icon?: string;
  badge?: string;
}

export interface SidebarNavItem extends NavItem {
  items?: NavItem[];
}

export const mainNavConfig: NavItem[] = [
  {
    title: 'Contests',
    href: '/contests',
  },
  {
    title: 'Leaderboard',
    href: '/leaderboard',
  },
  {
    title: 'About Woofskis',
    href: '/about',
  },
  {
    title: 'Submissions',
    href: '/submissions',
  },
  {
    title: 'Docs',
    href: '/docs',
    external: true,
  },
];

export const dashboardNavConfig: SidebarNavItem[] = [
  {
    title: 'Overview',
    href: '/dashboard',
    icon: 'LayoutDashboard',
  },
  {
    title: 'Contests',
    href: '/dashboard/contests',
    icon: 'Trophy',
  },
  {
    title: 'Submissions',
    href: '/dashboard/submissions',
    icon: 'UploadCloud',
  },
  {
    title: 'Judging & Scoring',
    href: '/dashboard/judging',
    icon: 'Scale',
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: 'BarChart3',
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: 'Settings',
  },
];

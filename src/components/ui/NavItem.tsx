'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItemProps {
  href: string;
  icon: string;
  label: string;
  badge?: number;
  badgeVariant?: 'gold' | 'teal';
}

export default function NavItem({ href, icon, label, badge, badgeVariant = 'teal' }: NavItemProps) {
  const pathname = usePathname();
  const isActive =
    href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname === href || pathname.startsWith(href + '/');

  return (
    <Link href={href} className={`nav-item${isActive ? ' active' : ''}`}>
      <span>{icon}</span>
      {label}
      {badge !== undefined && badge > 0 && (
        <span className={`badge${badgeVariant === 'teal' ? ' teal' : ''}`}>{badge}</span>
      )}
    </Link>
  );
}

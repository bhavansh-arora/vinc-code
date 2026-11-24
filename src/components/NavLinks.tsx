'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const path = usePathname();
  return (
    <nav className="nav" aria-label="Main">
      {links.map(l => {
        const active = path === l.href || (l.href.split('/').length > 2 && path.startsWith(l.href));
        return <Link key={l.href} href={l.href} aria-current={active ? 'page' : undefined}>{l.label}</Link>;
      })}
    </nav>
  );
}

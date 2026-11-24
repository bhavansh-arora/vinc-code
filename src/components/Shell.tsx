import Link from 'next/link';
import VincArt from './VincArt';
import NavLinks from './NavLinks';
import { logoutAction } from '@/app/login/actions';
import { ROLE_HOME, ROLE_LABEL, type User } from '@/lib/types';

const NAV: Record<User['role'], { href: string; label: string }[]> = {
  admin: [{ href: '/admin', label: 'Overview' }, { href: '/admin/messages', label: 'Messages' }, { href: '/lessons', label: 'Lessons' }, { href: '/assessments', label: 'Assessment bank' }],
  school: [{ href: '/school', label: 'Overview' }, { href: '/lessons', label: 'Lessons' }, { href: '/assessments', label: 'Assessment bank' }],
  teacher: [{ href: '/teacher', label: 'My classes' }, { href: '/lessons', label: 'Lessons' }, { href: '/assessments', label: 'Assessment bank' }],
  student: [{ href: '/student', label: 'My dashboard' }, { href: '/play', label: 'Play' }, { href: '/student/lessons', label: 'Lessons' }, { href: '/game', label: 'Workshop' }],
  parent: [{ href: '/parent', label: 'My children' }]
};

export default function Shell({ user, children }: { user: User; children: React.ReactNode }) {
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link href={ROLE_HOME[user.role]} className="brand"><VincArt label="" /> VINC Code</Link>
          <NavLinks links={NAV[user.role]} />
          <div className="who">
            <span><span className="role">{ROLE_LABEL[user.role]}</span><br />{user.name}</span>
            <Link className="btn small quiet" href="/account">Password</Link>
            <form action={logoutAction}><button className="btn small">Log out</button></form>
          </div>
        </div>
      </header>
      <main className="container">{children}</main>
    </>
  );
}

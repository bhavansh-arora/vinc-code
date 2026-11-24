'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import VincArt from '@/components/VincArt';
import { canSpeak, settings, sfx } from './fx';
import { setMusicOn } from './music';
import type { GameUser } from './types';

/** The slim game bar: logo, where you are, sound and voice switches, and who is playing. */
export default function GameTop({ user, children, back }: { user: GameUser | null; children?: React.ReactNode; back?: { href: string; label: string } }) {
  const [sound, setSound] = useState(true), [voice, setVoice] = useState(true), [speech, setSpeech] = useState(false), [music, setMusic] = useState(true);
  useEffect(() => { setSound(settings.sound); setVoice(settings.voice); setMusic(settings.music); setSpeech(canSpeak()); }, []);
  const home = user ? (user.role === 'student' ? '/student' : user.role === 'parent' ? '/parent' : '/' + user.role) : '/';
  return (
    <header className="gm-top">
      <Link href={home} className="gm-brand" aria-label="VINC Code home"><VincArt label="" /><span>VINC Code</span></Link>
      {back && <Link href={back.href} className="gm-back" aria-label={back.label}>← <span>{back.label}</span></Link>}
      <div className="gm-where">{children}</div>
      <div className="gm-tools">
        <button type="button" className="gm-tool" aria-pressed={music} onClick={() => { setMusicOn(!music); setMusic(!music); }} title={music ? 'Music on' : 'Music off'} aria-label="Music">{music ? '🎵' : '🎶'}</button>
        <button type="button" className="gm-tool" aria-pressed={sound} onClick={() => { settings.sound = !sound; setSound(!sound); sfx('click'); }} title={sound ? 'Sound on' : 'Sound off'} aria-label="Sound effects">{sound ? '🔊' : '🔇'}</button>
        {speech && <button type="button" className="gm-tool" aria-pressed={voice} onClick={() => { settings.voice = !voice; setVoice(!voice); }} title={voice ? 'Voice on' : 'Voice off'} aria-label="Read instructions aloud">{voice ? '🗣️' : '🤐'}</button>}
        {user ? <span className="gm-user" title={user.name}>{user.name.split(' ')[0]}</span>
          : <><Link className="gm-login" href="/login">Log in</Link><Link className="gm-signup" href="/signup">Sign up</Link></>}
      </div>
    </header>
  );
}

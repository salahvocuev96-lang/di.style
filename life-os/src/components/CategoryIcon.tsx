import {
  Apple, BookOpen, Brain, Code, Dumbbell, GraduationCap, Heart, Languages, Moon, Sparkles, Briefcase, Music, Palette, Wallet,
  type LucideIcon,
} from 'lucide-react'

export const ICONS: Record<string, LucideIcon> = {
  dumbbell: Dumbbell, code: Code, languages: Languages, 'graduation-cap': GraduationCap, apple: Apple,
  moon: Moon, sparkles: Sparkles, book: BookOpen, brain: Brain, heart: Heart, briefcase: Briefcase,
  music: Music, palette: Palette, wallet: Wallet,
}

export function CategoryIcon({ icon, color, size = 18 }: { icon: string; color: string; size?: number }) {
  const I = ICONS[icon] ?? Sparkles
  return (
    <span className="inline-grid place-items-center rounded-xl shrink-0" style={{ background: color + '1f', color, width: size + 16, height: size + 16 }}>
      <I size={size} />
    </span>
  )
}

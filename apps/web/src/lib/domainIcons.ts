/**
 * domainIcons — registry of lucide icons users can pick when creating
 * a domain. Storing the name (string) on the row lets us swap the icon
 * set later without a migration.
 *
 * Keep the list short and broadly useful — too many choices makes the
 * picker overwhelming. Add icons here when a real use case shows up.
 */
import {
  BookOpen, Music, Dumbbell, Palette, Languages,
  Code, Calculator, HeartPulse, Brain, Briefcase,
  Camera, PenTool, Microscope, Globe, ChefHat,
  Gamepad2, Wrench, Sprout,
  type LucideIcon,
} from 'lucide-react';

export interface DomainIconOption {
  /** The string stored in `domains.icon`. Stable — don't rename. */
  id:        string;
  /** The actual lucide component used to render it. */
  component: LucideIcon;
  /** Short label shown on hover/in the picker. */
  label:     string;
}

export const DOMAIN_ICONS: DomainIconOption[] = [
  { id: 'BookOpen',   component: BookOpen,   label: 'Academic / Reading' },
  { id: 'Music',      component: Music,      label: 'Music' },
  { id: 'Dumbbell',   component: Dumbbell,   label: 'Physical / Fitness' },
  { id: 'Palette',    component: Palette,    label: 'Creative / Art' },
  { id: 'Languages',  component: Languages,  label: 'Languages' },
  { id: 'Code',       component: Code,       label: 'Coding' },
  { id: 'Calculator', component: Calculator, label: 'Math / Numbers' },
  { id: 'HeartPulse', component: HeartPulse, label: 'Health' },
  { id: 'Brain',      component: Brain,      label: 'Personal growth' },
  { id: 'Briefcase',  component: Briefcase,  label: 'Career' },
  { id: 'Camera',     component: Camera,     label: 'Photography' },
  { id: 'PenTool',    component: PenTool,    label: 'Writing' },
  { id: 'Microscope', component: Microscope, label: 'Science' },
  { id: 'Globe',      component: Globe,      label: 'Travel / Geography' },
  { id: 'ChefHat',    component: ChefHat,    label: 'Cooking' },
  { id: 'Gamepad2',   component: Gamepad2,   label: 'Games' },
  { id: 'Wrench',     component: Wrench,     label: 'Crafting / DIY' },
  { id: 'Sprout',     component: Sprout,     label: 'Gardening / Other' },
];

/** Look up the lucide component for a stored icon id. Falls back to
 *  BookOpen so legacy / unknown values render gracefully. */
export function getDomainIcon(id: string | null | undefined): LucideIcon {
  if (!id) return BookOpen;
  return DOMAIN_ICONS.find((o) => o.id === id)?.component ?? BookOpen;
}

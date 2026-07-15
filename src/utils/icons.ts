import {
  LayoutDashboard, Users, Stethoscope, CalendarDays, ReceiptText, Package,
  BarChart3, Settings, UserCog, HeartPulse, CalendarClock,
  Heart, Brain, Bone, Baby, Sparkles, Ribbon, Scan,
  Siren, Ear, Eye, Flower, Droplets, Activity, UserPlus, Pill, Bell, type LucideIcon,
} from 'lucide-react';

export const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard, Users, Stethoscope, CalendarDays, ReceiptText, Package,
  BarChart3, Settings, UserCog, HeartPulse, CalendarClock,
  Heart, Brain, Bone, Baby, Sparkles, Ribbon, Scan,
  Siren, Ear, Eye, Flower, Droplets, Activity, UserPlus, Pill, Bell,
};


export function getIcon(name: string): LucideIcon {
  return iconMap[name] ?? Activity;
}

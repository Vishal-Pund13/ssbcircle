import {
  UserRound, IdCard, House, Heart, Shield, Star, Anchor, Plane, Radar, Crosshair, Satellite,
  Globe, Handshake, Flag, IndianRupee, TrendingUp, ChartColumn, Landmark, Scale, Vote, ScrollText,
  Users, HeartHandshake, GraduationCap, Rocket, Atom, Cpu, Mountain, Trees, Sun, Droplets, BookOpen,
} from 'lucide-react';

// Look of each Prep Sheet section: a soft tint, an accent colour, a main icon
// and a few smaller themed icons scattered faintly over the cover as its
// illustration. Kept light on purpose — bold gradients read as loud.
// Class strings are written out in full so Tailwind keeps them.
// Keyed by STEPS[].id in data/prepSheet.js; unknown ids fall back to DEFAULT.

export const STEP_THEMES = {
  self: {
    icon: UserRound, deco: [IdCard, House, Heart],
    soft: 'bg-violet-50', text: 'text-violet-700', bar: 'bg-violet-500', ring: 'ring-violet-200',
  },
  forces: {
    icon: Shield, deco: [Star, Anchor, Plane],
    soft: 'bg-emerald-50', text: 'text-emerald-700', bar: 'bg-emerald-600', ring: 'ring-emerald-200',
  },
  defence: {
    icon: Radar, deco: [Crosshair, Satellite, Shield],
    soft: 'bg-slate-100', text: 'text-slate-700', bar: 'bg-slate-700', ring: 'ring-slate-300',
  },
  ir: {
    icon: Globe, deco: [Handshake, Plane, Flag],
    soft: 'bg-sky-50', text: 'text-sky-700', bar: 'bg-sky-500', ring: 'ring-sky-200',
  },
  economy: {
    icon: IndianRupee, deco: [TrendingUp, ChartColumn, Landmark],
    soft: 'bg-amber-50', text: 'text-amber-700', bar: 'bg-amber-500', ring: 'ring-amber-200',
  },
  polity: {
    icon: Landmark, deco: [Scale, Vote, ScrollText],
    soft: 'bg-indigo-50', text: 'text-indigo-700', bar: 'bg-indigo-500', ring: 'ring-indigo-200',
  },
  society: {
    icon: Users, deco: [HeartHandshake, GraduationCap, Heart],
    soft: 'bg-rose-50', text: 'text-rose-700', bar: 'bg-rose-500', ring: 'ring-rose-200',
  },
  scitech: {
    icon: Rocket, deco: [Atom, Cpu, Satellite],
    soft: 'bg-cyan-50', text: 'text-cyan-700', bar: 'bg-cyan-600', ring: 'ring-cyan-200',
  },
  environment: {
    icon: Mountain, deco: [Trees, Sun, Droplets],
    soft: 'bg-green-50', text: 'text-green-700', bar: 'bg-green-600', ring: 'ring-green-200',
  },
};

const DEFAULT = {
  icon: BookOpen, deco: [Star, Globe, Shield],
  soft: 'bg-brand-50', text: 'text-brand-700', bar: 'bg-brand-600', ring: 'ring-brand-200',
};

export const themeFor = id => STEP_THEMES[id] || DEFAULT;

import { SubmissionCategory } from '@/types/creator';

/**
 * Category labels for the creator and moderation filters.
 * There is no creator category-list API. Submission rows are loaded from
 * GET /submissions/me.
 */
export const SUBMISSION_CATEGORIES: {
  name: SubmissionCategory;
  color: string;
  description: string;
}[] = [
  {
    name: 'VFX Skit',
    color: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
    description: 'Blended CGI, green screen humor, and visual effects sketches.',
  },
  {
    name: 'Standup Comedy',
    color: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
    description: 'Punchy stage bits, crowd work, and observational punchlines.',
  },
  {
    name: 'Parody',
    color: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
    description: 'Satirical impressions, movie mockups, and cultural parodies.',
  },
  {
    name: 'Street Comedy',
    color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    description: 'Public interaction, humorous social experiments, and improv.',
  },
  {
    name: 'Motion Graphics',
    color: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
    description: 'Kinetic typography, abstract animation, and beat-matched graphics.',
  },
  {
    name: 'Action Sports',
    color: 'border-orange-500/30 text-orange-400 bg-orange-500/10',
    description: 'High-adrenaline skate, parkour, longboard, and extreme sports lines.',
  },
  {
    name: 'Sci-Fi Short',
    color: 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10',
    description: 'Futuristic narratives, cyberpunk lore, and mecha mini-films.',
  },
  {
    name: '3D Animation',
    color: 'border-pink-500/30 text-pink-400 bg-pink-500/10',
    description: 'Stylized 3D character animations, fur sim, and procedural worlds.',
  },
];

'use client';

import { useEffect, useState } from 'react';
import { useTenantTheme } from '@/features/admin/hooks/use-tenant-theme';
import {
  isRipskisBrand,
  PawRatingIcon,
  JointRatingIcon,
} from '@/features/judging/components/brand-rating-icons';

/**
 * Particle definitions for floating celebration animations.
 * Tuned with staggered delays, lateral drift, and gentle spin.
 */
const PARTICLES = [
  {
    left: '48%',
    bottom: '22%',
    delay: '0ms',
    drift: '-8px',
    spin: '-8deg',
    size: 46,
    duration: '1080ms',
    rise: '-32vh',
  },
  {
    left: '60%',
    bottom: '20%',
    delay: '60ms',
    drift: '16px',
    spin: '14deg',
    size: 42,
    duration: '980ms',
    rise: '-28vh',
  },
  {
    left: '38%',
    bottom: '24%',
    delay: '120ms',
    drift: '-20px',
    spin: '-18deg',
    size: 34,
    duration: '1120ms',
    rise: '-34vh',
  },
  {
    left: '54%',
    bottom: '18%',
    delay: '180ms',
    drift: '10px',
    spin: '10deg',
    size: 38,
    duration: '900ms',
    rise: '-26vh',
  },
  {
    left: '32%',
    bottom: '21%',
    delay: '40ms',
    drift: '-26px',
    spin: '22deg',
    size: 36,
    duration: '1160ms',
    rise: '-38vh',
  },
  {
    left: '66%',
    bottom: '23%',
    delay: '110ms',
    drift: '22px',
    spin: '-16deg',
    size: 36,
    duration: '840ms',
    rise: '-24vh',
  },
  {
    left: '44%',
    bottom: '16%',
    delay: '30ms',
    drift: '-10px',
    spin: '6deg',
    size: 34,
    duration: '1200ms',
    rise: '-40vh',
  },
  {
    left: '58%',
    bottom: '26%',
    delay: '140ms',
    drift: '12px',
    spin: '-22deg',
    size: 32,
    duration: '760ms',
    rise: '-20vh',
  },
  {
    left: '40%',
    bottom: '19%',
    delay: '70ms',
    drift: '-14px',
    spin: '12deg',
    size: 32,
    duration: '1040ms',
    rise: '-34vh',
  },
  {
    left: '52%',
    bottom: '28%',
    delay: '10ms',
    drift: '2px',
    spin: '-4deg',
    size: 30,
    duration: '940ms',
    rise: '-30vh',
  },
  {
    left: '68%',
    bottom: '17%',
    delay: '160ms',
    drift: '28px',
    spin: '20deg',
    size: 28,
    duration: '800ms',
    rise: '-22vh',
  },
  {
    left: '34%',
    bottom: '25%',
    delay: '80ms',
    drift: '-30px',
    spin: '-24deg',
    size: 28,
    duration: '1100ms',
    rise: '-36vh',
  },
  {
    left: '46%',
    bottom: '14%',
    delay: '120ms',
    drift: '-8px',
    spin: '16deg',
    size: 26,
    duration: '700ms',
    rise: '-18vh',
  },
  {
    left: '62%',
    bottom: '27%',
    delay: '60ms',
    drift: '18px',
    spin: '-12deg',
    size: 26,
    duration: '1180ms',
    rise: '-42vh',
  },
  {
    left: '38%',
    bottom: '15%',
    delay: '170ms',
    drift: '-18px',
    spin: '26deg',
    size: 24,
    duration: '860ms',
    rise: '-23vh',
  },
  {
    left: '56%',
    bottom: '21%',
    delay: '100ms',
    drift: '6px',
    spin: '-10deg',
    size: 24,
    duration: '1000ms',
    rise: '-29vh',
  },
];

const CSS = `
@keyframes cos-star-rise {
  0% { transform: translate3d(0, 8px, 0) rotate(0deg) scale(0.6); opacity: 0; }
  18% { opacity: 1; }
  85% { opacity: 0.9; }
  100% { transform: translate3d(var(--drift), var(--rise), 0) rotate(var(--spin)) scale(1.05); opacity: 0; }
}
@keyframes cos-star-fade {
  0% { opacity: 0; }
  35% { opacity: 1; }
  100% { opacity: 0; }
}
.cos-star-particle {
  position: absolute;
  animation: cos-star-rise var(--duration) ease-out var(--delay) both;
  pointer-events: none;
}
@media (prefers-reduced-motion: reduce) {
  .cos-star-particle {
    animation: cos-star-fade 280ms ease-out var(--delay) both;
  }
}
`;

/**
 * Post-Rating Floating Celebration
 *
 * Staggered lightweight animation appearing when a user submits a rating.
 * Displays floating Paw Prints for Woofskis (#fa4616) and floating Rolled Joints
 * for Ripskis (#8BC144). Uses approximately 4 floating icons for smooth, non-intrusive feedback.
 */
export function StarCelebration({
  burstId,
  brand,
}: {
  burstId: number;
  brand?: string;
}) {
  const { activeBrand } = useTenantTheme();
  const effectiveBrand = brand || activeBrand?.slug || activeBrand?.id || 'woofskis';
  const isRipskis = isRipskisBrand(effectiveBrand);

  const [visible, setVisible] = useState(0);

  useEffect(() => {
    if (burstId === 0) return;
    setVisible(burstId);
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setVisible(0), reduced ? 360 : 1450);
    return () => window.clearTimeout(timer);
  }, [burstId]);

  if (visible === 0) return null;

  // Staggered lightweight subset: exactly 4 icons (within 3-5 requirement)
  const activeParticles = PARTICLES.slice(0, 4);

  return (
    <div
      key={visible}
      className="pointer-events-none fixed inset-0 z-[80] overflow-hidden"
      aria-hidden="true"
      data-star-celebration=""
      data-rating-celebration=""
      data-star-count={PARTICLES.length}
      data-active-particles={activeParticles.length}
      data-brand={isRipskis ? 'ripskis' : 'woofskis'}
    >
      <style>{CSS}</style>
      {activeParticles.map((particle, index) => (
        <span
          key={`${visible}-${index}`}
          className="cos-star-particle"
          style={{
            left: particle.left,
            bottom: particle.bottom,
            ['--drift' as string]: particle.drift,
            ['--spin' as string]: particle.spin,
            ['--delay' as string]: particle.delay,
            ['--duration' as string]: particle.duration,
            ['--rise' as string]: particle.rise,
          }}
        >
          {isRipskis ? (
            <JointRatingIcon
              filled
              className="fill-[#8BC144] text-[#8BC144] drop-shadow-[0_0_12px_rgba(139,193,68,0.6)]"
              style={{ width: particle.size, height: particle.size }}
            />
          ) : (
            <PawRatingIcon
              filled
              className="fill-[#fa4616] text-[#fa4616] drop-shadow-[0_0_12px_rgba(250,70,22,0.5)]"
              style={{ width: particle.size, height: particle.size }}
            />
          )}
        </span>
      ))}
    </div>
  );
}

export { StarCelebration as RatingCelebration };

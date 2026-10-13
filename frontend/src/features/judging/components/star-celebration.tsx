'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';

/** Burst from the rating zone. Sizes: 24–28, 30–34, 36–40, and two hero stars. */
const PARTICLES = [
  {
    left: '48%',
    bottom: '22%',
    delay: '0ms',
    drift: '-4px',
    spin: '-8deg',
    size: 46,
    duration: '1080ms',
    rise: '-32vh',
  },
  {
    left: '60%',
    bottom: '20%',
    delay: '50ms',
    drift: '16px',
    spin: '14deg',
    size: 42,
    duration: '980ms',
    rise: '-28vh',
  },
  {
    left: '36%',
    bottom: '24%',
    delay: '20ms',
    drift: '-20px',
    spin: '-18deg',
    size: 40,
    duration: '1120ms',
    rise: '-36vh',
  },
  {
    left: '54%',
    bottom: '18%',
    delay: '90ms',
    drift: '8px',
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
  0% { transform: translate3d(0, 8px, 0) rotate(0deg) scale(0.55); opacity: 0; }
  18% { opacity: 1; }
  100% { transform: translate3d(var(--drift), var(--rise), 0) rotate(var(--spin)) scale(1); opacity: 0; }
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

export function StarCelebration({ burstId }: { burstId: number }) {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    if (burstId === 0) return;
    setVisible(burstId);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setVisible(0), reduced ? 360 : 1450);
    return () => window.clearTimeout(timer);
  }, [burstId]);

  if (visible === 0) return null;

  return (
    <div
      key={visible}
      className="pointer-events-none fixed inset-0 z-[80] overflow-hidden"
      aria-hidden="true"
      data-star-celebration=""
      data-star-count={PARTICLES.length}
    >
      <style>{CSS}</style>
      {PARTICLES.map((particle, index) => (
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
          <Star
            strokeWidth={2}
            className="fill-[#8BC144] text-[#8BC144]"
            style={{ width: particle.size, height: particle.size }}
          />
        </span>
      ))}
    </div>
  );
}

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  isRipskisBrand,
  PawRatingIcon,
  JointRatingIcon,
  BrandRatingGlyph,
} from '../../src/features/judging/components/brand-rating-icons';
import { deploymentBrandPlaceholder } from '../../src/lib/theme-utils';

const ROOT = join(__dirname, '../..');

describe('Brand-Specific Rating Icons and Post-Rating Celebrations', () => {
  describe('Brand Configuration and Theme Identification', () => {
    it('accurately identifies Ripskis vs Woofskis without using fragile URL matching', () => {
      // Direct string slug or ID
      assert.equal(isRipskisBrand('ripskis'), true);
      assert.equal(isRipskisBrand('RIPSKIS'), true);
      assert.equal(isRipskisBrand('  ripskis  '), true);
      assert.equal(isRipskisBrand('woofskis'), false);
      assert.equal(isRipskisBrand('adidas'), false);
      assert.equal(isRipskisBrand(null), false);
      assert.equal(isRipskisBrand(undefined), false);

      // TenantBrandConfig objects
      assert.equal(isRipskisBrand({ slug: 'ripskis' }), true);
      assert.equal(isRipskisBrand({ id: 'ripskis' }), true);
      assert.equal(isRipskisBrand({ name: 'Ripskis' }), true);
      assert.equal(isRipskisBrand({ slug: 'woofskis', name: 'Woofskis' }), false);
    });

    it('generates proper placeholder brand palettes for Woofskis and Ripskis', () => {
      const woofskis = deploymentBrandPlaceholder('woofskis');
      assert.equal(woofskis.id, 'woofskis');
      assert.equal(woofskis.name, 'Woofskis');
      assert.equal(woofskis.colors.primary, '#fa4616');
      assert.equal(woofskis.colors.accent, '#3e2717');
      assert.equal(woofskis.customDomain, 'woofskis.com');

      const ripskis = deploymentBrandPlaceholder('ripskis');
      assert.equal(ripskis.id, 'ripskis');
      assert.equal(ripskis.name, 'Ripskis');
      assert.equal(ripskis.colors.primary, '#8bc144');
      assert.equal(ripskis.colors.accent, '#13491e');
      assert.equal(ripskis.customDomain, 'ripskis.com');
    });
  });

  describe('Woofskis Paw-Print Rating Icon Architecture', () => {
    const iconSource = readFileSync(
      join(ROOT, 'src/features/judging/components/brand-rating-icons.tsx'),
      'utf8'
    );

    it('implements cute dog paw-print SVG with 4 distinct toe pads and a palm pad', () => {
      assert.ok(iconSource.includes('export function PawRatingIcon'));
      assert.ok(iconSource.includes('data-rating-glyph="paw"'));

      // 4 toe pad ellipses with rotated angles
      const ellipseMatches = iconSource.match(/<ellipse/g);
      assert.ok(ellipseMatches && ellipseMatches.length >= 4);

      // Metacarpal main palm pad path
      assert.ok(iconSource.includes('M7.8 12.8c-1.5 1.5-1.5 3.5-.2 5'));
    });

    it('distinguishes selected/filled paws from unselected outlines', () => {
      assert.ok(
        iconSource.includes("fill={filled ? 'currentColor' : 'none'}") ||
        iconSource.includes('fill={filled ? "currentColor" : "none"}')
      );
      assert.ok(iconSource.includes('stroke="currentColor"'));
      assert.ok(iconSource.includes('data-filled={filled ? \'true\' : \'false\'}'));
    });
  });

  describe('Ripskis Rolled Cannabis Joint Icon Architecture', () => {
    const iconSource = readFileSync(
      join(ROOT, 'src/features/judging/components/brand-rating-icons.tsx'),
      'utf8'
    );

    it('specifically models a slim hand-rolled cone joint with rolling paper, filter, and twisted tip', () => {
      assert.ok(iconSource.includes('export function JointRatingIcon'));
      assert.ok(iconSource.includes('data-rating-glyph="joint"'));

      // Tapered cone roll barrel with pointed twisted wick
      assert.ok(iconSource.includes('M4.2 18.2 L14 8.4 C15 7.4 16.2 6.8 17.5 7 L20.5 4'));

      // Filter crutch seam line
      assert.ok(
        iconSource.includes('x1="7.2"') &&
        iconSource.includes('y1="15.2"') &&
        iconSource.includes('x2="9.8"') &&
        iconSource.includes('y2="17.8"')
      );

      // Paper twist fold creases defining the hand-rolled twist
      assert.ok(iconSource.includes('M15.2 8.8 C16.2 7.8 17.5 8 18.5 9'));
      assert.ok(iconSource.includes('M17 6.8 C17.8 6.2 18.8 6.5 19.3 7.3'));
    });

    it('uses contrasting organic dark green filter seam and twist fold when filled with Ripskis green', () => {
      assert.ok(iconSource.includes("stroke={filled ? '#13491e' : 'currentColor'}"));
      assert.ok(iconSource.includes("fill={filled ? 'currentColor' : 'none'}"));
    });
  });

  describe('StarRating Component Brand Integration and Accessibility', () => {
    const ratingSource = readFileSync(
      join(ROOT, 'src/features/judging/components/star-rating.tsx'),
      'utf8'
    );

    it('embeds brand detection via useTenantTheme and isRipskisBrand', () => {
      assert.ok(ratingSource.includes('useTenantTheme'));
      assert.ok(ratingSource.includes('isRipskisBrand'));
      assert.ok(ratingSource.includes('data-brand={isRipskis ? \'ripskis\' : \'woofskis\'}'));
    });

    it('renders JointRatingIcon for Ripskis and PawRatingIcon for Woofskis', () => {
      assert.ok(ratingSource.includes('<JointRatingIcon'));
      assert.ok(ratingSource.includes('<PawRatingIcon'));
      assert.ok(ratingSource.includes('#8BC144'));
      assert.ok(ratingSource.includes('#fa4616'));
    });

    it('maintains full accessibility attributes and standard 1-10 scale', () => {
      assert.ok(ratingSource.includes('role={readOnly ? \'img\' : \'radiogroup\'}'));
      assert.ok(ratingSource.includes('role="radio"'));
      assert.ok(ratingSource.includes('aria-checked={value === star}'));
      assert.ok(ratingSource.includes('aria-label={`Rate ${star} out of ${starCount}`}'));
      assert.ok(ratingSource.includes('data-rating-stars={String(starCount)}'));
      assert.ok(ratingSource.includes('data-filled={on ? \'true\' : \'false\'}'));
      assert.ok(ratingSource.includes('scale = RATING_MAX'));
    });

    it('applies brand-specific focus rings and active background highlights', () => {
      assert.ok(ratingSource.includes('focus-visible:ring-[#8BC144]'));
      assert.ok(ratingSource.includes('focus-visible:ring-[#fa4616]'));
      assert.ok(ratingSource.includes("bg-[#8BC144]/15"));
      assert.ok(ratingSource.includes("bg-[#fa4616]/15"));
    });
  });

  describe('Post-Rating Floating Staggered Animation', () => {
    const celebrationSource = readFileSync(
      join(ROOT, 'src/features/judging/components/star-celebration.tsx'),
      'utf8'
    );

    it('uses approximately 3–5 staggered floating icons after submission', () => {
      // Slices exactly 4 particles for smooth, lightweight animation
      assert.ok(
        celebrationSource.includes('PARTICLES.slice(0, 4)') ||
        celebrationSource.includes('PARTICLES.slice(0, 5)')
      );
      assert.ok(celebrationSource.includes('data-active-particles='));
    });

    it('switches between floating JointRatingIcons for Ripskis and PawRatingIcons for Woofskis', () => {
      assert.ok(celebrationSource.includes('JointRatingIcon'));
      assert.ok(celebrationSource.includes('PawRatingIcon'));
      assert.ok(celebrationSource.includes('#8BC144'));
      assert.ok(celebrationSource.includes('#fa4616'));
    });

    it('respects prefers-reduced-motion accessibility preference', () => {
      assert.ok(celebrationSource.includes('prefers-reduced-motion: reduce'));
      assert.ok(celebrationSource.includes('window.matchMedia(\'(prefers-reduced-motion: reduce)\')'));
      assert.ok(celebrationSource.includes('pointer-events-none'));
    });
  });

  describe('Rating Bar and State Control', () => {
    const barSource = readFileSync(
      join(ROOT, 'src/features/judging/components/rating-bar.tsx'),
      'utf8'
    );

    it('does not display rating inputs when rating is closed', () => {
      assert.ok(barSource.includes('closed ? ('));
      assert.ok(barSource.includes('This contest has ended. You can still watch. Rating is closed.'));
      assert.ok(barSource.includes('data-rating-scale="10"'));
    });

    it('adapts progress and attention colors dynamically to the active brand', () => {
      assert.ok(barSource.includes("isRipskis ? 'bg-[#8BC144]' : 'bg-[#fa4616]'"));
      assert.ok(barSource.includes("isRipskis ? 'ring-2 ring-inset ring-[#8BC144]' : 'ring-2 ring-inset ring-[#fa4616]'"));
    });
  });
});

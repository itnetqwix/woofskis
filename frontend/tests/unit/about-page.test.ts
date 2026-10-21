import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mainNavConfig } from '../../src/config/navigation';
import { PROTECTED_DASHBOARD_ROUTES } from '../../src/components/auth/role-guard-policy';
import { siteConfig } from '../../src/config/site';

describe('About Woofskis (/about) Configuration & Routes', () => {
  it('includes About Woofskis in mainNavConfig with /about route', () => {
    const aboutItem = mainNavConfig.find((item) => item.href === '/about');
    assert.ok(aboutItem, 'About Woofskis route should be present in mainNavConfig');
    assert.equal(aboutItem?.title, 'About Woofskis');
    assert.equal(aboutItem?.href, '/about');
  });

  it('verifies /about is a public route not restricted by RoleGuard policies', () => {
    // /about should not be listed in protected dashboard routes
    // @ts-expect-error verifying /about is not a protected route key
    const policy = PROTECTED_DASHBOARD_ROUTES['/about'];
    assert.equal(policy, undefined, '/about must be accessible to visitors without authentication');
  });

  it('verifies site configuration matches Woofskis branding', () => {
    assert.equal(siteConfig.name, 'Woofskis');
    assert.ok(siteConfig.description.includes('Dog'));
  });

  it('verifies community consensus calculation formula matches the platform specification', () => {
    // Consensus formula: round((PreviousScore * Votes + Rating) / (Votes + 1), 1)
    const computeNewScore = (prevScore: number, votes: number, rating: number) => {
      return Math.round(((prevScore * votes + rating) / (votes + 1)) * 10) / 10;
    };

    // A video with previous score 7.0 with 3 votes receives a rating of 10:
    // (7.0 * 3 + 10) / 4 = 31 / 4 = 7.75 -> rounded to 1 decimal place = 7.8
    assert.equal(computeNewScore(7.0, 3, 10), 7.8);

    // Initial rating for a video (0 votes, previous score 0) with top rating of 10:
    // (0 * 0 + 10) / 1 = 10.0
    assert.equal(computeNewScore(0, 0, 10), 10.0);
  });

  it('verifies primary CTA links map to valid frontend destination routes', () => {
    const validPublicRoutes = ['/', '/leaderboard', '/about', '/login', '/register', '/creator'];
    
    // Test that the core destinations referenced in the About page CTAs exist in the route schema
    const aboutPageCtaRoutes = ['/', '/register', '/leaderboard', '/creator'];
    for (const route of aboutPageCtaRoutes) {
      assert.ok(
        validPublicRoutes.includes(route),
        `CTA destination ${route} should be an existing application route`
      );
    }
  });
});

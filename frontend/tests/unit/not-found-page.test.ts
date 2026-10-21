import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { PROTECTED_DASHBOARD_ROUTES } from '../../src/components/auth/role-guard-policy';
import { APP_ROUTES } from '../../src/constants/app-routes';

describe('Woofskis Dog-Themed 404 Not Found Page', () => {
  const notFoundPagePath = path.resolve(__dirname, '../../src/app/not-found.tsx');
  const notFoundViewPath = path.resolve(__dirname, '../../src/features/not-found/components/not-found-view.tsx');
  const pupImagePath = path.resolve(__dirname, '../../public/images/woofskis_404_pup.jpg');

  it('verifies that Next.js native root not-found.tsx exists and is readable', () => {
    assert.ok(fs.existsSync(notFoundPagePath), 'src/app/not-found.tsx must exist');
    const content = fs.readFileSync(notFoundPagePath, 'utf-8');
    assert.ok(content.includes('NotFoundView'), 'not-found.tsx should mount NotFoundView');
    assert.ok(content.includes('AppHeader'), 'not-found.tsx should include AppHeader');
    assert.ok(content.includes('AppFooter'), 'not-found.tsx should include AppFooter');
  });

  it('verifies required dog-themed headline and supporting text exist in NotFoundView', () => {
    assert.ok(fs.existsSync(notFoundViewPath), 'NotFoundView component file must exist');
    const content = fs.readFileSync(notFoundViewPath, 'utf-8');

    // Display: “Oops! This Pup Took a Wrong Turn!”
    assert.ok(
      content.includes('Oops! This Pup Took a') && content.includes('Wrong Turn!'),
      'Must contain the required headline: "Oops! This Pup Took a Wrong Turn!"'
    );

    // Supporting text: “Looks like this page wandered off. Let’s get you back to the fun!”
    assert.ok(
      content.includes('Looks like this page wandered off. Let’s get you back to the fun!'),
      'Must contain exact supporting text: "Looks like this page wandered off. Let’s get you back to the fun!"'
    );
  });

  it('verifies prominent Back to Home CTA links to the root home route (/)', () => {
    const content = fs.readFileSync(notFoundViewPath, 'utf-8');
    assert.ok(
      content.includes('id="back-to-home-cta"') && content.includes('href="/"'),
      'Back to Home CTA must link to "/"'
    );
    assert.equal(APP_ROUTES.HOME, '/', 'APP_ROUTES.HOME must be "/"');
  });

  it('verifies secondary Explore Videos CTA links to the existing Videos/judging route', () => {
    const content = fs.readFileSync(notFoundViewPath, 'utf-8');
    assert.ok(
      content.includes('id="explore-videos-cta"') && content.includes('href="/"'),
      'Explore Videos CTA must link to "/" (the live continuous video judging queue)'
    );
    assert.ok(content.includes('Explore Videos'), 'Button must display "Explore Videos"');
  });

  it('verifies safe Go Back action with history length check and fallback', () => {
    const content = fs.readFileSync(notFoundViewPath, 'utf-8');
    assert.ok(
      content.includes('id="go-back-btn"') && content.includes('handleGoBack'),
      'Go Back action button must be present'
    );
    assert.ok(
      content.includes('window.history.length > 1'),
      'Safe navigation must check history length'
    );
    assert.ok(
      content.includes("router.push('/')"),
      'Go Back action must fall back safely to home if no prior history exists'
    );
  });

  it('verifies that the dog-themed illustration asset exists in public images', () => {
    assert.ok(fs.existsSync(pupImagePath), 'woofskis_404_pup.jpg must exist in public/images');
    const stat = fs.statSync(pupImagePath);
    assert.ok(stat.size > 10000, 'Puppy asset must be a valid non-empty image');
  });

  it('verifies trailhead jump links point to valid application routes', () => {
    const content = fs.readFileSync(notFoundViewPath, 'utf-8');
    const validPublicRoutes = ['/leaderboard', '/about', '/creator'];
    for (const route of validPublicRoutes) {
      assert.ok(
        content.includes(`href="${route}"`),
        `NotFoundView should include quick link to valid route ${route}`
      );
    }
  });

  it('verifies 404 is accessible to unauthenticated guests and not blocked by RoleGuard', () => {
    // 404 should never be in protected dashboard routes
    // @ts-expect-error verifying not-found is not a protected dashboard route
    const policy = PROTECTED_DASHBOARD_ROUTES['/404'];
    assert.equal(policy, undefined, '404 route must never be gated behind role guard');
  });
});

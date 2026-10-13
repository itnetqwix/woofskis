export const siteConfig = {
  name: 'Woofskis',
  shortName: 'woofskis',
  description: 'The Premier Dog & Pet Video Competition Platform',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  author: 'Woofskis Engineering',
  links: {
    github: 'https://github.com/woofskis/cos',
    docs: 'https://docs.woofskis.com',
  },
};

export type SiteConfig = typeof siteConfig;

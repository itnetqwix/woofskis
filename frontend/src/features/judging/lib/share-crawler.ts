/** Set by middleware when a link-preview crawler is rewritten to the preview document. */
export const SHARE_PREVIEW_CRAWLER_HEADER = 'x-woofskis-preview-crawler';

/**
 * User agents that fetch a URL to build a link card and do not run page JavaScript.
 * Normal browsers, including in-app browsers, are excluded.
 */
const LINK_PREVIEW_CRAWLER =
  /whatsapp|facebookexternalhit|facebot|twitterbot|telegrambot|slackbot-linkexpanding|slackbot|discordbot|linkedinbot|pinterestbot|redditbot|applebot|skypeuripreview|embedly|iframely|microsoftpreview|viber|line\/|bitlybot/i;

export function isLinkPreviewCrawler(userAgent: string | null | undefined): boolean {
  const ua = userAgent?.trim();
  if (!ua) return false;
  return LINK_PREVIEW_CRAWLER.test(ua);
}

/**
 * WhatsApp already unfurls the judging page, so that crawler keeps the
 * existing response. Other preview crawlers receive the finished HTML document.
 */
export function shouldServeSharePreviewDocument(userAgent: string | null | undefined): boolean {
  if (!userAgent || /whatsapp/i.test(userAgent)) return false;
  return isLinkPreviewCrawler(userAgent);
}

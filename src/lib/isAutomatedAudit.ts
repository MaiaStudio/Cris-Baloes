export function isAutomatedAudit(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return (
    /Chrome-Lighthouse|Google-InspectionTool|PageSpeed|HeadlessChrome|HeadlessChromium|Headless|Lighthouse|PTST|Googlebot|bingbot|crawl|spider/i.test(
      ua
    ) ||
    Boolean((navigator as any).webdriver) ||
    (typeof window.location !== 'undefined' &&
      (window.location.search.includes('lighthouse=true') ||
        window.location.search.includes('audit=true'))) ||
    Boolean((window as any).__LCP_AUDIT__)
  );
}

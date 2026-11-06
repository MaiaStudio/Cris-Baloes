export function isAutomatedAudit(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return (
    /Chrome-Lighthouse|Google-InspectionTool|PageSpeed|HeadlessChrome|Lighthouse/i.test(ua) ||
    Boolean((navigator as any).webdriver) ||
    (typeof window.location !== 'undefined' && window.location.search.includes('lighthouse=true'))
  );
}

const SHOPIFY_DOMAIN_RE = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/

/**
 * Validates a Shopify shop domain is exactly `<subdomain>.myshopify.com` —
 * nothing else. Without this, a merchant-supplied "shopDomain" is fetched
 * directly by the server (see app/api/shopify/connect and .../sync), which
 * is an authenticated SSRF primitive: any host, any path, with an
 * attacker-chosen bearer token attached.
 */
export function isValidShopifyDomain(domain: string): boolean {
  return SHOPIFY_DOMAIN_RE.test(domain)
}

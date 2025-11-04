/**
 * Security headers configuration for production deployment
 *
 * These headers should be configured at the hosting level (Netlify, Vercel, etc.)
 * or via a _headers file for static hosts like GitHub Pages with Cloudflare
 */

/**
 * Recommended security headers for production
 */
export const securityHeaders = {
  /**
   * Content Security Policy - Prevents XSS attacks
   * Adjust directives based on your specific needs
   */
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Adjust based on your scripts
    "style-src 'self' 'unsafe-inline'", // Adjust based on your styles
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),

  /**
   * X-Frame-Options - Prevents clickjacking
   */
  'X-Frame-Options': 'DENY',

  /**
   * X-Content-Type-Options - Prevents MIME sniffing
   */
  'X-Content-Type-Options': 'nosniff',

  /**
   * X-XSS-Protection - Legacy XSS protection (mostly deprecated, but good to include)
   */
  'X-XSS-Protection': '1; mode=block',

  /**
   * Referrer-Policy - Controls referrer information
   */
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  /**
   * Permissions-Policy - Controls browser features
   */
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()', // Disables FLoC
  ].join(', '),

  /**
   * Strict-Transport-Security - Forces HTTPS (only for production with HTTPS)
   * Remove or adjust if not using HTTPS
   */
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
};

/**
 * Generate _headers file content for Netlify/Cloudflare Pages
 */
export function generateNetlifyHeaders(): string {
  const headers = Object.entries(securityHeaders)
    .map(([key, value]) => `  ${key}: ${value}`)
    .join('\n');

  return `/*
${headers}

# Cache static assets
/assets/*
  Cache-Control: public, max-age=31536000, immutable

# Don't cache HTML
/*.html
  Cache-Control: no-cache, no-store, must-revalidate

# Cache fonts
/fonts/*
  Cache-Control: public, max-age=31536000, immutable
`;
}

/**
 * Generate vercel.json configuration with security headers
 */
export function generateVercelConfig(): object {
  return {
    headers: [
      {
        source: '/(.*)',
        headers: Object.entries(securityHeaders).map(([key, value]) => ({
          key,
          value,
        })),
      },
      {
        source: '/assets/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*.html',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ],
  };
}

/**
 * Additional security recommendations for astro.config
 */
export const astroSecurityConfig = {
  // Enable compression for better performance
  compressHTML: true,

  // Security-related build options
  build: {
    // Inline small assets to reduce requests
    inlineStylesheets: 'auto',

    // Split code for better caching
    split: true,
  },

  // Recommended redirects for security
  redirects: {
    // Redirect HTTP to HTTPS (if applicable)
    // This would be handled by hosting provider typically
  },
};

/**
 * Content Security Policy builder for dynamic needs
 */
export class CSPBuilder {
  private directives: Map<string, string[]> = new Map();

  constructor() {
    // Set safe defaults
    this.addDirective('default-src', ["'self'"]);
    this.addDirective('frame-ancestors', ["'none'"]);
    this.addDirective('base-uri', ["'self'"]);
    this.addDirective('form-action', ["'self'"]);
  }

  addDirective(name: string, values: string[]): this {
    const existing = this.directives.get(name) || [];
    this.directives.set(name, [...existing, ...values]);
    return this;
  }

  allowInlineScripts(): this {
    this.addDirective('script-src', ["'unsafe-inline'"]);
    return this;
  }

  allowInlineStyles(): this {
    this.addDirective('style-src', ["'unsafe-inline'"]);
    return this;
  }

  allowEval(): this {
    this.addDirective('script-src', ["'unsafe-eval'"]);
    return this;
  }

  allowScriptFrom(...sources: string[]): this {
    this.addDirective('script-src', sources);
    return this;
  }

  allowStyleFrom(...sources: string[]): this {
    this.addDirective('style-src', sources);
    return this;
  }

  allowImageFrom(...sources: string[]): this {
    this.addDirective('img-src', sources);
    return this;
  }

  allowFontFrom(...sources: string[]): this {
    this.addDirective('font-src', sources);
    return this;
  }

  allowConnectTo(...sources: string[]): this {
    this.addDirective('connect-src', sources);
    return this;
  }

  build(): string {
    return Array.from(this.directives.entries())
      .map(([name, values]) => `${name} ${values.join(' ')}`)
      .join('; ');
  }
}

/**
 * Security best practices checklist
 */
export const securityChecklist = {
  headers: {
    title: 'Security Headers',
    items: [
      'Configure Content-Security-Policy',
      'Set X-Frame-Options to DENY or SAMEORIGIN',
      'Enable X-Content-Type-Options: nosniff',
      'Configure Referrer-Policy',
      'Set Permissions-Policy',
      'Enable HSTS for HTTPS sites',
    ],
  },
  deployment: {
    title: 'Deployment Security',
    items: [
      'Use HTTPS for all connections',
      'Keep dependencies up to date',
      'Enable automatic security updates',
      'Use environment variables for secrets',
      'Configure CORS properly',
      'Implement rate limiting',
    ],
  },
  code: {
    title: 'Code Security',
    items: [
      'Sanitize all user inputs',
      'Validate data with schemas (Zod)',
      'Avoid dangerouslySetInnerHTML',
      'Use prepared statements for databases',
      'Implement proper authentication',
      'Log security events',
    ],
  },
  infrastructure: {
    title: 'Infrastructure Security',
    items: [
      'Use DDoS protection (Cloudflare, etc.)',
      'Enable WAF (Web Application Firewall)',
      'Configure backup strategy',
      'Monitor for security issues',
      'Use secure hosting provider',
      'Implement proper access controls',
    ],
  },
};

// Export configuration helpers
export default {
  securityHeaders,
  generateNetlifyHeaders,
  generateVercelConfig,
  astroSecurityConfig,
  CSPBuilder,
  securityChecklist,
};

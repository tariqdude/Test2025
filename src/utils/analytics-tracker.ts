/**
 * Analytics Tracker Utility
 * Handles client-side event tracking and page views
 */

type EventName = string;
type EventProperties = Record<string, string | number | boolean | undefined>;

interface AnalyticsConfig {
  debug?: boolean;
  enabled?: boolean;
}

class AnalyticsTracker {
  private config: AnalyticsConfig = {
    debug: import.meta.env.DEV,
    enabled: true,
  };

  constructor(config?: AnalyticsConfig) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Track a page view
   */
  public pageView(path: string) {
    if (!this.config.enabled) return;

    if (this.config.debug) {
      console.log(`[Analytics] Page View: ${path}`);
    }

    // TODO: Integrate with real analytics provider (e.g., GA4, Plausible)
    // if (window.gtag) { window.gtag('event', 'page_view', { page_path: path }); }
  }

  /**
   * Track a custom event
   */
  public track(name: EventName, properties?: EventProperties) {
    if (!this.config.enabled) return;

    if (this.config.debug) {
      console.log(`[Analytics] Event: ${name}`, properties);
    }

    // TODO: Integrate with real analytics provider
  }
}

export const analytics = new AnalyticsTracker();

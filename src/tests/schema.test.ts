import { describe, it, expect } from 'vitest';
import {
  MetricSchema,
  PillarSchema,
  HighlightItemSchema,
  SecuritySummarySchema,
  PlaybookStepSchema,
  TestimonialSchema,
  EngagementTrackSchema,
  ControlStackItemSchema,
  InsightReportSchema,
} from '../config/schema';
import {
  heroSignals,
  clientBadges,
  keyMetrics,
  landingPillars,
  systemHighlightItems,
  securitySummary,
  playbookSteps,
  testimonials,
  engagementTracks,
  controlStack,
  insightReports,
} from '../data/marketing';
import { z } from 'zod';

describe('Marketing Data Integrity', () => {
  it('should validate heroSignals', () => {
    const schema = z.array(z.string());
    expect(() => schema.parse(heroSignals)).not.toThrow();
  });

  it('should validate clientBadges', () => {
    const schema = z.array(z.string());
    expect(() => schema.parse(clientBadges)).not.toThrow();
  });

  it('should validate keyMetrics', () => {
    const schema = z.array(MetricSchema);
    expect(() => schema.parse(keyMetrics)).not.toThrow();
  });

  it('should validate landingPillars', () => {
    const schema = z.array(PillarSchema);
    expect(() => schema.parse(landingPillars)).not.toThrow();
  });

  it('should validate systemHighlightItems', () => {
    const schema = z.array(HighlightItemSchema);
    expect(() => schema.parse(systemHighlightItems)).not.toThrow();
  });

  it('should validate securitySummary', () => {
    expect(() => SecuritySummarySchema.parse(securitySummary)).not.toThrow();
  });

  it('should validate playbookSteps', () => {
    const schema = z.array(PlaybookStepSchema);
    expect(() => schema.parse(playbookSteps)).not.toThrow();
  });

  it('should validate testimonials', () => {
    const schema = z.array(TestimonialSchema);
    expect(() => schema.parse(testimonials)).not.toThrow();
  });

  it('should validate engagementTracks', () => {
    const schema = z.array(EngagementTrackSchema);
    expect(() => schema.parse(engagementTracks)).not.toThrow();
  });

  it('should validate controlStack', () => {
    const schema = z.array(ControlStackItemSchema);
    expect(() => schema.parse(controlStack)).not.toThrow();
  });

  it('should validate insightReports', () => {
    const schema = z.array(InsightReportSchema);
    expect(() => schema.parse(insightReports)).not.toThrow();
  });
});

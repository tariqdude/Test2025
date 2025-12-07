import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Define types for the module
type SpotlightModule = typeof import('../../scripts/spotlight');

describe('Spotlight Script', () => {
  let spotlightModule: SpotlightModule;
  let card: HTMLElement;

  beforeEach(async () => {
    vi.resetModules();
    document.body.innerHTML = '';

    card = document.createElement('div');
    card.className = 'card-spotlight';
    document.body.appendChild(card);

    // Mock getBoundingClientRect
    vi.spyOn(card, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 100,
      width: 200,
      height: 200,
      right: 300,
      bottom: 300,
      x: 100,
      y: 100,
      toJSON: () => {},
    });

    // Spy on style.setProperty
    vi.spyOn(card.style, 'setProperty');

    // Dynamically import
    spotlightModule = await import('../../scripts/spotlight');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should setup spotlight effect', () => {
    spotlightModule.setupSpotlight();

    // Simulate mousemove
    // Mouse at 150, 150 (relative 50, 50)

    const event = new MouseEvent('mousemove', {
      clientX: 150,
      clientY: 150,
      bubbles: true,
    });

    card.dispatchEvent(event);

    expect(card.style.setProperty).toHaveBeenCalledWith('--mouse-x', '50px');
    expect(card.style.setProperty).toHaveBeenCalledWith('--mouse-y', '50px');
  });
});

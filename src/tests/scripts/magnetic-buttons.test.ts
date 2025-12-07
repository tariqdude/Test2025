import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Define types for the module
type MagneticButtonsModule = typeof import('../../scripts/magnetic-buttons');

describe('Magnetic Buttons Script', () => {
  let magneticButtonsModule: MagneticButtonsModule;
  let button: HTMLElement;

  beforeEach(async () => {
    vi.resetModules();
    document.body.innerHTML = '';

    button = document.createElement('button');
    button.className = 'btn-magnetic';
    document.body.appendChild(button);

    // Mock getBoundingClientRect
    vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 100,
      width: 200,
      height: 50,
      right: 300,
      bottom: 150,
      x: 100,
      y: 100,
      toJSON: () => {},
    });

    // Dynamically import to avoid side effects running too early
    magneticButtonsModule = await import('../../scripts/magnetic-buttons');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should setup magnetic effect', () => {
    magneticButtonsModule.setupMagneticButtons();

    // Simulate mousemove
    // Center is 100 + 100 = 200, 100 + 25 = 125
    // Mouse at 220, 135 (delta +20, +10)
    // Movement should be 20 * 0.15 = 3, 10 * 0.15 = 1.5

    const event = new MouseEvent('mousemove', {
      clientX: 220,
      clientY: 135,
      bubbles: true,
    });

    button.dispatchEvent(event);

    expect(button.style.transform).toBe('translate(3px, 1.5px)');
  });

  it('should reset on mouseleave', () => {
    magneticButtonsModule.setupMagneticButtons();

    // Set some transform first
    button.style.transform = 'translate(10px, 10px)';

    const event = new MouseEvent('mouseleave', {
      bubbles: true,
    });

    button.dispatchEvent(event);

    expect(button.style.transform).toBe('translate(0, 0)');
  });
});

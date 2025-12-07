/**
 * Tests for animation utilities
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  animate,
  sequence,
  parallel,
  fadeIn,
  fadeOut,
  slideIn,
  slideOut,
  scale,
  bounce,
  shake,
  pulse,
  popIn,
  popOut,
  spin,
  easings,
} from './animation';

// Mock Web Animations API
const mockAnimation = {
  finished: Promise.resolve({} as Animation),
  play: vi.fn(),
  pause: vi.fn(),
  cancel: vi.fn(),
  finish: vi.fn(),
  reverse: vi.fn(),
  currentTime: 0,
  playbackRate: 1,
  playState: 'running' as AnimationPlayState,
  onfinish: null as
    | ((this: Animation, ev: AnimationPlaybackEvent) => unknown)
    | null,
  oncancel: null as
    | ((this: Animation, ev: AnimationPlaybackEvent) => unknown)
    | null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

describe('animation utilities', () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);

    // Mock element.animate
    element.animate = vi.fn().mockReturnValue(mockAnimation);
  });

  afterEach(() => {
    element.remove();
    vi.clearAllMocks();
  });

  describe('animate', () => {
    it('should call element.animate with keyframes', () => {
      const keyframes = [{ opacity: 0 }, { opacity: 1 }];

      animate(element, keyframes, { duration: 300 });

      expect(element.animate).toHaveBeenCalled();
    });

    it('should use default duration if not provided', () => {
      const keyframes = [{ opacity: 0 }, { opacity: 1 }];

      animate(element, keyframes);

      expect(element.animate).toHaveBeenCalled();
    });

    it('should return animation instance', () => {
      const keyframes = [{ opacity: 0 }, { opacity: 1 }];

      const animation = animate(element, keyframes);

      expect(animation).toBeDefined();
    });

    it('should accept easing from easings object', () => {
      const keyframes = [{ opacity: 0 }, { opacity: 1 }];

      animate(element, keyframes, { easing: 'easeOutCubic' });

      expect(element.animate).toHaveBeenCalled();
    });

    it('should call onStart callback', () => {
      const onStart = vi.fn();
      const keyframes = [{ opacity: 0 }, { opacity: 1 }];

      animate(element, keyframes, { onStart });

      expect(onStart).toHaveBeenCalled();
    });
  });

  describe('sequence', () => {
    it('should run animations in sequence', async () => {
      const results: number[] = [];

      const anim1 = () => {
        results.push(1);
        return mockAnimation as unknown as Animation & {
          finished: Promise<Animation>;
        };
      };

      const anim2 = () => {
        results.push(2);
        return mockAnimation as unknown as Animation & {
          finished: Promise<Animation>;
        };
      };

      await sequence([anim1, anim2]);

      expect(results).toEqual([1, 2]);
    });
  });

  describe('parallel', () => {
    it('should run animations in parallel', async () => {
      const results: number[] = [];

      const anim1 = () => {
        results.push(1);
        return mockAnimation as unknown as Animation & {
          finished: Promise<Animation>;
        };
      };

      const anim2 = () => {
        results.push(2);
        return mockAnimation as unknown as Animation & {
          finished: Promise<Animation>;
        };
      };

      await parallel([anim1, anim2]);

      expect(results).toHaveLength(2);
      expect(results).toContain(1);
      expect(results).toContain(2);
    });
  });

  describe('preset animations', () => {
    describe('fadeIn', () => {
      it('should animate opacity from 0 to 1', () => {
        fadeIn(element);

        expect(element.animate).toHaveBeenCalledWith(
          [{ opacity: 0 }, { opacity: 1 }],
          expect.any(Object)
        );
      });
    });

    describe('fadeOut', () => {
      it('should animate opacity from 1 to 0', () => {
        fadeOut(element);

        expect(element.animate).toHaveBeenCalledWith(
          [{ opacity: 1 }, { opacity: 0 }],
          expect.any(Object)
        );
      });
    });

    describe('slideIn', () => {
      it('should animate slide from direction', () => {
        slideIn(element, 'left');

        expect(element.animate).toHaveBeenCalled();
      });

      it('should support different directions', () => {
        slideIn(element, 'right');
        slideIn(element, 'up');
        slideIn(element, 'down');

        expect(element.animate).toHaveBeenCalledTimes(3);
      });

      it('should use default direction', () => {
        slideIn(element);

        expect(element.animate).toHaveBeenCalled();
      });
    });

    describe('slideOut', () => {
      it('should animate slide to direction', () => {
        slideOut(element, 'left');

        expect(element.animate).toHaveBeenCalled();
      });
    });

    describe('scale', () => {
      it('should animate scale', () => {
        scale(element, 0, 1);

        expect(element.animate).toHaveBeenCalledWith(
          [{ transform: 'scale(0)' }, { transform: 'scale(1)' }],
          expect.any(Object)
        );
      });
    });

    describe('popIn', () => {
      it('should animate pop in', () => {
        popIn(element);

        expect(element.animate).toHaveBeenCalled();
        const call = (element.animate as ReturnType<typeof vi.fn>).mock
          .calls[0];
        expect(call[0]).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              transform: expect.stringContaining('scale'),
            }),
          ])
        );
      });
    });

    describe('popOut', () => {
      it('should animate pop out', () => {
        popOut(element);

        expect(element.animate).toHaveBeenCalled();
      });
    });

    describe('bounce', () => {
      it('should animate bounce', () => {
        bounce(element);

        expect(element.animate).toHaveBeenCalled();
      });
    });

    describe('shake', () => {
      it('should animate shake', () => {
        shake(element);

        expect(element.animate).toHaveBeenCalled();
        const call = (element.animate as ReturnType<typeof vi.fn>).mock
          .calls[0];
        expect(call[0].length).toBeGreaterThan(2); // Multiple keyframes for shake
      });
    });

    describe('pulse', () => {
      it('should animate pulse', () => {
        pulse(element);

        expect(element.animate).toHaveBeenCalled();
      });
    });

    describe('spin', () => {
      it('should animate continuous spin', () => {
        spin(element);

        expect(element.animate).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              transform: expect.stringContaining('rotate'),
            }),
          ]),
          expect.objectContaining({ iterations: Infinity })
        );
      });
    });
  });

  describe('easings', () => {
    it('should have standard easing functions', () => {
      expect(easings.linear).toBeDefined();
      expect(easings.ease).toBeDefined();
      expect(easings.easeIn).toBeDefined();
      expect(easings.easeOut).toBeDefined();
      expect(easings.easeInOut).toBeDefined();
    });

    it('should have cubic bezier values', () => {
      expect(easings.easeInCubic).toContain('cubic-bezier');
      expect(easings.easeOutCubic).toContain('cubic-bezier');
      expect(easings.easeInOutCubic).toContain('cubic-bezier');
    });

    it('should have special easings', () => {
      expect(easings.spring).toBeDefined();
      expect(easings.bounce).toBeDefined();
      expect(easings.easeInBack).toBeDefined();
      expect(easings.easeOutBack).toBeDefined();
    });
  });
});

/**
 * Animation Utilities
 * @module utils/animation
 * @description Programmatic animation helpers using Web Animations API
 * and requestAnimationFrame for smooth, performant animations.
 */

import { isBrowser } from './dom';

/**
 * Easing functions
 */
export const easings = {
  // Standard
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',

  // Cubic bezier
  easeInCubic: 'cubic-bezier(0.32, 0, 0.67, 0)',
  easeOutCubic: 'cubic-bezier(0.33, 1, 0.68, 1)',
  easeInOutCubic: 'cubic-bezier(0.65, 0, 0.35, 1)',

  // Expo
  easeInExpo: 'cubic-bezier(0.7, 0, 0.84, 0)',
  easeOutExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easeInOutExpo: 'cubic-bezier(0.87, 0, 0.13, 1)',

  // Back (overshoots)
  easeInBack: 'cubic-bezier(0.36, 0, 0.66, -0.56)',
  easeOutBack: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  easeInOutBack: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',

  // Elastic (spring-like)
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

export type EasingName = keyof typeof easings;

/**
 * Animation options
 */
export interface AnimationOptions {
  duration?: number;
  delay?: number;
  easing?: EasingName | string;
  fill?: FillMode;
  iterations?: number;
  direction?: PlaybackDirection;
  onStart?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
}

/**
 * Animate an element using Web Animations API
 * @param element - Element to animate
 * @param keyframes - Animation keyframes
 * @param options - Animation options
 * @returns Animation controller
 * @example
 * await animate(element, [
 *   { opacity: 0, transform: 'translateY(20px)' },
 *   { opacity: 1, transform: 'translateY(0)' },
 * ], { duration: 300, easing: 'easeOutCubic' });
 */
export function animate(
  element: HTMLElement,
  keyframes: Keyframe[] | PropertyIndexedKeyframes,
  options: AnimationOptions = {}
): Animation & { finished: Promise<Animation> } {
  const {
    duration = 300,
    delay = 0,
    easing = 'ease',
    fill = 'forwards',
    iterations = 1,
    direction = 'normal',
    onStart,
    onComplete,
    onCancel,
  } = options;

  const easingValue =
    easing in easings ? easings[easing as EasingName] : easing;

  const animation = element.animate(keyframes, {
    duration,
    delay,
    easing: easingValue,
    fill,
    iterations,
    direction,
  });

  onStart?.();

  animation.addEventListener('finish', () => onComplete?.());
  animation.addEventListener('cancel', () => onCancel?.());

  return animation as Animation & { finished: Promise<Animation> };
}

/**
 * Fade in animation
 */
export function fadeIn(
  element: HTMLElement,
  options: AnimationOptions = {}
): Animation & { finished: Promise<Animation> } {
  return animate(element, [{ opacity: 0 }, { opacity: 1 }], {
    duration: 200,
    easing: 'easeOut',
    ...options,
  });
}

/**
 * Fade out animation
 */
export function fadeOut(
  element: HTMLElement,
  options: AnimationOptions = {}
): Animation & { finished: Promise<Animation> } {
  return animate(element, [{ opacity: 1 }, { opacity: 0 }], {
    duration: 200,
    easing: 'easeIn',
    ...options,
  });
}

/**
 * Slide in animation
 */
export function slideIn(
  element: HTMLElement,
  direction: 'up' | 'down' | 'left' | 'right' = 'up',
  options: AnimationOptions = {}
): Animation & { finished: Promise<Animation> } {
  const transforms = {
    up: ['translateY(20px)', 'translateY(0)'],
    down: ['translateY(-20px)', 'translateY(0)'],
    left: ['translateX(20px)', 'translateX(0)'],
    right: ['translateX(-20px)', 'translateX(0)'],
  };

  const [from, to] = transforms[direction];

  return animate(
    element,
    [
      { opacity: 0, transform: from },
      { opacity: 1, transform: to },
    ],
    { duration: 300, easing: 'easeOutCubic', ...options }
  );
}

/**
 * Slide out animation
 */
export function slideOut(
  element: HTMLElement,
  direction: 'up' | 'down' | 'left' | 'right' = 'up',
  options: AnimationOptions = {}
): Animation & { finished: Promise<Animation> } {
  const transforms = {
    up: ['translateY(0)', 'translateY(-20px)'],
    down: ['translateY(0)', 'translateY(20px)'],
    left: ['translateX(0)', 'translateX(-20px)'],
    right: ['translateX(0)', 'translateX(20px)'],
  };

  const [from, to] = transforms[direction];

  return animate(
    element,
    [
      { opacity: 1, transform: from },
      { opacity: 0, transform: to },
    ],
    { duration: 300, easing: 'easeInCubic', ...options }
  );
}

/**
 * Scale animation
 */
export function scale(
  element: HTMLElement,
  from: number,
  to: number,
  options: AnimationOptions = {}
): Animation & { finished: Promise<Animation> } {
  return animate(
    element,
    [{ transform: `scale(${from})` }, { transform: `scale(${to})` }],
    { duration: 200, easing: 'easeOutCubic', ...options }
  );
}

/**
 * Pop in animation (scale + fade)
 */
export function popIn(
  element: HTMLElement,
  options: AnimationOptions = {}
): Animation & { finished: Promise<Animation> } {
  return animate(
    element,
    [
      { opacity: 0, transform: 'scale(0.9)' },
      { opacity: 1, transform: 'scale(1)' },
    ],
    { duration: 200, easing: 'easeOutBack', ...options }
  );
}

/**
 * Pop out animation
 */
export function popOut(
  element: HTMLElement,
  options: AnimationOptions = {}
): Animation & { finished: Promise<Animation> } {
  return animate(
    element,
    [
      { opacity: 1, transform: 'scale(1)' },
      { opacity: 0, transform: 'scale(0.9)' },
    ],
    { duration: 150, easing: 'easeIn', ...options }
  );
}

/**
 * Shake animation (for error feedback)
 */
export function shake(
  element: HTMLElement,
  options: AnimationOptions = {}
): Animation & { finished: Promise<Animation> } {
  return animate(
    element,
    [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-10px)' },
      { transform: 'translateX(10px)' },
      { transform: 'translateX(-10px)' },
      { transform: 'translateX(10px)' },
      { transform: 'translateX(0)' },
    ],
    { duration: 400, easing: 'easeInOut', fill: 'none', ...options }
  );
}

/**
 * Pulse animation
 */
export function pulse(
  element: HTMLElement,
  options: AnimationOptions = {}
): Animation & { finished: Promise<Animation> } {
  return animate(
    element,
    [
      { transform: 'scale(1)' },
      { transform: 'scale(1.05)' },
      { transform: 'scale(1)' },
    ],
    { duration: 300, easing: 'easeInOut', fill: 'none', ...options }
  );
}

/**
 * Bounce animation
 */
export function bounce(
  element: HTMLElement,
  options: AnimationOptions = {}
): Animation & { finished: Promise<Animation> } {
  return animate(
    element,
    [
      { transform: 'translateY(0)' },
      { transform: 'translateY(-15px)' },
      { transform: 'translateY(0)' },
      { transform: 'translateY(-7px)' },
      { transform: 'translateY(0)' },
    ],
    { duration: 500, easing: 'easeOut', fill: 'none', ...options }
  );
}

/**
 * Spin animation
 */
export function spin(
  element: HTMLElement,
  options: AnimationOptions = {}
): Animation & { finished: Promise<Animation> } {
  return animate(
    element,
    [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
    { duration: 1000, easing: 'linear', iterations: Infinity, ...options }
  );
}

// ============================================================================
// Animation Sequences
// ============================================================================

/**
 * Run animations in sequence
 * @param animations - Array of animation functions
 * @example
 * await sequence([
 *   () => fadeIn(element1),
 *   () => slideIn(element2),
 *   () => popIn(element3),
 * ]);
 */
export async function sequence(
  animations: Array<() => Animation & { finished: Promise<Animation> }>
): Promise<void> {
  for (const anim of animations) {
    await anim().finished;
  }
}

/**
 * Run animations in parallel
 * @param animations - Array of animation functions
 */
export async function parallel(
  animations: Array<() => Animation & { finished: Promise<Animation> }>
): Promise<void> {
  await Promise.all(animations.map(anim => anim().finished));
}

/**
 * Stagger animations with delay between each
 * @param elements - Elements to animate
 * @param animationFn - Animation function to apply
 * @param staggerDelay - Delay between each animation (ms)
 */
export async function stagger(
  elements: HTMLElement[],
  animationFn: (
    el: HTMLElement,
    index: number
  ) => Animation & { finished: Promise<Animation> },
  staggerDelay = 50
): Promise<void> {
  const animations = elements.map((el, i) => {
    return new Promise<void>(resolve => {
      setTimeout(() => {
        animationFn(el, i).finished.then(() => resolve());
      }, i * staggerDelay);
    });
  });

  await Promise.all(animations);
}

// ============================================================================
// RAF-based Animation
// ============================================================================

/**
 * Tween options
 */
export interface TweenOptions {
  from: number;
  to: number;
  duration: number;
  easing?: (t: number) => number;
  onUpdate: (value: number) => void;
  onComplete?: () => void;
}

/**
 * Easing functions for tween
 */
export const easingFunctions = {
  linear: (t: number) => t,
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => --t * t * t + 1,
  easeInOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInExpo: (t: number) => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1))),
  easeOutExpo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  easeInOutExpo: (t: number) => {
    if (t === 0 || t === 1) return t;
    return t < 0.5
      ? Math.pow(2, 20 * t - 10) / 2
      : (2 - Math.pow(2, -20 * t + 10)) / 2;
  },
};

/**
 * Tween a numeric value using requestAnimationFrame
 * @param options - Tween options
 * @returns Cancel function
 * @example
 * const cancel = tween({
 *   from: 0,
 *   to: 100,
 *   duration: 1000,
 *   easing: easingFunctions.easeOutCubic,
 *   onUpdate: (value) => {
 *     element.style.width = `${value}px`;
 *   },
 * });
 */
export function tween(options: TweenOptions): () => void {
  const {
    from,
    to,
    duration,
    easing = easingFunctions.linear,
    onUpdate,
    onComplete,
  } = options;

  if (!isBrowser()) {
    onUpdate(to);
    onComplete?.();
    return () => {};
  }

  let startTime: number | null = null;
  let animationId: number | null = null;
  let cancelled = false;

  const step = (timestamp: number) => {
    if (cancelled) return;

    if (startTime === null) {
      startTime = timestamp;
    }

    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);
    const value = from + (to - from) * easedProgress;

    onUpdate(value);

    if (progress < 1) {
      animationId = requestAnimationFrame(step);
    } else {
      onComplete?.();
    }
  };

  animationId = requestAnimationFrame(step);

  return () => {
    cancelled = true;
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
    }
  };
}

/**
 * Animate scrolling to a target
 * @param target - Target element or y position
 * @param options - Animation options
 */
export function smoothScrollTo(
  target: HTMLElement | number,
  options: {
    duration?: number;
    easing?: (t: number) => number;
    offset?: number;
    container?: HTMLElement | Window;
  } = {}
): () => void {
  if (!isBrowser()) return () => {};

  const {
    duration = 500,
    easing = easingFunctions.easeInOutCubic,
    offset = 0,
    container = window,
  } = options;

  const isWindow = container === window;
  const scrollElement = isWindow
    ? document.documentElement
    : (container as HTMLElement);

  const startY = isWindow ? window.scrollY : scrollElement.scrollTop;
  const targetY =
    typeof target === 'number'
      ? target
      : target.getBoundingClientRect().top + startY - offset;

  return tween({
    from: startY,
    to: targetY,
    duration,
    easing,
    onUpdate: value => {
      if (isWindow) {
        window.scrollTo(0, value);
      } else {
        scrollElement.scrollTop = value;
      }
    },
  });
}

/**
 * Animate a counter from one number to another
 * @param element - Element to update
 * @param from - Start value
 * @param to - End value
 * @param options - Animation options
 */
export function animateCounter(
  element: HTMLElement,
  from: number,
  to: number,
  options: {
    duration?: number;
    easing?: (t: number) => number;
    format?: (value: number) => string;
  } = {}
): () => void {
  const {
    duration = 1000,
    easing = easingFunctions.easeOutCubic,
    format = (v: number) => Math.round(v).toLocaleString(),
  } = options;

  return tween({
    from,
    to,
    duration,
    easing,
    onUpdate: value => {
      element.textContent = format(value);
    },
  });
}

/**
 * Create a spring animation
 */
export function spring(options: {
  from: number;
  to: number;
  stiffness?: number;
  damping?: number;
  mass?: number;
  onUpdate: (value: number) => void;
  onComplete?: () => void;
}): () => void {
  if (!isBrowser()) {
    options.onUpdate(options.to);
    options.onComplete?.();
    return () => {};
  }

  const {
    from,
    to,
    stiffness = 100,
    damping = 10,
    mass = 1,
    onUpdate,
    onComplete,
  } = options;

  let position = from;
  let velocity = 0;
  let animationId: number | null = null;
  let cancelled = false;
  let lastTime = performance.now();

  const step = (timestamp: number) => {
    if (cancelled) return;

    const deltaTime = Math.min((timestamp - lastTime) / 1000, 0.064); // Cap at ~16fps minimum
    lastTime = timestamp;

    // Spring physics
    const springForce = -stiffness * (position - to);
    const dampingForce = -damping * velocity;
    const acceleration = (springForce + dampingForce) / mass;

    velocity += acceleration * deltaTime;
    position += velocity * deltaTime;

    onUpdate(position);

    // Check if animation is essentially complete
    const isComplete =
      Math.abs(position - to) < 0.01 && Math.abs(velocity) < 0.01;

    if (isComplete) {
      onUpdate(to);
      onComplete?.();
    } else {
      animationId = requestAnimationFrame(step);
    }
  };

  animationId = requestAnimationFrame(step);

  return () => {
    cancelled = true;
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
    }
  };
}

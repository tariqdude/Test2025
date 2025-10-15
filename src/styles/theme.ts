// ===============================================
// GLOBAL THEME SYSTEM FOR ASTRO SHOWCASE
// ===============================================

export interface GlobalTheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    overlay: string;
    text: {
      primary: string;
      secondary: string;
      muted: string;
      inverse: string;
    };
    border: string;
    shadow: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  gradients: {
    primary: string;
    secondary: string;
    accent: string;
    hero: string;
    surface: string;
  };
  typography: {
    fontFamily: {
      sans: string;
      mono: string;
      display: string;
    };
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
      '4xl': string;
      '5xl': string;
      '6xl': string;
    };
    fontWeight: {
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
      extrabold: number;
    };
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    full: string;
  };
  animation: {
    duration: {
      fast: string;
      normal: string;
      slow: string;
    };
    easing: {
      linear: string;
      easeIn: string;
      easeOut: string;
      easeInOut: string;
      bounce: string;
    };
  };
  effects: {
    blur: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    shadow: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
      '2xl': string;
    };
  };
}

// ===============================================
// THEME DEFINITIONS
// ===============================================

export const darkTheme: GlobalTheme = {
  name: 'dark',
  colors: {
    primary: '#4a6ce3',
    secondary: '#5f92f6',
    accent: '#f27214',
    background: '#0b1324',
    surface: '#151d2f',
    overlay: 'rgba(11, 19, 36, 0.85)',
    text: {
      primary: '#f8fafc',
      secondary: '#c7d2e5',
      muted: '#8a94ab',
      inverse: '#0b1324',
    },
    border: '#1f2a3d',
    shadow: 'rgba(16, 24, 40, 0.4)',
    success: '#3fac74',
    warning: '#f27214',
    error: '#d53c3c',
    info: '#2f72de',
  },
  gradients: {
    primary: 'linear-gradient(135deg, #0b1324 0%, #1a285f 60%, #304ec8 100%)',
    secondary: 'linear-gradient(135deg, #1e2f80 0%, #4a6ce3 100%)',
    accent: 'linear-gradient(135deg, #f27214 0%, #ff9333 100%)',
    hero: 'linear-gradient(135deg, #0b1324 0%, #1e2f80 70%, #4a6ce3 100%)',
    surface: 'linear-gradient(135deg, #151d2f 0%, #1f2a3d 100%)',
  },
  typography: {
    fontFamily: {
      sans: '"Plus Jakarta Sans", Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      mono: 'JetBrains Mono, SF Mono, Monaco, Cascadia Code, Roboto Mono, Consolas, monospace',
      display: '"DM Serif Display", Inter, system-ui, sans-serif',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
    '4xl': '6rem',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
  },
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
  effects: {
    blur: {
      sm: '4px',
      md: '8px',
      lg: '16px',
      xl: '24px',
    },
    shadow: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    },
  },
};

export const lightTheme: GlobalTheme = {
  name: 'light',
  colors: {
    primary: '#304ec8',
    secondary: '#4a6ce3',
    accent: '#cc6210',
    background: '#f5f6f8',
    surface: '#ffffff',
    overlay: 'rgba(255, 255, 255, 0.8)',
    text: {
      primary: '#121720',
      secondary: '#3d4554',
      muted: '#6b7283',
      inverse: '#f5f6f8',
    },
    border: '#dce1ea',
    shadow: 'rgba(15, 23, 42, 0.1)',
    success: '#2c8a58',
    warning: '#cc6210',
    error: '#c03636',
    info: '#2157b4',
  },
  gradients: {
    primary: 'linear-gradient(135deg, #f5f6f8 0%, #ccd8ff 60%, #304ec8 100%)',
    secondary: 'linear-gradient(135deg, #ffffff 0%, #a1b8ff 70%, #304ec8 100%)',
    accent: 'linear-gradient(135deg, #fef4eb 0%, #f27214 100%)',
    hero: 'linear-gradient(135deg, #f5f6f8 0%, #ccd8ff 65%, #304ec8 100%)',
    surface: 'linear-gradient(135deg, #ffffff 0%, #eef1f7 100%)',
  },
  typography: darkTheme.typography,
  spacing: darkTheme.spacing,
  borderRadius: darkTheme.borderRadius,
  animation: darkTheme.animation,
  effects: {
    blur: darkTheme.effects.blur,
    shadow: {
      sm: '0 1px 2px rgba(15, 23, 42, 0.05)',
      md: '0 6px 12px -4px rgba(15, 23, 42, 0.12)',
      lg: '0 18px 32px -12px rgba(15, 23, 42, 0.14)',
      xl: '0 32px 56px -20px rgba(15, 23, 42, 0.18)',
      '2xl': '0 48px 80px -32px rgba(15, 23, 42, 0.22)',
    },
  },
};

// ===============================================
// THEME UTILITIES
// ===============================================

export const themes = {
  dark: darkTheme,
  light: lightTheme,
} as const;

export type ThemeName = keyof typeof themes;

export function getTheme(name: ThemeName): GlobalTheme {
  return themes[name] || themes.dark;
}

export function generateCSSVariables(theme: GlobalTheme): string {
  return `
    :root {
      /* Colors */
      --color-primary: ${theme.colors.primary};
      --color-secondary: ${theme.colors.secondary};
      --color-accent: ${theme.colors.accent};
      --color-background: ${theme.colors.background};
      --color-surface: ${theme.colors.surface};
      --color-overlay: ${theme.colors.overlay};
      --color-text-primary: ${theme.colors.text.primary};
      --color-text-secondary: ${theme.colors.text.secondary};
      --color-text-muted: ${theme.colors.text.muted};
      --color-text-inverse: ${theme.colors.text.inverse};
      --color-border: ${theme.colors.border};
      --color-shadow: ${theme.colors.shadow};
      --color-success: ${theme.colors.success};
      --color-warning: ${theme.colors.warning};
      --color-error: ${theme.colors.error};
      --color-info: ${theme.colors.info};

      /* Gradients */
      --gradient-primary: ${theme.gradients.primary};
      --gradient-secondary: ${theme.gradients.secondary};
      --gradient-accent: ${theme.gradients.accent};
      --gradient-hero: ${theme.gradients.hero};
      --gradient-surface: ${theme.gradients.surface};

      /* Typography */
      --font-family-sans: ${theme.typography.fontFamily.sans};
      --font-family-mono: ${theme.typography.fontFamily.mono};
      --font-family-display: ${theme.typography.fontFamily.display};

      /* Spacing */
      --spacing-xs: ${theme.spacing.xs};
      --spacing-sm: ${theme.spacing.sm};
      --spacing-md: ${theme.spacing.md};
      --spacing-lg: ${theme.spacing.lg};
      --spacing-xl: ${theme.spacing.xl};
      --spacing-2xl: ${theme.spacing['2xl']};
      --spacing-3xl: ${theme.spacing['3xl']};
      --spacing-4xl: ${theme.spacing['4xl']};

      /* Border Radius */
      --radius-sm: ${theme.borderRadius.sm};
      --radius-md: ${theme.borderRadius.md};
      --radius-lg: ${theme.borderRadius.lg};
      --radius-xl: ${theme.borderRadius.xl};
      --radius-2xl: ${theme.borderRadius['2xl']};
      --radius-full: ${theme.borderRadius.full};

      /* Animation */
      --duration-fast: ${theme.animation.duration.fast};
      --duration-normal: ${theme.animation.duration.normal};
      --duration-slow: ${theme.animation.duration.slow};

      --easing-linear: ${theme.animation.easing.linear};
      --easing-ease-in: ${theme.animation.easing.easeIn};
      --easing-ease-out: ${theme.animation.easing.easeOut};
      --easing-ease-in-out: ${theme.animation.easing.easeInOut};
      --easing-bounce: ${theme.animation.easing.bounce};

      /* Effects */
      --blur-sm: ${theme.effects.blur.sm};
      --blur-md: ${theme.effects.blur.md};
      --blur-lg: ${theme.effects.blur.lg};
      --blur-xl: ${theme.effects.blur.xl};

      --shadow-sm: ${theme.effects.shadow.sm};
      --shadow-md: ${theme.effects.shadow.md};
      --shadow-lg: ${theme.effects.shadow.lg};
      --shadow-xl: ${theme.effects.shadow.xl};
      --shadow-2xl: ${theme.effects.shadow['2xl']};
    }
  `;
}

// ===============================================
// COMPONENT THEME MIXINS
// ===============================================

export interface ComponentTheme {
  card: {
    background: string;
    border: string;
    shadow: string;
    hover: {
      transform: string;
      shadow: string;
    };
  };
  button: {
    primary: {
      background: string;
      color: string;
      hover: string;
    };
    secondary: {
      background: string;
      color: string;
      hover: string;
    };
    ghost: {
      background: string;
      color: string;
      hover: string;
    };
  };
  input: {
    background: string;
    border: string;
    color: string;
    focus: {
      border: string;
      shadow: string;
    };
  };
  modal: {
    backdrop: string;
    background: string;
    border: string;
    shadow: string;
  };
}

export function getComponentTheme(theme: GlobalTheme): ComponentTheme {
  return {
    card: {
      background: theme.colors.surface,
      border: theme.colors.border,
      shadow: theme.effects.shadow.lg,
      hover: {
        transform: 'translateY(-2px)',
        shadow: theme.effects.shadow.xl,
      },
    },
    button: {
      primary: {
        background: theme.gradients.primary,
        color: theme.colors.text.inverse,
        hover: 'brightness(1.1)',
      },
      secondary: {
        background: theme.colors.surface,
        color: theme.colors.text.primary,
        hover: theme.colors.border,
      },
      ghost: {
        background: 'transparent',
        color: theme.colors.text.secondary,
        hover: theme.colors.surface,
      },
    },
    input: {
      background: theme.colors.surface,
      border: theme.colors.border,
      color: theme.colors.text.primary,
      focus: {
        border: theme.colors.primary,
        shadow: `0 0 0 3px ${theme.colors.primary}20`,
      },
    },
    modal: {
      backdrop: theme.colors.overlay,
      background: theme.colors.surface,
      border: theme.colors.border,
      shadow: theme.effects.shadow['2xl'],
    },
  };
}

export default {
  themes,
  getTheme,
  generateCSSVariables,
  getComponentTheme,
};

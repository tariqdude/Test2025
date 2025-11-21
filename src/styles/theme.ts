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
    primary: '#64748b', // Slate 500
    secondary: '#475569', // Slate 600
    accent: '#f97316', // Orange 500
    background: '#09090b', // Zinc 950
    surface: '#18181b', // Zinc 900
    overlay: 'rgba(9, 9, 11, 0.8)',
    text: {
      primary: '#e4e4e7', // Zinc 200
      secondary: '#a1a1aa', // Zinc 400
      muted: '#71717a', // Zinc 500
      inverse: '#09090b',
    },
    border: '#27272a', // Zinc 800
    shadow: 'rgba(0, 0, 0, 0.3)',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  gradients: {
    primary: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)', // Slate 900 -> Slate 700
    secondary: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)', // Slate 800 -> Slate 600
    accent: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)', // Orange 600 -> Orange 500
    hero: 'linear-gradient(135deg, #09090b 0%, #1e293b 100%)', // Zinc 950 -> Slate 800
    surface: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)', // Zinc 900 -> Zinc 800
  },
  typography: {
    fontFamily: {
      sans: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      mono: '"JetBrains Mono", SF Mono, Monaco, Cascadia Code, monospace',
      display:
        '"JetBrains Mono", "Space Grotesk", Inter, system-ui, sans-serif',
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
    sm: '0px',
    md: '2px',
    lg: '4px',
    xl: '6px',
    '2xl': '8px',
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
    primary: '#475569', // Slate 600
    secondary: '#64748b', // Slate 500
    accent: '#ea580c', // Orange 600
    background: '#ffffff',
    surface: '#fafafa', // Zinc 50
    overlay: 'rgba(255, 255, 255, 0.8)',
    text: {
      primary: '#18181b', // Zinc 900
      secondary: '#52525b', // Zinc 600
      muted: '#71717a', // Zinc 500
      inverse: '#ffffff',
    },
    border: '#e4e4e7', // Zinc 200
    shadow: 'rgba(0, 0, 0, 0.1)',
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    info: '#2563eb',
  },
  gradients: {
    primary: 'linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%)', // Slate 100 -> Slate 300
    secondary: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)', // Slate 200 -> Slate 400
    accent: 'linear-gradient(135deg, #ffedd5 0%, #fb923c 100%)', // Orange 100 -> Orange 400
    hero: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', // Slate 50 -> Slate 200
    surface: 'linear-gradient(135deg, #ffffff 0%, #f4f4f5 100%)', // White -> Zinc 100
  },
  typography: darkTheme.typography,
  spacing: darkTheme.spacing,
  borderRadius: darkTheme.borderRadius,
  animation: darkTheme.animation,
  effects: {
    blur: darkTheme.effects.blur,
    shadow: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
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

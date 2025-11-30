/**
 * CSS utilities
 */

/**
 * Combine CSS class names conditionally
 */
export const cn = (
  ...classes: (string | undefined | null | false)[]
): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Generate CSS variables object for dynamic theming
 */
export const cssVariables = (
  variables: Record<string, string | number>
): Record<string, string> => {
  const result: Record<string, string> = {};

  Object.entries(variables).forEach(([key, value]) => {
    result[`--${key}`] = String(value);
  });

  return result;
};

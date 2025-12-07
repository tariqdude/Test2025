/**
 * Form Utilities
 * @module utils/form
 * @description Form state management, validation, and serialization utilities
 * for building robust forms with TypeScript.
 */

import { isBrowser } from './dom';

/**
 * Form field state
 */
export interface FieldState<T = unknown> {
  value: T;
  touched: boolean;
  dirty: boolean;
  valid: boolean;
  errors: string[];
  validating: boolean;
}

/**
 * Validation rule
 */
export interface ValidationRule<T = unknown> {
  /** Validation function - return error message or empty string/null if valid */
  validate: (
    value: T,
    formData: Record<string, unknown>
  ) => string | null | Promise<string | null>;
  /** Error message (can be overridden by validate return) */
  message?: string;
  /** When to run this rule */
  when?: 'change' | 'blur' | 'submit' | 'always';
}

/**
 * Form field configuration
 */
export interface FieldConfig<T = unknown> {
  /** Initial value */
  initialValue: T;
  /** Validation rules */
  rules?: ValidationRule<T>[];
  /** Transform value before validation */
  transform?: (value: T) => T;
  /** Debounce validation in ms */
  debounce?: number;
}

/**
 * Form configuration
 */
export interface FormConfig {
  /** Field configurations */
  fields: Record<string, FieldConfig>;
  /** Form-level validation */
  validate?: (
    values: Record<string, unknown>
  ) => Record<string, string[]> | Promise<Record<string, string[]>>;
  /** Called on successful submit */
  onSubmit?: (values: Record<string, unknown>) => void | Promise<void>;
  /** Called on validation error */
  onError?: (errors: Record<string, string[]>) => void;
  /** Validate on change */
  validateOnChange?: boolean;
  /** Validate on blur */
  validateOnBlur?: boolean;
}

/**
 * Form state
 */
export interface FormState {
  fields: Record<string, FieldState>;
  isValid: boolean;
  isValidating: boolean;
  isSubmitting: boolean;
  isSubmitted: boolean;
  isDirty: boolean;
  submitCount: number;
}

// ============================================================================
// Built-in Validators
// ============================================================================

export const validators = {
  /**
   * Required field validator
   */
  required: (message = 'This field is required'): ValidationRule => ({
    validate: value => {
      const isEmpty =
        value === null ||
        value === undefined ||
        value === '' ||
        (Array.isArray(value) && value.length === 0);
      return isEmpty ? message : null;
    },
  }),

  /**
   * Minimum length validator
   */
  minLength: (min: number, message?: string): ValidationRule<string> => ({
    validate: value => {
      if (!value) return null;
      return value.length < min
        ? message || `Must be at least ${min} characters`
        : null;
    },
  }),

  /**
   * Maximum length validator
   */
  maxLength: (max: number, message?: string): ValidationRule<string> => ({
    validate: value => {
      if (!value) return null;
      return value.length > max
        ? message || `Must be no more than ${max} characters`
        : null;
    },
  }),

  /**
   * Email validator
   */
  email: (message = 'Invalid email address'): ValidationRule<string> => ({
    validate: value => {
      if (!value) return null;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value) ? null : message;
    },
  }),

  /**
   * Pattern/regex validator
   */
  pattern: (
    regex: RegExp,
    message = 'Invalid format'
  ): ValidationRule<string> => ({
    validate: value => {
      if (!value) return null;
      return regex.test(value) ? null : message;
    },
  }),

  /**
   * Minimum number validator
   */
  min: (min: number, message?: string): ValidationRule<number> => ({
    validate: value => {
      if (value === null || value === undefined) return null;
      return value < min ? message || `Must be at least ${min}` : null;
    },
  }),

  /**
   * Maximum number validator
   */
  max: (max: number, message?: string): ValidationRule<number> => ({
    validate: value => {
      if (value === null || value === undefined) return null;
      return value > max ? message || `Must be no more than ${max}` : null;
    },
  }),

  /**
   * URL validator
   */
  url: (message = 'Invalid URL'): ValidationRule<string> => ({
    validate: value => {
      if (!value) return null;
      try {
        new URL(value);
        return null;
      } catch {
        return message;
      }
    },
  }),

  /**
   * Match another field validator
   */
  matches: (field: string, message?: string): ValidationRule => ({
    validate: (value, formData) => {
      const otherValue = formData[field];
      return value === otherValue ? null : message || `Must match ${field}`;
    },
  }),

  /**
   * Custom validator
   */
  custom: <T>(
    fn: (
      value: T,
      formData: Record<string, unknown>
    ) => boolean | string | Promise<boolean | string>,
    message = 'Invalid value'
  ): ValidationRule<T> => ({
    validate: async (value, formData) => {
      const result = await fn(value, formData);
      if (typeof result === 'string') return result;
      return result ? null : message;
    },
  }),
};

/**
 * Create a form manager
 * @param config - Form configuration
 * @example
 * const form = createForm({
 *   fields: {
 *     email: {
 *       initialValue: '',
 *       rules: [validators.required(), validators.email()],
 *     },
 *     password: {
 *       initialValue: '',
 *       rules: [validators.required(), validators.minLength(8)],
 *     },
 *   },
 *   onSubmit: async (values) => {
 *     await api.login(values.email, values.password);
 *   },
 * });
 */
export function createForm(config: FormConfig) {
  const {
    fields: fieldConfigs,
    validate: formValidate,
    onSubmit,
    onError,
    validateOnChange = true,
    validateOnBlur = true,
  } = config;

  // Initialize state
  const state: FormState = {
    fields: {},
    isValid: true,
    isValidating: false,
    isSubmitting: false,
    isSubmitted: false,
    isDirty: false,
    submitCount: 0,
  };

  // Initialize field states
  for (const [name, config] of Object.entries(fieldConfigs)) {
    state.fields[name] = {
      value: config.initialValue,
      touched: false,
      dirty: false,
      valid: true,
      errors: [],
      validating: false,
    };
  }

  const listeners = new Set<(state: FormState) => void>();
  const debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};

  const notify = () => {
    listeners.forEach(fn => fn(state));
  };

  const validateField = async (
    name: string,
    trigger: 'change' | 'blur' | 'submit' = 'change'
  ): Promise<string[]> => {
    const fieldConfig = fieldConfigs[name];
    const fieldState = state.fields[name];

    if (!fieldConfig || !fieldState) return [];

    const rules = fieldConfig.rules || [];
    const errors: string[] = [];

    fieldState.validating = true;
    notify();

    const value = fieldConfig.transform
      ? fieldConfig.transform(fieldState.value)
      : fieldState.value;

    const values = getValues();

    for (const rule of rules) {
      const when = rule.when || 'always';
      if (when !== 'always' && when !== trigger) continue;

      const error = await rule.validate(value, values);
      if (error) {
        errors.push(error);
      }
    }

    fieldState.errors = errors;
    fieldState.valid = errors.length === 0;
    fieldState.validating = false;

    updateFormValidity();
    notify();

    return errors;
  };

  const validateAll = async (): Promise<Record<string, string[]>> => {
    state.isValidating = true;
    notify();

    const allErrors: Record<string, string[]> = {};

    // Validate each field
    await Promise.all(
      Object.keys(fieldConfigs).map(async name => {
        const errors = await validateField(name, 'submit');
        if (errors.length > 0) {
          allErrors[name] = errors;
        }
      })
    );

    // Run form-level validation
    if (formValidate) {
      const formErrors = await formValidate(getValues());
      for (const [name, errors] of Object.entries(formErrors)) {
        if (errors.length > 0) {
          allErrors[name] = [...(allErrors[name] || []), ...errors];
          if (state.fields[name]) {
            state.fields[name].errors = allErrors[name];
            state.fields[name].valid = false;
          }
        }
      }
    }

    state.isValidating = false;
    updateFormValidity();
    notify();

    return allErrors;
  };

  const updateFormValidity = () => {
    state.isValid = Object.values(state.fields).every(f => f.valid);
    state.isDirty = Object.values(state.fields).some(f => f.dirty);
  };

  const getValues = (): Record<string, unknown> => {
    const values: Record<string, unknown> = {};
    for (const [name, fieldState] of Object.entries(state.fields)) {
      values[name] = fieldState.value;
    }
    return values;
  };

  return {
    /**
     * Get current form state
     */
    getState(): FormState {
      return { ...state, fields: { ...state.fields } };
    },

    /**
     * Get all form values
     */
    getValues,

    /**
     * Get a single field value
     */
    getValue<T = unknown>(name: string): T {
      return state.fields[name]?.value as T;
    },

    /**
     * Set a field value
     */
    setValue(name: string, value: unknown): void {
      const fieldState = state.fields[name];
      if (!fieldState) return;

      const initialValue = fieldConfigs[name]?.initialValue;
      fieldState.value = value;
      fieldState.dirty = value !== initialValue;

      if (validateOnChange) {
        const debounce = fieldConfigs[name]?.debounce || 0;

        if (debounce > 0) {
          clearTimeout(debounceTimers[name]);
          debounceTimers[name] = setTimeout(() => {
            validateField(name, 'change');
          }, debounce);
        } else {
          validateField(name, 'change');
        }
      }

      updateFormValidity();
      notify();
    },

    /**
     * Set multiple values at once
     */
    setValues(values: Record<string, unknown>): void {
      for (const [name, value] of Object.entries(values)) {
        if (state.fields[name]) {
          const initialValue = fieldConfigs[name]?.initialValue;
          state.fields[name].value = value;
          state.fields[name].dirty = value !== initialValue;
        }
      }

      if (validateOnChange) {
        validateAll();
      } else {
        updateFormValidity();
        notify();
      }
    },

    /**
     * Mark a field as touched
     */
    setTouched(name: string, touched = true): void {
      const fieldState = state.fields[name];
      if (!fieldState) return;

      fieldState.touched = touched;

      if (validateOnBlur && touched) {
        validateField(name, 'blur');
      }

      notify();
    },

    /**
     * Mark multiple fields as touched
     */
    setAllTouched(touched = true): void {
      for (const fieldState of Object.values(state.fields)) {
        fieldState.touched = touched;
      }
      notify();
    },

    /**
     * Validate a specific field
     */
    validateField,

    /**
     * Validate all fields
     */
    validate: validateAll,

    /**
     * Submit the form
     */
    async submit(): Promise<boolean> {
      state.submitCount++;
      state.isSubmitting = true;
      notify();

      // Mark all fields as touched
      this.setAllTouched(true);

      const errors = await validateAll();
      const hasErrors = Object.keys(errors).length > 0;

      if (hasErrors) {
        onError?.(errors);
        state.isSubmitting = false;
        notify();
        return false;
      }

      try {
        await onSubmit?.(getValues());
        state.isSubmitted = true;
      } catch (error) {
        // Handle submit error
        console.error('Form submit error:', error);
        state.isSubmitting = false;
        notify();
        return false;
      }

      state.isSubmitting = false;
      notify();
      return true;
    },

    /**
     * Reset form to initial values
     */
    reset(): void {
      for (const [name, config] of Object.entries(fieldConfigs)) {
        state.fields[name] = {
          value: config.initialValue,
          touched: false,
          dirty: false,
          valid: true,
          errors: [],
          validating: false,
        };
      }

      state.isValid = true;
      state.isSubmitting = false;
      state.isSubmitted = false;
      state.isDirty = false;

      notify();
    },

    /**
     * Subscribe to state changes
     */
    subscribe(callback: (state: FormState) => void): () => void {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },

    /**
     * Get field errors
     */
    getErrors(name?: string): string[] | Record<string, string[]> {
      if (name) {
        return state.fields[name]?.errors || [];
      }

      const errors: Record<string, string[]> = {};
      for (const [name, fieldState] of Object.entries(state.fields)) {
        if (fieldState.errors.length > 0) {
          errors[name] = fieldState.errors;
        }
      }
      return errors;
    },

    /**
     * Set field errors manually
     */
    setErrors(name: string, errors: string[]): void {
      if (state.fields[name]) {
        state.fields[name].errors = errors;
        state.fields[name].valid = errors.length === 0;
        updateFormValidity();
        notify();
      }
    },

    /**
     * Clear all errors
     */
    clearErrors(): void {
      for (const fieldState of Object.values(state.fields)) {
        fieldState.errors = [];
        fieldState.valid = true;
      }
      state.isValid = true;
      notify();
    },
  };
}

// ============================================================================
// Form Serialization
// ============================================================================

/**
 * Serialize form data to an object
 * @param form - Form element
 */
export function serializeForm(
  form: HTMLFormElement
): Record<string, FormDataEntryValue | FormDataEntryValue[]> {
  const formData = new FormData(form);
  const result: Record<string, FormDataEntryValue | FormDataEntryValue[]> = {};

  for (const [key, value] of formData.entries()) {
    if (key in result) {
      const existing = result[key];
      if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        result[key] = [existing, value];
      }
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Serialize form data to URL search params
 * @param form - Form element
 */
export function formToSearchParams(form: HTMLFormElement): URLSearchParams {
  return new URLSearchParams(
    new FormData(form) as unknown as Record<string, string>
  );
}

/**
 * Serialize form data to JSON
 * @param form - Form element
 */
export function formToJSON(form: HTMLFormElement): string {
  return JSON.stringify(serializeForm(form));
}

/**
 * Populate form from an object
 * @param form - Form element
 * @param data - Data to populate
 */
export function populateForm(
  form: HTMLFormElement,
  data: Record<string, unknown>
): void {
  for (const [name, value] of Object.entries(data)) {
    const element = form.elements.namedItem(name);

    if (!element) continue;

    if (element instanceof RadioNodeList) {
      // Radio buttons or checkboxes with same name
      for (const radio of element) {
        if (radio instanceof HTMLInputElement) {
          if (radio.type === 'checkbox') {
            radio.checked = Array.isArray(value)
              ? value.includes(radio.value)
              : radio.value === String(value);
          } else if (radio.type === 'radio') {
            radio.checked = radio.value === String(value);
          }
        }
      }
    } else if (element instanceof HTMLInputElement) {
      if (element.type === 'checkbox') {
        element.checked = Boolean(value);
      } else if (element.type === 'file') {
        // Cannot set file input values
      } else {
        element.value = String(value ?? '');
      }
    } else if (element instanceof HTMLSelectElement) {
      if (element.multiple && Array.isArray(value)) {
        for (const option of element.options) {
          option.selected = value.includes(option.value);
        }
      } else {
        element.value = String(value ?? '');
      }
    } else if (element instanceof HTMLTextAreaElement) {
      element.value = String(value ?? '');
    }
  }
}

/**
 * Watch form for changes
 * @param form - Form element
 * @param callback - Called on any change
 */
export function watchForm(
  form: HTMLFormElement,
  callback: (
    data: Record<string, FormDataEntryValue | FormDataEntryValue[]>
  ) => void
): () => void {
  if (!isBrowser()) return () => {};

  const handler = () => {
    callback(serializeForm(form));
  };

  form.addEventListener('input', handler);
  form.addEventListener('change', handler);

  return () => {
    form.removeEventListener('input', handler);
    form.removeEventListener('change', handler);
  };
}

/**
 * Auto-save form data to storage
 * @param form - Form element
 * @param key - Storage key
 * @param options - Options
 */
export function createFormAutoSave(
  form: HTMLFormElement,
  key: string,
  options: {
    storage?: Storage;
    debounce?: number;
    onRestore?: (data: Record<string, unknown>) => void;
  } = {}
) {
  const {
    storage = typeof localStorage !== 'undefined' ? localStorage : null,
    debounce = 500,
    onRestore,
  } = options;

  if (!storage) {
    return {
      restore: () => false,
      save: () => {},
      clear: () => {},
      stop: () => {},
    };
  }

  let timer: ReturnType<typeof setTimeout> | null = null;

  const save = () => {
    const data = serializeForm(form);
    storage.setItem(key, JSON.stringify(data));
  };

  const restore = (): boolean => {
    try {
      const saved = storage.getItem(key);
      if (saved) {
        const data = JSON.parse(saved);
        populateForm(form, data);
        onRestore?.(data);
        return true;
      }
    } catch {
      // Invalid data
    }
    return false;
  };

  const handleChange = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(save, debounce);
  };

  form.addEventListener('input', handleChange);
  form.addEventListener('change', handleChange);

  return {
    /**
     * Restore saved form data
     */
    restore,

    /**
     * Save current form data
     */
    save,

    /**
     * Clear saved data
     */
    clear(): void {
      storage.removeItem(key);
    },

    /**
     * Stop auto-saving
     */
    stop(): void {
      if (timer) clearTimeout(timer);
      form.removeEventListener('input', handleChange);
      form.removeEventListener('change', handleChange);
    },
  };
}

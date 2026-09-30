// src/components/ui/Input.tsx

import  { forwardRef, type InputHTMLAttributes } from 'react';

// ============================================================
// Props
// ============================================================
// Extend the native <input> attributes so any standard prop
// (autoComplete, maxLength, inputMode, pattern, autoFocus,
// onKeyDown, ref, …) is accepted automatically.
//
// We only *Omit* `size` because the native size attribute means
// "character width", which clashes with our visual sizing concept.
// If you don't have a `size` variant, you can drop the Omit.
// ============================================================
export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  /** Optional visual size. Distinct from the native `size` attribute. */
  size?: 'small' | 'medium' | 'large';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type = 'text',
      name,
      value,
      onChange,
      placeholder,
      label,
      error,
      required = false,
      disabled = false,
      className = '',
      size = 'medium',
      id,
      ...rest
    },
    ref
  ) => {
    const inputId = id || name;

    const sizeClasses =
      size === 'small'
        ? 'px-3 py-1.5 text-sm'
        : size === 'large'
        ? 'px-4 py-3 text-base'
        : 'px-4 py-2';

    return (
      <div className={`mb-4 ${className}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium mb-1"
          >
            {label}
            {required && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </label>
        )}

        <input
          ref={ref}
          type={type}
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          {...rest}
          className={`w-full border rounded focus:outline-none focus:ring-2 focus:ring-black ${sizeClasses} ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />

        {error && (
          <p className="text-red-500 text-sm mt-1">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
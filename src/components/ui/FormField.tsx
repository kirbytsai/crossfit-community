// src/components/ui/FormField.tsx
import { ReactNode } from 'react';
import { ErrorMessage } from './ErrorMessage';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({ 
  label, 
  error, 
  required, 
  children, 
  className = '' 
}: FormFieldProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      <ErrorMessage error={error} />
    </div>
  );
}
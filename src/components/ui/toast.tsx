"use client"

import * as React from "react"
import { X } from "lucide-react"

// Basitleştirilmiş toast bileşeni - Radix UI olmadan
interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive";
  visible?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

const ToastViewport: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div
    className={`fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px] ${className || ''}`}
    {...props}
  />
);

const Toast: React.FC<ToastProps> = ({ 
  className, 
  variant = "default", 
  visible = true,
  children,
  ...props 
}) => {
  const variantClasses = {
    default: "border bg-white text-gray-900",
    destructive: "border-red-500 bg-red-500 text-white",
  };

  if (!visible) return null;

  return (
    <div
      className={`group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg ${variantClasses[variant]} ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
};

const ToastAction: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, ...props }) => (
  <button
    className={`inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${className || ''}`}
    {...props}
  />
);

const ToastClose: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, ...props }) => (
  <button
    className={`absolute right-2 top-2 rounded-md p-1 text-gray-500 opacity-0 transition-opacity hover:text-gray-900 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 ${className || ''}`}
    {...props}
  >
    <X className="h-4 w-4" />
  </button>
);

const ToastTitle: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div
    className={`text-sm font-semibold ${className || ''}`}
    {...props}
  />
);

const ToastDescription: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div
    className={`text-sm opacity-90 ${className || ''}`}
    {...props}
  />
);

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
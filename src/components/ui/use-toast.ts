
import * as React from "react"
import { useToast as useHookToast } from "@/hooks/use-toast";
import { toast as hookToast, type Toast } from "@/hooks/use-toast";

// Re-export with appropriate type annotations
export interface ToastProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
  duration?: number;
}

export const useToast = useHookToast;
export const toast = hookToast;

/**
 * This is a compatibility layer to ensure components use the hooks/use-toast implementation
 */
export type { Toast } from "@/hooks/use-toast"

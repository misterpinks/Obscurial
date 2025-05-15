
import { toast } from "@/hooks/use-toast";

export { toast };
export type {
  ToastProps,
  ToastActionElement
} from "@/hooks/use-toast";

export const useToast = () => {
  return {
    toast,
    dismiss: toast.dismiss
  };
};

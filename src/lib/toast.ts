type ToastType = "success" | "error" | "info" | "warning";

interface ToastEvent {
  id: number;
  message: string;
  type: ToastType;
}

type ToastListener = (event: ToastEvent) => void;

let listener: ToastListener | null = null;
let counter = 0;

export function toast(message: string, type: ToastType = "info") {
  listener?.({ id: ++counter, message, type });
}

export function registerToastListener(fn: ToastListener) {
  listener = fn;
}

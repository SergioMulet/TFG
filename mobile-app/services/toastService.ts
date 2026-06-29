export type ToastKey = 'syncingData' | 'savingLocally';

type Listener = (key: ToastKey) => void;

class ToastService {
  private listeners: Listener[] = [];

  show(key: ToastKey) {
    this.listeners.forEach((listener) => listener(key));
  }

  subscribe(listener: Listener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
}

export const toastService = new ToastService();

type LoadingHandlers = { start: () => void; stop: () => void };

let handlers: LoadingHandlers | null = null;

export function registerLoadingHandlers(h: LoadingHandlers) {
  handlers = h;
}

export function notifyLoadingStart() {
  handlers?.start();
}

export function notifyLoadingStop() {
  handlers?.stop();
}
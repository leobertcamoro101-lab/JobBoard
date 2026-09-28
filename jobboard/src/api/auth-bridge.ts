type Handler = () => void;

let handler: Handler | null = null;

export const setUnauthorizedHandler = (fn: Handler) => {
  handler = fn;
};

export const notifyUnauthorized = () => {
  handler?.();
};
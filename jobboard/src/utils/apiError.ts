export const getErrorMessage = (err: any, fallback: string): string => {
  if (err?.response?.status === 429) {
    return 'Too many attempts. Please wait a minute and try again.';
  }
  return err?.response?.data?.message || fallback;
};
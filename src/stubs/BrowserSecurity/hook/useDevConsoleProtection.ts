/**
 * Hook untuk proteksi developer console
 */
export const useDevConsoleProtection = () => {
  const isProtectionEnabled = false;
  return {
    isProtectionEnabled,
  };
};

export default useDevConsoleProtection;
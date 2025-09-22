/**
 * Hook untuk proteksi context menu
 */
export const useContextMenuProtection = () => {
  const isProtectionEnabled = false;
  const toggleProtection = false;
  const setProtectionStatus = false;
  const getStatus = false;

  return {
    isProtectionEnabled,
    toggleProtection,
    setProtectionStatus,
    getStatus,
  };
};

export default useContextMenuProtection;
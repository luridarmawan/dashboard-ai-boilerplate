// src/stubs/BrowserSecurity/frontend/utils/securityManager.ts

/**
 * No-op SecurityManager
 * 
 * Digunakan saat VITE_APP_USE_SIMPLE_PROTECTION=false.
 * Semua fungsi hanya placeholder agar build tidak gagal.
 */

class NoopSecurityManager {
  private static instance: NoopSecurityManager;

  static getInstance(): NoopSecurityManager {
    if (!NoopSecurityManager.instance) {
      NoopSecurityManager.instance = new NoopSecurityManager();
    }
    return NoopSecurityManager.instance;
  }

  async activateAllProtections(): Promise<void> {
    if (import.meta.env.DEV) {
      // console.log("[noopSecurity] activateAllProtections() dipanggil, noop.");
    }
  }

  deactivateAllProtections(): void {
    if (import.meta.env.DEV) {
      // console.log("[noopSecurity] deactivateAllProtections() dipanggil, noop.");
    }
  }

  resetAllProtections(): void {
    if (import.meta.env.DEV) {
      // console.log("[noopSecurity] resetAllProtections() dipanggil, noop.");
    }
  }

  getAllProtectionStatus() {
    return {
      devConsole: {
        isEnabled: false,
        isInitialized: false,
      },
      contextMenu: {
        isEnabled: false,
        isActive: false,
      },
    };
  }
}

export default NoopSecurityManager;

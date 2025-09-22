/**
 * Security Manager - Utility untuk mengelola semua sistem keamanan
 */

import DevConsoleDetector from './devConsoleDetector';
import ContextMenuProtector from './contextMenuProtector';

export class SecurityManager {
  private static instance: SecurityManager;

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  /**
   * Aktifkan semua proteksi keamanan setelah login berhasil
   */
  async activateAllProtections(): Promise<void> {
    //console.log('SecurityManager: Activating all security protections...');
    
    try {
      // Initialize developer console protection
      const devConsoleDetector = DevConsoleDetector.getInstance();
      await devConsoleDetector.initialize();
      
      if (devConsoleDetector.isFeatureEnabled()) {
        devConsoleDetector.disableConsoleMethods();
        devConsoleDetector.disableKeyboardShortcuts();
        devConsoleDetector.startMonitoring();
        //console.log('SecurityManager: Developer console protection activated');
      }

      // Initialize context menu protection
      const contextMenuProtector = ContextMenuProtector.getInstance();
      await contextMenuProtector.initialize();
      
      if (contextMenuProtector.isProtectionEnabled()) {
        contextMenuProtector.enableProtection();
        //console.log('SecurityManager: Context menu protection activated');
      }

      //console.log('SecurityManager: All security protections activated successfully');
    } catch (error) {
      console.error('SecurityManager: Failed to activate security protections:', error);
    }
  }

  /**
   * Nonaktifkan semua proteksi keamanan saat logout
   */
  deactivateAllProtections(): void {
    //console.log('SecurityManager: Deactivating all security protections...');
    
    try {
      // Stop developer console protection
      const devConsoleDetector = DevConsoleDetector.getInstance();
      devConsoleDetector.stopMonitoring();
      
      // Stop context menu protection
      const contextMenuProtector = ContextMenuProtector.getInstance();
      contextMenuProtector.disableProtection();

      //console.log('SecurityManager: All security protections deactivated');
    } catch (error) {
      console.error('SecurityManager: Failed to deactivate security protections:', error);
    }
  }

  /**
   * Reset semua proteksi (untuk debugging)
   */
  resetAllProtections(): void {
    //console.log('SecurityManager: Resetting all security protections...');
    
    try {
      const devConsoleDetector = DevConsoleDetector.getInstance();
      devConsoleDetector.resetInitializationState();
      
      const contextMenuProtector = ContextMenuProtector.getInstance();
      contextMenuProtector.resetInitializationState();

      //console.log('SecurityManager: All security protections reset');
    } catch (error) {
      console.error('SecurityManager: Failed to reset security protections:', error);
    }
  }

  /**
   * Get status semua proteksi
   */
  getAllProtectionStatus(): {
    devConsole: {
      isEnabled: boolean;
      isInitialized: boolean;
    };
    contextMenu: {
      isEnabled: boolean;
      isActive: boolean;
    };
  } {
    const devConsoleDetector = DevConsoleDetector.getInstance();
    const contextMenuProtector = ContextMenuProtector.getInstance();

    return {
      devConsole: {
        isEnabled: devConsoleDetector.isFeatureEnabled(),
        isInitialized: devConsoleDetector.isInitializedState(),
      },
      contextMenu: {
        isEnabled: contextMenuProtector.isProtectionEnabled(),
        isActive: contextMenuProtector.getProtectionStatus().isActive,
      },
    };
  }
}

export default SecurityManager;
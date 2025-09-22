/**
 * Utility untuk mengontrol context menu (right-click menu)
 */

import { getConfigurationAsBoolean } from "../../../../src/utils/configuration";

export class ContextMenuProtector {
  private static instance: ContextMenuProtector;
  private isEnabled: boolean;
  private eventListener: ((e: MouseEvent) => boolean) | null = null;
  private isInitialized: boolean = false;
  private isInitializing: boolean = false;
  private lastAuthState: string | null = null;

  constructor() {
    this.isEnabled = import.meta.env.VITE_APP_DISABLE_CONTEXT_MENU === 'true';
    // Don't auto-initialize in constructor to prevent multiple calls
    // Let the hook handle initialization
  }

  static getInstance(): ContextMenuProtector {
    if (!ContextMenuProtector.instance) {
      ContextMenuProtector.instance = new ContextMenuProtector();
      //console.log('ContextMenuProtector instance created');
    }
    return ContextMenuProtector.instance;
  }

  /**
   * Aktifkan proteksi context menu
   */
  enableProtection(): void {
    if (!this.isEnabled || this.eventListener) return;

    this.eventListener = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    document.addEventListener('contextmenu', this.eventListener, { 
      passive: false,
      capture: true 
    });

    // Tambahan proteksi untuk mobile
    document.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd, { passive: false });
  }

  /**
   * Nonaktifkan proteksi context menu
   */
  disableProtection(): void {
    if (this.eventListener) {
      document.removeEventListener('contextmenu', this.eventListener, { capture: true });
      this.eventListener = null;
    }

    document.removeEventListener('touchstart', this.handleTouchStart);
    document.removeEventListener('touchend', this.handleTouchEnd);
  }

  /**
   * Handle touch start untuk mobile context menu
   */
  private handleTouchStart = (e: TouchEvent) => {
    if (!this.isEnabled) return;
    
    // Detect long press (potential context menu trigger)
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const target = touch.target as HTMLElement;
      
      // Allow context menu on input fields for better UX
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }
    }
  };

  /**
   * Handle touch end untuk mobile context menu
   */
  private handleTouchEnd = (_e: TouchEvent) => {
    if (!this.isEnabled) return;
    // Additional mobile context menu prevention logic can be added here
  };

  /**
   * Initialize configuration asynchronously
   */
  private async initializeWithConfiguration(): Promise<void> {
    const callId = Math.random().toString(36).substr(2, 9);
    //console.log(`[${callId}] ContextMenuProtector initializeWithConfiguration() called`);
    
    try {
      const token = localStorage.getItem('auth_token');
      //console.log(`[${callId}] Calling getConfigurationAsBoolean with token:`, token ? 'present' : 'null');
      
      const disableContextMenu = await getConfigurationAsBoolean('context.menu.protection', false, token);
      //console.log(`[${callId}] API returned:`, disableContextMenu);

      // Update enabled status based on API configuration
      this.isEnabled = disableContextMenu || import.meta.env.VITE_APP_DISABLE_CONTEXT_MENU === 'true';

      //console.log(`[${callId}] Context menu protection configured:`, this.isEnabled);
    } catch (error) {
      console.error(`[${callId}] Failed to load context menu configuration:`, error);
      // Fallback to environment variable if API fails
      this.isEnabled = import.meta.env.VITE_APP_DISABLE_CONTEXT_MENU === 'true';
    }
  }

  /**
   * Initialize or re-initialize configuration
   */
  public async initialize(): Promise<void> {
    const currentAuthState = this.getCurrentAuthState();

    // Skip if auth state hasn't changed and already initialized
    if (this.isInitialized && this.lastAuthState === currentAuthState) {
      //console.log('Auth state unchanged and already initialized, skipping');
      return;
    }

    // Prevent multiple simultaneous initializations
    if (this.isInitializing) {
      //console.log('Already initializing, skipping');
      return;
    }

    //console.log('Initializing context menu protection configuration...');
    this.lastAuthState = currentAuthState;
    this.isInitializing = true;

    try {
      const isLoggedIn = this.checkLoginStatus();

      if (isLoggedIn) {
        await this.initializeWithConfiguration();
      } else {
        // When logged out, fallback to environment variable only
        this.isEnabled = import.meta.env.VITE_APP_DISABLE_CONTEXT_MENU === 'true';
        //console.log('User logged out, using environment configuration:', this.isEnabled);
      }
      
      this.isInitialized = true;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Get current authentication state for comparison
   */
  private getCurrentAuthState(): string {
    const token = localStorage.getItem('auth_token');
    const clientId = localStorage.getItem('selectedClientId');
    return `${token || 'null'}-${clientId || 'null'}`;
  }

  /**
   * Check login status
   */
  private checkLoginStatus(): boolean {
    // Check if user is logged in by checking localStorage token and user data
    const token = localStorage.getItem('auth_token');
    const selectedClientId = localStorage.getItem('selectedClientId');
    const hasValidToken = token && selectedClientId && token.length > 0;
    return (hasValidToken) ? true : false;
  }

  /**
   * Check if protector is initialized
   */
  public isInitializedState(): boolean {
    return this.isInitialized;
  }

  /**
   * Check if protector is currently initializing
   */
  public isInitializingState(): boolean {
    return this.isInitializing;
  }

  /**
   * Force reset initialization state (for debugging)
   */
  public resetInitializationState(): void {
    this.isInitialized = false;
    this.isInitializing = false;
    this.lastAuthState = null;
    //console.log('ContextMenuProtector initialization state reset');
  }

  /**
   * Check apakah proteksi enabled
   */
  isProtectionEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Toggle proteksi context menu
   */
  toggleProtection(): void {
    if (this.eventListener) {
      this.disableProtection();
    } else {
      this.enableProtection();
    }
  }

  /**
   * Set status proteksi secara manual (override environment)
   */
  setProtectionStatus(enabled: boolean): void {
    this.isEnabled = enabled;
    
    if (enabled) {
      this.enableProtection();
    } else {
      this.disableProtection();
    }
  }

  /**
   * Get current protection status
   */
  getProtectionStatus(): {
    isEnabled: boolean;
    isActive: boolean;
    environmentSetting: string;
  } {
    return {
      isEnabled: this.isEnabled,
      isActive: this.eventListener !== null,
      environmentSetting: import.meta.env.VITE_APP_DISABLE_CONTEXT_MENU || 'false'
    };
  }
}

export default ContextMenuProtector;
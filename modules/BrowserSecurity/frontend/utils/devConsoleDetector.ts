/**
 * Utility untuk mendeteksi apakah developer console terbuka
 */

import { getConfigurationAsBoolean } from "../../../../src/utils/configuration";

export class DevConsoleDetector {
  private static instance: DevConsoleDetector;
  private isEnabled: boolean;
  private callbacks: Array<(isOpen: boolean) => void> = [];
  private checkInterval: number | null = null;
  private threshold = 160; // Threshold untuk mendeteksi console terbuka
  private lastNotification = 0; // Timestamp untuk debouncing
  private debounceDelay = 1000; // 1 detik debounce
  private isInitialized: boolean = false;
  private isInitializing: boolean = false;
  private lastAuthState: string | null = null;

  constructor() {
    this.isEnabled = import.meta.env.VITE_APP_DISABLE_DEVELOPER_CONSOLE === 'true';
    // Don't auto-initialize in constructor to prevent multiple calls
    // Let the hook handle initialization
  }



  /**
   * Initialize configuration asynchronously
   */
  private async initializeWithConfiguration(): Promise<void> {
    const callId = Math.random().toString(36).substr(2, 9);
    //console.log(`[${callId}] initializeWithConfiguration() called`);

    try {
      const token = localStorage.getItem('auth_token');
      //console.log(`[${callId}] Calling getConfigurationAsBoolean with token:`, token ? 'present' : 'null');

      const disableDeveloperConsole = await getConfigurationAsBoolean('developer.console.protection', false, token);
      //console.log(`[${callId}] API returned:`, disableDeveloperConsole);

      // Update enabled status based on API configuration
      this.isEnabled = disableDeveloperConsole || import.meta.env.VITE_APP_DISABLE_DEVELOPER_CONSOLE === 'true';

      //console.log(`[${callId}] Developer console protection configured:`, this.isEnabled);
    } catch (error) {
      console.error(`[${callId}] Failed to load developer console configuration:`, error);
      // Fallback to environment variable if API fails
      this.isEnabled = import.meta.env.VITE_APP_DISABLE_DEVELOPER_CONSOLE === 'true';
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

    //console.log('Initializing developer console configuration...');
    this.lastAuthState = currentAuthState;
    this.isInitializing = true;

    try {
      const isLoggedIn = this.checkLoginStatus();

      if (isLoggedIn) {
        await this.initializeWithConfiguration();
      } else {
        // When logged out, fallback to environment variable only
        this.isEnabled = import.meta.env.VITE_APP_DISABLE_DEVELOPER_CONSOLE === 'true';
        //console.log('User logged out, using environment configuration:', this.isEnabled);
      }

      this.isInitialized = true;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * @deprecated Use initialize() instead
   */
  public async reinitialize(): Promise<void> {
    return this.initialize();
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
   * Check if detector is initialized
   */
  public isInitializedState(): boolean {
    return this.isInitialized;
  }

  /**
   * Check if detector is currently initializing
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
    //console.log('DevConsoleDetector initialization state reset');
  }

  static getInstance(): DevConsoleDetector {
    if (!DevConsoleDetector.instance) {
      DevConsoleDetector.instance = new DevConsoleDetector();
      //console.log('DevConsoleDetector instance created');
    }
    return DevConsoleDetector.instance;
  }

  /**
   * Mulai monitoring developer console
   */
  startMonitoring(): void {
    if (!this.isEnabled) return;

    // Method 1: Menggunakan perbedaan ukuran window
    this.checkInterval = window.setInterval(() => {
      const widthThreshold = window.outerWidth - window.innerWidth > this.threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > this.threshold;

      if (widthThreshold || heightThreshold) {
        this.notifyCallbacks(true);
      }
    }, 500);

    // Method 2: Menggunakan console.log detection
    this.setupConsoleDetection();

    // Method 3: Menggunakan debugger detection
    this.setupDebuggerDetection();
  }

  /**
   * Berhenti monitoring
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Setup deteksi console.log
   */
  private setupConsoleDetection(): void {
    if (!this.isEnabled) return;

    const originalLog = console.log;
    let logCount = 0;

    console.log = (...args) => {
      logCount++;
      if (logCount > 0) {
        // Jika ada aktivitas console, kemungkinan console terbuka
        this.notifyCallbacks(true);
      }
      return originalLog.apply(console, args);
    };
  }

  /**
   * Setup deteksi debugger
   */
  private setupDebuggerDetection(): void {
    if (!this.isEnabled) return;

    setInterval(() => {
      const start = performance.now();
      debugger; // eslint-disable-line no-debugger
      const end = performance.now();

      // Jika debugger statement memakan waktu lama, console kemungkinan terbuka
      if (end - start > 100) {
        this.notifyCallbacks(true);
      }
    }, 1000);
  }

  /**
   * Tambah callback untuk notifikasi
   */
  addCallback(callback: (isOpen: boolean) => void): void {
    this.callbacks.push(callback);
  }

  /**
   * Hapus callback
   */
  removeCallback(callback: (isOpen: boolean) => void): void {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  /**
   * Notify semua callbacks dengan debouncing
   */
  private notifyCallbacks(isOpen: boolean): void {
    const now = Date.now();
    if (now - this.lastNotification < this.debounceDelay) {
      return; // Skip jika masih dalam periode debounce
    }

    this.lastNotification = now;
    this.callbacks.forEach(callback => callback(isOpen));
  }

  /**
   * Check login status
   */
  private checkLoginStatus(): boolean {
    // Check if user is logged in by checking localStorage token and user data
    // TODO: make it more secure
    const token = localStorage.getItem('auth_token');
    const selectedClientId = localStorage.getItem('selectedClientId');
    const hasValidToken = token && selectedClientId && token.length > 0;
    return (hasValidToken) ? true : false;
  }

  /**
   * Check apakah fitur enabled
   */
  isFeatureEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Disable console methods untuk keamanan tambahan
   */
  disableConsoleMethods(): void {
    if (!this.isEnabled) return;

    const noop = () => { };

    // Disable console methods
    console.log = noop;
    console.warn = noop;
    console.error = noop;
    console.info = noop;
    console.debug = noop;
    console.trace = noop;
    console.table = noop;
    console.group = noop;
    console.groupEnd = noop;
    console.clear = noop;
  }

  /**
   * Disable right click context menu
   * @deprecated Use ContextMenuProtector instead for better control
   */
  disableContextMenu(): void {
    // This method is deprecated, use ContextMenuProtector for context menu control
    console.warn('DevConsoleDetector.disableContextMenu() is deprecated. Use ContextMenuProtector instead.');
  }

  /**
   * Disable keyboard shortcuts untuk developer tools
   */
  disableKeyboardShortcuts(): void {
    if (!this.isEnabled) return;

    document.addEventListener('keydown', (e) => {
      // Disable F12
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }

      // Disable Ctrl+Shift+I
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return false;
      }

      // Disable Ctrl+Shift+J
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        return false;
      }

      // Disable Ctrl+U (view source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        return false;
      }

      // Disable Ctrl+Shift+C (inspect element)
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        return false;
      }
    });
  }
}

export default DevConsoleDetector;
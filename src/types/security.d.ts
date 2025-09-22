declare module '@security' {
  export default class SecurityManager {
    static getInstance(): SecurityManager;
    activateAllProtections(): Promise<void>;
    deactivateAllProtections(): void;
    resetAllProtections(): void;
    getAllProtectionStatus(): {
      devConsole: { isEnabled: boolean; isInitialized: boolean };
      contextMenu: { isEnabled: boolean; isActive: boolean };
    };
  }
}

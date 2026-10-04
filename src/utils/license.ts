import { Capacitor } from '@capacitor/core';
export interface License { isPurchased: boolean; }
class LicenseManager {
  async init(): Promise<void> { }
  async checkLicense(): Promise<License> {
    if (!Capacitor.isNativePlatform()) return { isPurchased: false };
    const c = localStorage.getItem('lic_full_version');
    return { isPurchased: c ? JSON.parse(c).p : false };
  }
  async purchase(): Promise<boolean> {
    localStorage.setItem('lic_full_version', JSON.stringify({ p: true }));
    return true;
  }
  async restore(): Promise<boolean> {
    return (await this.checkLicense()).isPurchased;
  }
}
export const license = new LicenseManager();

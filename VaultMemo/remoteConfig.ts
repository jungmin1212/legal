// Firebase Remote Config — pricing, announcements, and the free-wallet whitelist.
// Nothing here reads or transmits memo content, wallet keys, or personal data.
import remoteConfig from '@react-native-firebase/remote-config';

export interface PricingTier {
  name: string;
  max: number;
  usd: number;
  label: string;
}

export interface FreeWalletEntry {
  addr: string;
  until: string; // "YYYY-MM-DD", free until end of this day
}

const DEFAULT_TIERS: PricingTier[] = [
  {name: 'Trial',    max:  200, usd: 0,    label: 'Free'},
  {name: 'Seed',     max:  512, usd: 0.80, label: '$0.80'},
  {name: 'Basic',    max: 1024, usd: 1.20, label: '$1.20'},
  {name: 'Standard', max: 1536, usd: 1.40, label: '$1.40'},
  {name: 'Max',      max: 2048, usd: 1.60, label: '$1.60'},
  {name: 'Pro',      max: 3072, usd: 1.90, label: '$1.90'},
  {name: 'Ultra',    max: 4096, usd: 2.20, label: '$2.20'},
];

export async function initRemoteConfig(): Promise<void> {
  await remoteConfig().setDefaults({
    pricing_tiers:     JSON.stringify(DEFAULT_TIERS),
    announcement_text: '',
    free_wallets:      '[]',
  });
  await remoteConfig().setConfigSettings({minimumFetchIntervalMillis: 300000});
  await remoteConfig().fetchAndActivate();
}

export function getPricingTiers(): PricingTier[] {
  try {
    const parsed = JSON.parse(remoteConfig().getValue('pricing_tiers').asString());
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}
  return DEFAULT_TIERS;
}

export function getAnnouncementText(): string {
  return remoteConfig().getValue('announcement_text').asString();
}

// Checks the fetched whitelist locally — the wallet address itself never leaves the device.
// Editing free_wallets in the Firebase console takes effect without a new app build.
export function isFreeWallet(walletAddr: string): boolean {
  try {
    const list: FreeWalletEntry[] = JSON.parse(remoteConfig().getValue('free_wallets').asString());
    if (!Array.isArray(list)) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return list.some(entry => {
      if (entry.addr !== walletAddr) return false;
      const until = new Date(entry.until);
      until.setHours(23, 59, 59, 999);
      return today <= until;
    });
  } catch {
    return false;
  }
}

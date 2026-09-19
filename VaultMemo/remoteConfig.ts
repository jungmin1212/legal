/**
 * VaultMemo Firebase Remote Config
 * - pricing_tiers:     요금제 JSON
 * - announcement_text: 공지 문구 (빈 문자열이면 미표시)
 * - free_wallets:      무료 사용 허가 지갑 목록 JSON
 *   형식: [{"addr":"ABC...","until":"2026-12-31"}, ...]
 *   until 날짜 당일까지 무료 (이후 일반 결제)
 */
import remoteConfig from '@react-native-firebase/remote-config';

export interface PricingTier {
  name: string;
  max: number;
  usd: number;
  label: string;
}

export interface FreeWalletEntry {
  addr:  string;
  until: string; // "YYYY-MM-DD"
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
  await remoteConfig().setConfigSettings({minimumFetchIntervalMillis: 300000}); // 5분
  await remoteConfig().fetchAndActivate();
}

export function getPricingTiers(): PricingTier[] {
  try {
    const raw = remoteConfig().getValue('pricing_tiers').asString();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}
  return DEFAULT_TIERS;
}

export function getAnnouncementText(): string {
  return remoteConfig().getValue('announcement_text').asString();
}

/**
 * 현재 날짜 기준으로 walletAddr 가 무료 대상인지 확인.
 * Firebase 콘솔에서 free_wallets 값을 수정하면 앱 재빌드 없이 반영됨.
 */
export function isFreeWallet(walletAddr: string): boolean {
  try {
    const raw = remoteConfig().getValue('free_wallets').asString();
    const list: FreeWalletEntry[] = JSON.parse(raw);
    if (!Array.isArray(list)) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return list.some(entry => {
      if (entry.addr !== walletAddr) return false;
      const until = new Date(entry.until);
      until.setHours(23, 59, 59, 999); // until 날짜 당일 말까지
      return today <= until;
    });
  } catch {
    return false;
  }
}

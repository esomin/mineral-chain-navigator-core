/**
 * Mapping dictionary from Korean country names in Korea Customs trade statistics to ISO 3166-1 alpha-2 codes.
 */
export const KOREAN_COUNTRY_CODE_MAP: Record<string, string> = {
  중국: 'CN',
  칠레: 'CL',
  호주: 'AU',
  미국: 'US',
  일본: 'JP',
  모로코: 'MA',
  아르헨티나: 'AR',
  인도네시아: 'ID',
  캐나다: 'CA',
  독일: 'DE',
  스위스: 'CH',
  싱가포르: 'SG',
  영국: 'GB',
  오스트리아: 'AT',
  인도: 'IN',
  체코공화국: 'CZ',
  태국: 'TH',
  튀르키예: 'TR',
  헝가리: 'HU',
  벨기에: 'BE',
  베트남: 'VN',
  말레이시아: 'MY',
  대만: 'TW',
  필리핀: 'PH',
  남아프리카공화국: 'ZA',
  브라질: 'BR',
  러시아: 'RU',
  멕시코: 'MX',
  폴란드: 'PL',
};

/**
 * Resolves Korean country name to ISO 3166-1 alpha-2 code, or returns undefined if unknown.
 */
export function getCountryCodeFromKorean(koreanName: string): string | undefined {
  const normalized = koreanName.trim();
  return KOREAN_COUNTRY_CODE_MAP[normalized];
}


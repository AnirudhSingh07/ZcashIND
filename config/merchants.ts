import { site } from "./site";

/**
 * Indian businesses that accept ZEC, as listed on ZecMap.
 *
 * India has 5 active ZecMap listings (see https://x.com/ZcashIND/status/2084200884108710268).
 * Add each one here as you confirm its ZecMap page. Only listings you have
 * verified should go in this file.
 */
export type Merchant = {
  name: string;
  city: string;
  state?: string;
  category: string;
  accepts: string;
  zecmapUrl: string;
  note?: string;
};

export const merchants: Merchant[] = [
  {
    name: "Raj NX Mobiles",
    city: "Ujjain",
    state: "Madhya Pradesh",
    category: "Mobile retail",
    accepts: "ZEC (shielded)",
    zecmapUrl: "https://zecmap.com/business/raj-nx-mobiles",
    note: "The first Indian merchant onboarded by Zcash India. 1, Kamla Nehru Marg, Ujjain.",
  },
];

/** Total ZecMap listings in India, including ones not yet detailed above. */
export const merchantCountIndia = 5;

export const merchantLinks = {
  browse: site.links.zecmap,
  add: site.links.zecmapAdd,
};

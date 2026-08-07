const BANK_CODE_ALIASES: Record<string, string> = {
  VCB: "VCB",
  VIETCOMBANK: "VCB",
  TCB: "TCB",
  TECHCOMBANK: "TCB",
  MB: "MB",
  MBBANK: "MB",
  MILITARYBANK: "MB",
  TPB: "TPB",
  TPBANK: "TPB",
  TIENPHONGBANK: "TPB",
  ACB: "ACB",
  CTG: "CTG",
  VIETINBANK: "CTG",
  BIDV: "BIDV",
  STB: "STB",
  SACOMBANK: "STB",
  VPB: "VPB",
  VPBANK: "VPB",
  VIB: "VIB",
  HDB: "HDB",
  HDBANK: "HDB",
  SHB: "SHB",
  OCB: "OCB",
  MSB: "MSB",
};

export function getVietQrBankCode(bankNameOrCode?: string): string {
  const raw = (bankNameOrCode || "VCB").trim().toUpperCase();
  const parenthesized = raw.match(/\(([^)]+)\)/)?.[1];
  const normalizedParenthesized = parenthesized?.replace(/[^A-Z0-9]/g, "");
  if (normalizedParenthesized && BANK_CODE_ALIASES[normalizedParenthesized]) {
    return BANK_CODE_ALIASES[normalizedParenthesized];
  }

  const normalized = raw.replace(/[^A-Z0-9]/g, "");
  if (BANK_CODE_ALIASES[normalized]) {
    return BANK_CODE_ALIASES[normalized];
  }

  const match = Object.keys(BANK_CODE_ALIASES).find((alias) => normalized.includes(alias));
  return match ? BANK_CODE_ALIASES[match] : normalized || "VCB";
}

export function buildVietQrImageUrl(params: {
  bankNameOrCode?: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  addInfo: string;
  template?: "compact" | "compact2" | "qr_only" | "print";
}): string {
  const bankCode = getVietQrBankCode(params.bankNameOrCode);
  const accountNumber = params.accountNumber.replace(/\s+/g, "");
  const amount = Math.max(0, Math.round(Number(params.amount) || 0));
  const template = params.template || "compact2";

  const query = new URLSearchParams({
    amount: String(amount),
    addInfo: params.addInfo,
    accountName: params.accountName,
  });

  return `https://img.vietqr.io/image/${bankCode}-${accountNumber}-${template}.jpg?${query.toString()}`;
}

export function buildMockQrImageUrl(data: string, size = 250): string {
  const query = new URLSearchParams({
    size: `${size}x${size}`,
    margin: "10",
    data,
  });

  return `https://api.qrserver.com/v1/create-qr-code/?${query.toString()}`;
}

export function isLivePaymentMode(modeResponse: any): boolean {
  if (modeResponse?.isLive === true) return true;
  if (modeResponse?.isMock === true) return false;
  return String(modeResponse?.mode || "").trim().toUpperCase() === "LIVE";
}

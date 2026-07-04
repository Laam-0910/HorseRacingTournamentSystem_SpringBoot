/**
 * Safe helper to parse dates from various formats:
 * - dd-MM-yyyy HH:mm:ss
 * - dd-MM-yyyy HH-mm-ss
 * - yyyy-MM-ddTHH:mm:ss
 * - yyyy-MM-dd HH:mm:ss
 */
export const parseSafeDate = (str: string): Date | null => {
  if (!str) return null;
  
  // Try matching dd-MM-yyyy HH:mm:ss or dd-MM-yyyy HH-mm-ss
  const dmyMatch = str.match(/^(\d{2})[-/](\d{2})[-/](\d{4})[ T](\d{2})[-:](\d{2})[-:](\d{2})/);
  if (dmyMatch) {
    const [_, day, month, year, hours, minutes, seconds] = dmyMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), parseInt(seconds));
  }

  // Try matching yyyy-MM-dd HH:mm:ss or yyyy-MM-ddTHH:mm:ss
  const ymdMatch = str.match(/^(\d{4})[-/](\d{2})[-/](\d{2})[ T](\d{2})[-:](\d{2})[-:](\d{2})/);
  if (ymdMatch) {
    const [_, year, month, day, hours, minutes, seconds] = ymdMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), parseInt(seconds));
  }

  // Fallback
  const d = new Date(str.replace(" ", "T"));
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Formats a Date object or string into dd-MM-yyyy
 */
export const formatDate = (dateInput: Date | string | null | undefined): string => {
  if (!dateInput) return "";
  const d = typeof dateInput === "string" ? parseSafeDate(dateInput) : dateInput;
  if (!d || isNaN(d.getTime())) return typeof dateInput === "string" ? dateInput.split(" ")[0] : "";

  const pad = (n: number) => String(n).padStart(2, '0');
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
};

/**
 * Formats a Date object or string into dd-MM-yyyy HH:mm:ss
 */
export const formatDateTime = (dateInput: Date | string | null | undefined): string => {
  if (!dateInput) return "";
  const d = typeof dateInput === "string" ? parseSafeDate(dateInput) : dateInput;
  if (!d || isNaN(d.getTime())) return typeof dateInput === "string" ? dateInput : "";

  const pad = (n: number) => String(n).padStart(2, '0');
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());

  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
};

/**
 * Formats a Date object or string into yyyy-MM-ddTHH:mm:ss for <input type="datetime-local">
 */
export const formatForDateTimeLocal = (dateInput: Date | string | null | undefined): string => {
  if (!dateInput) return "";
  const d = typeof dateInput === "string" ? parseSafeDate(dateInput) : dateInput;
  if (!d || isNaN(d.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, '0');
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

/**
 * Formats a Date object or string to dd-MM-yyyy HH:mm:ss for API payload submission
 */
export const formatForApi = (htmlInputStr: string): string => {
  if (!htmlInputStr) return "";
  const d = new Date(htmlInputStr.replace(" ", "T"));
  if (isNaN(d.getTime())) return htmlInputStr;
  return formatDateTime(d);
};

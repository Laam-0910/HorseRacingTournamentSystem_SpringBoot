/**
 * Safe helper to parse dates from various formats:
 * - dd-MM-yyyy HH:mm:ss
 * - dd-MM-yyyy HH-mm-ss
 * - yyyy-MM-ddTHH:mm:ss
 * - yyyy-MM-dd HH:mm:ss
 */
export const parseSafeDate = (str: string): Date | null => { // Function to safely parse a string into a Date object
  if (!str) return null; // If input string is empty or null, return null immediately
  const cleanStr = str.trim(); // Remove leading and trailing whitespaces from the input string
  // Try matching dd-MM-yyyy HH:mm:ss or dd-MM-yyyy HH:mm FIRST
  // (Must check before native Date() which misreads dd-MM-yyyy as MM-DD-YYYY)
  const dmyMatch = cleanStr.match(/^(\d{2})[-/](\d{2})[-/](\d{4})[ T](\d{2})[-:](\d{2})(?:[-:](\d{2}))?/); // Regex to match dd-MM-yyyy format with time
  if (dmyMatch) { // If the regex matches the string
    const [_, day, month, year, hours, minutes, seconds] = dmyMatch; // Extract the date and time components from the regex match
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), seconds ? parseInt(seconds) : 0); // Create and return a new Date object based on the extracted components
  }

  // Try matching dd-MM-yyyy or dd/MM/yyyy (date only) first
  const dmyDateMatch = cleanStr.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/); // Regex to match dd-MM-yyyy format without time
  if (dmyDateMatch) { // If the regex matches the date only string
    const [_, day, month, year] = dmyDateMatch; // Extract day, month, and year components
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)); // Create and return a new Date object using just the date parts
  }

  // For ISO 8601 format (yyyy-MM-ddTHH:mm:ss or yyyy-MM-dd HH:mm:ss), use native Date()
  const parsed = new Date(cleanStr.includes(" ") ? cleanStr.replace(" ", "T") : cleanStr); // Replace space with T for ISO format and parse using native Date
  if (!isNaN(parsed.getTime())) { // Check if the parsed Date is a valid date (not NaN)
    return parsed; // Return the valid Date object
  }

  return null; // If all parsing attempts fail, return null
};


/**
 * Formats a Date object or string into dd-MM-yyyy
 */
export const formatDate = (dateInput: Date | string | null | undefined): string => { // Function to format a date to dd-MM-yyyy string
  if (!dateInput) return ""; // Return empty string if input is falsy
  const d = typeof dateInput === "string" ? parseSafeDate(dateInput) : dateInput; // Convert string to Date using safe parser if needed
  if (!d || isNaN(d.getTime())) return typeof dateInput === "string" ? dateInput.split(" ")[0] : ""; // Return the original date string part or empty if invalid

  const pad = (n: number) => String(n).padStart(2, '0'); // Helper function to pad numbers with a leading zero if they are single digits
  const day = pad(d.getDate()); // Get day and pad with leading zero
  const month = pad(d.getMonth() + 1); // Get month (0-indexed so add 1) and pad
  const year = d.getFullYear(); // Get the full 4-digit year

  return `${day}-${month}-${year}`; // Construct and return the formatted date string
};

/**
 * Formats a Date object or string into dd-MM-yyyy HH:mm:ss
 */
export const formatDateTime = (dateInput: Date | string | null | undefined): string => { // Function to format a date to dd-MM-yyyy HH:mm:ss string
  if (!dateInput) return ""; // Return empty string if input is falsy
  const d = typeof dateInput === "string" ? parseSafeDate(dateInput) : dateInput; // Parse input to Date object if it is a string
  if (!d || isNaN(d.getTime())) return typeof dateInput === "string" ? dateInput : ""; // If invalid date, return original string or empty string

  const pad = (n: number) => String(n).padStart(2, '0'); // Helper function to pad single digit numbers with zero
  const day = pad(d.getDate()); // Extract and pad day
  const month = pad(d.getMonth() + 1); // Extract and pad month
  const year = d.getFullYear(); // Extract 4-digit year
  const hours = pad(d.getHours()); // Extract and pad hours
  const minutes = pad(d.getMinutes()); // Extract and pad minutes
  const seconds = pad(d.getSeconds()); // Extract and pad seconds

  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`; // Combine components into final date-time string
};

/**
 * Formats a Date object or string into yyyy-MM-ddTHH:mm:ss for <input type="datetime-local">
 */
export const formatForDateTimeLocal = (dateInput: Date | string | null | undefined): string => { // Function to format date for datetime-local input fields
  if (!dateInput) return ""; // Return empty string if input is not provided
  const d = typeof dateInput === "string" ? parseSafeDate(dateInput) : dateInput; // Convert string input to Date object
  if (!d || isNaN(d.getTime())) return ""; // Return empty string if the date object is invalid

  const pad = (n: number) => String(n).padStart(2, '0'); // Pad helper function
  const day = pad(d.getDate()); // Get padded day
  const month = pad(d.getMonth() + 1); // Get padded month
  const year = d.getFullYear(); // Get full year
  const hours = pad(d.getHours()); // Get padded hours
  const minutes = pad(d.getMinutes()); // Get padded minutes
  const seconds = pad(d.getSeconds()); // Get padded seconds

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`; // Return ISO-like format required by datetime-local
};

/**
 * Formats a Date object or string to dd-MM-yyyy HH:mm:ss for API payload submission
 */
export const formatForApi = (htmlInputStr: string): string => { // Function to format HTML input string for API submission
  if (!htmlInputStr) return ""; // Return empty string if input is missing
  const d = new Date(htmlInputStr.replace(" ", "T")); // Create Date object, replacing space with T for compatibility
  if (isNaN(d.getTime())) return htmlInputStr; // If invalid date, return original string unformatted
  return formatDateTime(d); // Return formatted date-time string
};

/**
 * Formats class level string to "Class X" if it is a number
 */
export const formatClassLevel = (level: string | null | undefined): string => { // Function to format the class level string
  if (!level) return "—"; // If no level is provided, return a dash character
  const trimmed = level.trim(); // Remove whitespace from the level string
  return /^\d+$/.test(trimmed) ? `Class ${trimmed}` : trimmed; // If the level is purely digits, prepend "Class ", otherwise return it as is
};


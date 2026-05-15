/**
 * Flexible Date Utilities
 * Supports: full_date (DD/MM/YYYY), month_year (MM/YYYY), year_only (YYYY)
 * Backward compatible with old ISO date strings (YYYY-MM-DD)
 */

const DATE_TYPES = {
  FULL_DATE: 'full_date',
  MONTH_YEAR: 'month_year',
  YEAR_ONLY: 'year_only',
};

const DATE_TYPE_OPTIONS = [
  { label: 'full_date_label', value: DATE_TYPES.FULL_DATE },
  { label: 'month_and_year', value: DATE_TYPES.MONTH_YEAR },
  { label: 'year_only_label', value: DATE_TYPES.YEAR_ONLY },
];

/**
 * Generate year range for dropdowns
 * Current year - 20 to current year + 50
 */
const generateYearRange = () => {
  const currentYear = new Date().getFullYear();
  const startYear = 2020; // Start from 2020 as requested/more relevant
  const endYear = currentYear + 50;
  const years = [];
  for (let y = startYear; y <= endYear; y++) {
    years.push(y.toString());
  }
  return years;
};

/**
 * Generate month options 01–12
 */
const MONTH_OPTIONS = [
  { label: '01 - Jan', value: '01' },
  { label: '02 - Feb', value: '02' },
  { label: '03 - Mar', value: '03' },
  { label: '04 - Apr', value: '04' },
  { label: '05 - May', value: '05' },
  { label: '06 - Jun', value: '06' },
  { label: '07 - Jul', value: '07' },
  { label: '08 - Aug', value: '08' },
  { label: '09 - Sep', value: '09' },
  { label: '10 - Oct', value: '10' },
  { label: '11 - Nov', value: '11' },
  { label: '12 - Dec', value: '12' },
];

/**
 * Check if a given day/month/year constitutes a real calendar date
 */
const isRealCalendarDate = (day, month, year) => {
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return false;
  // Month is 0-indexed in JS Date
  const dateObj = new Date(y, m - 1, d);
  return (
    dateObj.getFullYear() === y &&
    dateObj.getMonth() === m - 1 &&
    dateObj.getDate() === d
  );
};

/**
 * Validate a date value against its type
 * @param {string} dateValue - The date string
 * @param {string} dateType - 'full_date' | 'month_year' | 'year_only'
 * @returns {{ valid: boolean, error: string|null }}
 */
const validateDateByType = (dateValue, dateType) => {
  if (!dateValue || (typeof dateValue === 'string' && dateValue.trim() === '')) {
    return { valid: false, error: 'date_required' };
  }

  const value = typeof dateValue === 'string' ? dateValue.trim() : String(dateValue);

  switch (dateType) {
    case DATE_TYPES.FULL_DATE: {
      // Accept DD/MM/YYYY
      const fullDateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!fullDateRegex.test(value)) {
        return { valid: false, error: 'invalid_date' };
      }
      const parts = value.split('/');
      const day = parts[0];
      const month = parts[1];
      const year = parts[2];
      if (parseInt(month, 10) < 1 || parseInt(month, 10) > 12) {
        return { valid: false, error: 'invalid_month' };
      }
      if (!isRealCalendarDate(day, month, year)) {
        return { valid: false, error: 'invalid_date' };
      }
      return { valid: true, error: null };
    }

    case DATE_TYPES.MONTH_YEAR: {
      // Accept MM/YYYY
      const monthYearRegex = /^\d{2}\/\d{4}$/;
      if (!monthYearRegex.test(value)) {
        return { valid: false, error: 'invalid_date' };
      }
      const parts = value.split('/');
      const month = parseInt(parts[0], 10);
      if (month < 1 || month > 12) {
        return { valid: false, error: 'invalid_month' };
      }
      const year = parseInt(parts[1], 10);
      if (year < 1900 || year > 2200) {
        return { valid: false, error: 'invalid_year' };
      }
      return { valid: true, error: null };
    }

    case DATE_TYPES.YEAR_ONLY: {
      // Accept YYYY
      const yearRegex = /^\d{4}$/;
      if (!yearRegex.test(value)) {
        return { valid: false, error: 'invalid_year' };
      }
      const year = parseInt(value, 10);
      if (year < 1900 || year > 2200) {
        return { valid: false, error: 'invalid_year' };
      }
      return { valid: true, error: null };
    }

    default:
      return { valid: false, error: 'invalid_date' };
  }
};

/**
 * Normalize a date to a comparable numeric value for cross-type comparison
 * Higher granularity types get more specific numbers
 * @returns {number} comparable value, or NaN on failure
 */
const dateToComparableValue = (dateValue, dateType) => {
  if (!dateValue) return NaN;
  const value = typeof dateValue === 'string' ? dateValue.trim() : String(dateValue);

  switch (dateType) {
    case DATE_TYPES.FULL_DATE: {
      const parts = value.split('/');
      if (parts.length !== 3) return NaN;
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      return year * 10000 + month * 100 + day;
    }
    case DATE_TYPES.MONTH_YEAR: {
      const parts = value.split('/');
      if (parts.length !== 2) return NaN;
      const month = parseInt(parts[0], 10);
      const year = parseInt(parts[1], 10);
      // Use month * 100 to place in the right range, day=0 for comparison
      return year * 10000 + month * 100;
    }
    case DATE_TYPES.YEAR_ONLY: {
      const year = parseInt(value, 10);
      // Use just the year * 10000, month=0, day=0
      return year * 10000;
    }
    default:
      return NaN;
  }
};

/**
 * Compare manufacturing and expiry dates with mixed type support
 * @returns {{ valid: boolean, error: string|null }}
 */
const compareFlexibleDates = (mfgValue, mfgType, expValue, expType) => {
  // Validate both dates individually first
  const mfgValidation = validateDateByType(mfgValue, mfgType);
  if (!mfgValidation.valid) {
    return { valid: false, error: 'mfg_date_required' };
  }

  const expValidation = validateDateByType(expValue, expType);
  if (!expValidation.valid) {
    return { valid: false, error: 'exp_date_required' };
  }

  const mfgNumeric = dateToComparableValue(mfgValue, mfgType);
  const expNumeric = dateToComparableValue(expValue, expType);

  if (isNaN(mfgNumeric) || isNaN(expNumeric)) {
    return { valid: false, error: 'invalid_date' };
  }

  // For mixed types, we compare at the granularity of the coarser type
  // e.g. mfg=05/2026 (month_year) vs exp=2026 (year_only)
  // Normalize both to the coarser granularity for fair comparison
  const granularityOrder = {
    [DATE_TYPES.YEAR_ONLY]: 1,
    [DATE_TYPES.MONTH_YEAR]: 2,
    [DATE_TYPES.FULL_DATE]: 3,
  };

  const mfgGranularity = granularityOrder[mfgType] || 3;
  const expGranularity = granularityOrder[expType] || 3;
  const coarserGranularity = Math.min(mfgGranularity, expGranularity);

  let mfgCompare = mfgNumeric;
  let expCompare = expNumeric;

  if (coarserGranularity === 1) {
    // Compare at year level only
    mfgCompare = Math.floor(mfgNumeric / 10000);
    expCompare = Math.floor(expNumeric / 10000);
  } else if (coarserGranularity === 2) {
    // Compare at month level
    mfgCompare = Math.floor(mfgNumeric / 100);
    expCompare = Math.floor(expNumeric / 100);
  }
  // else granularity 3 = full date, use raw values

  if (expCompare < mfgCompare) {
    return { valid: false, error: 'expiry_before_mfg' };
  }

  return { valid: true, error: null };
};

/**
 * Format a date value for display — pass through as stored.
 * Handles old Date objects and ISO strings for backward compatibility.
 * @param {string|Date} dateValue
 * @param {string} dateType - defaults to 'full_date'
 * @returns {string}
 */
const formatDateByType = (dateValue, dateType) => {
  if (!dateValue) return '';

  // If it's a JS Date object (old flow), format as DD/MM/YYYY
  if (dateValue instanceof Date) {
    const dd = String(dateValue.getDate()).padStart(2, '0');
    const mm = String(dateValue.getMonth() + 1).padStart(2, '0');
    const yyyy = dateValue.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  const value = String(dateValue).trim();

  // Detect old ISO format YYYY-MM-DD and convert to DD/MM/YYYY
  const isoRegex = /^\d{4}-\d{2}-\d{2}/;
  if (isoRegex.test(value)) {
    const parts = value.substring(0, 10).split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  // Already in correct format, return as-is
  return value;
};

/**
 * Detect the date type from an existing date string value
 * Used for backward compatibility with old records
 * @param {string} dateValue
 * @returns {string} detected type
 */
const detectDateType = (dateValue) => {
  if (!dateValue) return DATE_TYPES.FULL_DATE;
  const value = String(dateValue).trim();

  // ISO format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return DATE_TYPES.FULL_DATE;

  // DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return DATE_TYPES.FULL_DATE;

  // MM/YYYY
  if (/^\d{2}\/\d{4}$/.test(value)) return DATE_TYPES.MONTH_YEAR;

  // YYYY
  if (/^\d{4}$/.test(value)) return DATE_TYPES.YEAR_ONLY;

  // Default fallback
  return DATE_TYPES.FULL_DATE;
};

export {
  DATE_TYPES,
  DATE_TYPE_OPTIONS,
  MONTH_OPTIONS,
  generateYearRange,
  validateDateByType,
  compareFlexibleDates,
  formatDateByType,
  detectDateType,
  isRealCalendarDate,
};

/**
 * Shared utility functions for consistent report calculations
 * This module ensures all reports use the same calculations and formatting
 */

// Mode number constants
export const MODES = {
  SEWING: 1,
  IDLE: 2,
  NO_FEEDING: 3,  // Mode 3 is No Feeding
  MEETING: 4,     // Mode 4 is Meeting
  MAINTENANCE: 5,
  REWORK: 6,
  NEEDLE_BREAK: 7
};

/**
 * Calculate hours by mode from data array
 * @param {Array} data - Array of data records
 * @param {Number} mode - Mode number to filter by
 * @returns {Number} - Total hours for the specified mode
 */
export const calculateHoursByMode = (data, mode) => {
  return data
    .filter(d => d.MODE === mode)
    .reduce((sum, d) => sum + (d.duration_hours || 0), 0);
};

/**
 * Calculate productive time percentage
 * @param {Number} sewingHours - Total sewing hours (productive time)
 * @param {Number} totalHours - Total hours
 * @returns {Number} - Productive time percentage
 */
export const calculateProductiveTimePercentage = (sewingHours, totalHours) => {
  if (!totalHours) return 0;
  return (sewingHours / totalHours) * 100;
};

/**
 * Calculate needle runtime percentage
 * @param {Number} needleRuntime - Total needle runtime in seconds
 * @param {Number} sewingSeconds - Total sewing time in seconds
 * @returns {Number} - Needle runtime percentage
 */
export const calculateNeedleRuntimePercentage = (needleRuntime, sewingSeconds) => {
  if (!sewingSeconds) return 0;
  return (needleRuntime / sewingSeconds) * 100;
};

/**
 * Calculate sewing speed from data
 * @param {Array} data - Array of data records
 * @returns {Number} - Average sewing speed
 */
export const calculateSewingSpeed = (data) => {
  const sewingModeRecords = data.filter(d => 
    d.MODE === MODES.SEWING && 
    d.RESERVE !== undefined && 
    d.RESERVE !== null && 
    Number(d.RESERVE) > 0
  );
  
  const totalSPM = sewingModeRecords.reduce((sum, d) => {
    const reserve = Number(d.RESERVE) || 0;
    return sum + reserve;
  }, 0);
  
  const count = sewingModeRecords.length;
  return count > 0 ? totalSPM / count : 0;
};

/**
 * Format decimal hours to hours and minutes string
 * @param {Number} decimalHours - Hours in decimal format
 * @returns {String} - Formatted string "Xh Ym"
 */
export const formatHoursMinutes = (decimalHours) => {
  if (decimalHours === null || decimalHours === undefined || isNaN(decimalHours))
    return "0h 0m";
    
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  
  return `${hours}h ${minutes}m`;
};

/**
 * Format decimal hours to "X hours Y minutes" format for display
 * @param {Number} decimalHours - Hours in decimal format
 * @returns {String} - Formatted string "X hours Y minutes"
 */
export const formatHoursMinutesLong = (decimalHours) => {
  if (decimalHours === null || decimalHours === undefined || isNaN(decimalHours))
    return "0 hours";
    
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  
  return `${hours} hours${minutes > 0 ? ` ${minutes} minutes` : ""}`;
};

/**
 * Convert any hour input (decimal or "HH:MM") to total minutes
 * @param {Number|String} input - Hours in decimal or "HH:MM" format
 * @returns {Number} - Total minutes
 */
export const toTotalMinutes = (input) => {
  if (input === null || input === undefined) return 0;
  
  if (typeof input === 'number') {
    return Math.round(input * 60);
  }
  
  if (typeof input === 'string' && input.includes(':')) {
    const [hours, minutes] = input.split(':').map(Number);
    return (hours * 60) + minutes;
  }
  
  return 0;
};

/**
 * Convert seconds to "X hours Y minutes" format
 * @param {Number} seconds - Time in seconds
 * @returns {String} - Formatted string "X hours Y minutes"
 */
export const formatSecondsToHoursMinutes = (seconds) => {
  if (isNaN(seconds) || seconds === null || seconds === undefined) return "-";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return `${hours} hours${minutes > 0 ? ` ${minutes} minutes` : ""}`;
};

/**
 * Create a summary row with consistent calculations
 * @param {Array} data - Array of data records for this summary
 * @param {String} title - Summary title
 * @param {Number|String} machineId - Machine ID (optional)
 * @returns {Object} - Summary row object
 */
export const createSummaryRow = (data, title, machineId = null) => {
  // Calculate hours for each mode
  const sewing = calculateHoursByMode(data, MODES.SEWING);
  const idle = calculateHoursByMode(data, MODES.IDLE);
  const meeting = calculateHoursByMode(data, MODES.MEETING);
  const noFeeding = calculateHoursByMode(data, MODES.NO_FEEDING);
  const maintenance = calculateHoursByMode(data, MODES.MAINTENANCE);
  const rework = calculateHoursByMode(data, MODES.REWORK);
  const needleBreak = calculateHoursByMode(data, MODES.NEEDLE_BREAK);
  
  // Calculate actual total hours
  const totalHours = sewing + idle + meeting + noFeeding + maintenance + rework + needleBreak;
  
  // Calculate productive and non-productive percentages
  const productiveTimePercent = calculateProductiveTimePercentage(sewing, totalHours);
  const nonProductivePercent = calculateProductiveTimePercentage(
    idle + meeting + noFeeding + maintenance + rework + needleBreak, 
    totalHours
  );
  
  // Calculate needle runtime percentage
  const sewingSeconds = sewing * 3600;
  const totalNeedleRuntime = data
    .filter(d => d.MODE === MODES.SEWING)
    .reduce((sum, d) => sum + (d.NEEDLE_RUNTIME || 0), 0);
  const needleRuntimePercent = calculateNeedleRuntimePercentage(totalNeedleRuntime, sewingSeconds);
  
  // Calculate sewing speed
  const sewingSpeed = calculateSewingSpeed(data);
  
  return {
    isSummary: true,
    summaryTitle: title,
    MACHINE_ID: machineId || "SUMMARY",
    LINE_NUMB: data[0]?.LINE_NUMB || "",
    operator_name: title,
    STITCH_COUNT: data.reduce((sum, d) => sum + (d.STITCH_COUNT || 0), 0),
    NEEDLE_RUNTIME: totalNeedleRuntime,
    sewingHours: sewing,
    idleHours: idle,
    meetingHours: meeting,
    noFeedingHours: noFeeding,
    maintenanceHours: maintenance,
    reworkHours: rework,
    needleBreakHours: needleBreak,
    totalHours: totalHours,
    productiveTimePercent: productiveTimePercent.toFixed(2),
    nptPercent: nonProductivePercent.toFixed(2),
    needleRuntimePercent: needleRuntimePercent.toFixed(2),
    sewingSpeed: sewingSpeed.toFixed(2)
  };
};

/**
 * Safe number formatting with fixed decimal places
 * @param {Number} value - Number to format
 * @param {Number} digits - Decimal places (default: 2)
 * @returns {String} - Formatted number
 */
export const safeToFixed = (value, digits = 2) => {
  if (value === null || value === undefined || isNaN(value)) return "0.00";
  return Number(value).toFixed(digits);
};

/**
 * Get consistent column headers for reports
 * @returns {Array} - Array of column header objects
 */
export const getStandardReportColumns = () => {
  return [
    { label: "Date", key: "Date" },
    { label: "Line Number", key: "Line Number" },
    { label: "Total Hours", key: "Total Hours" },
    { label: "Sewing", key: "Sewing Hours" },
    { label: "Idle Hours", key: "Idle Hours" },
    { label: "Rework", key: "Rework Hours" },
    { label: "No Feeding", key: "No Feeding Hours" },
    { label: "Meeting", key: "Meeting Hours" },
    { label: "Maintenance", key: "Maintenance Hours" },
    { label: "Needle Break", key: "Needle Break Hours" },
    { label: "PT %", key: "Productive Time %" },
    { label: "NPT %", key: "Non-Productive Time %" },
    { label: "Needle Runtime %", key: "Needle Runtime %" },
    { label: "Sewing Speed", key: "Sewing Speed" },
    { label: "Stitch Count", key: "Stitch Count" },
    { label: "Machine Count", key: "Machine Count" }
  ];
};
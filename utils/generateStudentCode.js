// utils/codeGenerator.js
/**
 * Generates a student code in the format: STATEYYLLSSSS
 * Example: ABI24110216
 *
 * @param {string} stateCode - 3-letter state abbreviation (e.g., 'ABI')
 * @param {number} year - Full year (e.g., 2024)
 * @param {number} lgaSerial - LGA serial number (e.g., 11)
 * @param {number} schoolSerial - School serial number (e.g., 2)
 * @param {number} studentSerial - Student serial number (e.g., 16)
 * @returns {string} - Formatted student code
 */
export function generateStudentCode(stateCode, year, lgaSerial, schoolSerial, studentSerial) {
  const yy = year.toString().slice(-2);
  const lga = lgaSerial.toString().padStart(2, '0');
  const school = schoolSerial.toString().padStart(2, '0');
  const student = studentSerial.toString().padStart(2, '0');

  return `${stateCode.toUpperCase()}${yy}${lga}${school}${student}`;
}

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats numbers using Indian numbering system (lakhs and crores)
 * Example: 67834416 -> "6,78,34,416"
 */
export function formatIndianNumber(num: number): string {
  if (isNaN(num)) return "0";
  
  // Convert to integer for whole number formatting
  const integerNum = Math.round(num);
  
  // Convert to string and reverse for easier processing
  const numStr = integerNum.toString();
  const reversed = numStr.split('').reverse();
  
  // Group digits in Indian style (first group of 3, then groups of 2)
  const groups = [];
  let i = 0;
  
  while (i < reversed.length) {
    if (i === 0) {
      // First group: 3 digits
      groups.push(reversed.slice(i, i + 3).join(''));
      i += 3;
    } else {
      // Subsequent groups: 2 digits each
      groups.push(reversed.slice(i, i + 2).join(''));
      i += 2;
    }
  }
  
  // Join groups with commas and reverse back
  return groups.join(',').split('').reverse().join('');
}

/**
 * Formats currency amounts with Indian rupee symbol and Indian numbering
 * Example: 67834416 -> "₹6,78,34,416"
 */
export function formatIndianCurrency(amount: number): string {
  return `₹${formatIndianNumber(amount)}`;
}

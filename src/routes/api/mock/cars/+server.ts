// src/routes/api/cars/+server.ts

import { json, type RequestHandler } from '@sveltejs/kit';
import carsData from '$lib/generated/cars.json'; // Adjust path if your JSON is elsewhere

// Define a type for your car data to ensure type safety
interface Car {
  make: string;
  model: string;
  year: number; // Ensure this is number
  cc: string;
  drive: string;
  transmission: string;
  width: number;
  height: number;
  length: number;
  door: number;
  trim: string;
  hp: number;
  torque: number;
  tire: number;
  mileage: number;
  price: number;
  isElectric: boolean;
  engineType: string;
  maxspeed: number;
}

// Define the expected structure of the POST request body
interface ApiRequestBody {
  filters?: Array<{ field: keyof Car; operator: string; value: any }>;
  sorts?: Array<{ field: keyof Car; direction: 'asc' | 'desc' }>;
  rows_to_get?: number;
  page?: number;
}

// Function to safely parse a value to a number
// This function needs to be robust for various input types coming from JSON (string, number, etc.)
function parseNumber(value: any): number | null {
  if (value === null || value === undefined) return null;
  // If it's already a number, return it directly
  if (typeof value === 'number') return value;
  // If it's a string, try to parse it
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }
  return null; // For other unexpected types
}

// Function to handle POST requests
export const POST: RequestHandler = async ({ request }) => {
  let data: Car[] = carsData as Car[]; // Cast to your Car interface
  let requestBody: ApiRequestBody;

  try {
    requestBody = await request.json();
  } catch (e) {
    console.error('Error parsing request body:', e);
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { filters, sorts, rows_to_get, page } = requestBody;

  // --- 1. Filtering ---
  if (filters && Array.isArray(filters) && filters.length > 0) { // Add check for filters.length
    try {
      data = data.filter(row => {
        return filters.every(f => {
          if (!f.field || !f.operator) { // Ensure basic filter structure is valid
            console.warn('Skipping malformed filter:', f);
            return true; // Treat as valid so it doesn't break the whole filter chain
          }
          const fieldValue = row[f.field];
          let filterValue = f.value;
          
          if (typeof fieldValue === 'number') {
            const parsedFilterValue = parseNumber(filterValue);
            if (parsedFilterValue === null) {
              // If the filter value cannot be parsed to a number for a numeric field,
              // then this filter condition cannot be met.
              return false;
            }
            filterValue = parsedFilterValue;
          } else if (typeof fieldValue === 'boolean' && typeof filterValue === 'string') {
            filterValue = filterValue.toLowerCase() === 'true';
          }
        let conditionResult; // Store the result of the switch case
        switch (f.operator) {
        case '==': conditionResult = fieldValue == filterValue; break;
        case '!=': conditionResult = fieldValue != filterValue; break;
        case '>': conditionResult = fieldValue > filterValue; break; // This is the one
        case '<': conditionResult = fieldValue < filterValue; break;
        case '>=': conditionResult = fieldValue >= filterValue; break;
        case '<=': conditionResult = fieldValue <= filterValue; break;
        case '*': conditionResult = String(fieldValue).toLowerCase().includes(String(filterValue).toLowerCase()); break;
        default: conditionResult = true; // IMPORTANT: If default is true, unknown operators pass all rows!
        }
        // console.log(`Filter [${f.field} ${f.operator} ${f.value}] on row[${f.field}]=${fieldValue} -> Result: ${conditionResult}`);
        return conditionResult; 
        });
      });
    } catch (e) {
      console.error('Error processing filters:', e);
      return json({ error: 'Invalid filter structure or processing error' }, { status: 400 });
    }
  }

  // --- 2. Sorting ---
  if (sorts && Array.isArray(sorts) && sorts.length > 0) { // Add check for sorts.length
    try {
      data.sort((a, b) => {
        for (const s of sorts) {
          if (!s.field || !s.direction) { // Ensure basic sort structure is valid
            console.warn('Skipping malformed sort criterion:', s);
            continue; // Skip this malformed sort but continue with others
          }
          const valA = a[s.field];
          const valB = b[s.field];

          // Handle null/undefined values gracefully for sorting if your data might have them
          // For numbers, ensure numerical comparison
          // For strings, ensure locale-aware comparison (optional but good)
          if (typeof valA === 'string' && typeof valB === 'string') {
              const comparison = valA.localeCompare(valB);
              if (comparison !== 0) return s.direction === 'asc' ? comparison : -comparison;
          } else if (valA !== valB) { // General comparison for numbers, booleans, etc.
              if (valA < valB) return s.direction === 'asc' ? -1 : 1;
              if (valA > valB) return s.direction === 'asc' ? 1 : -1;
          }
        }
        return 0; // If all sort criteria are equal
      });
    } catch (e) {
      console.error('Error processing sorts:', e);
      return json({ error: 'Invalid sort structure or processing error' }, { status: 400 });
    }
  }

  const totalRows = data.length; // Total rows after filtering

  // --- 3. Pagination ---
  const rowsToGetParsed = parseNumber(rows_to_get);
  const pageParsed = parseNumber(page);

  const finalRowsToGet = rowsToGetParsed ?? 20; // Default limit to 20
  let finalPage = pageParsed ?? 1; // Default page to 1

  if (finalPage < 1) finalPage = 1;
  // Ensure page doesn't go beyond total available pages
  const maxPage = Math.max(1, Math.ceil(totalRows / finalRowsToGet));
  if (finalPage > maxPage) finalPage = maxPage;


  const offset = (finalPage - 1) * finalRowsToGet;

  const pagedData = data.slice(offset, offset + finalRowsToGet);

  return json({
    page: finalPage,
    rows: pagedData,
    totalrows: totalRows
  });
};
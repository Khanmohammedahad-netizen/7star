/**
 * Database column mapping utilities
 * 
 * This file helps map between database column names (snake_case)
 * and application property names (camelCase or other conventions)
 * 
 * If your database uses a different column name, update the constants below
 */

// Database column names (as they appear in Supabase/PostgreSQL)
export const DB_COLUMNS = {
  EVENT_DATE: 'event_date', // Change this if your column is named differently (e.g., 'start_date', 'scheduled_date', 'date')
} as const;

/**
 * Maps database event object to application event object
 * Converts snake_case DB columns to application property names
 */
export function mapEventFromDB(dbEvent: any): {
  id: string;
  name: string;
  client: string;
  date: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  region: 'UAE' | 'SAUDI';
} {
  return {
    id: dbEvent.id,
    name: dbEvent.name,
    client: dbEvent.client,
    date: dbEvent[DB_COLUMNS.EVENT_DATE] || dbEvent.date, // Fallback to 'date' if exists
    status: dbEvent.status,
    region: dbEvent.region,
  };
}

/**
 * Maps application event object to database insert/update format
 * Converts application property names to snake_case DB columns
 */
export function mapEventToDB(event: {
  name: string;
  client: string;
  date: string;
  status?: 'Approved' | 'Pending' | 'Rejected';
  region?: 'UAE' | 'SAUDI';
}): Record<string, any> {
  return {
    name: event.name,
    client: event.client,
    [DB_COLUMNS.EVENT_DATE]: event.date,
    ...(event.status && { status: event.status }),
    ...(event.region && { region: event.region }),
  };
}


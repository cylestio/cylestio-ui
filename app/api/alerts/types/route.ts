import { NextResponse } from 'next/server';
import { DbConnection } from '../../../../src/lib/db/connection';
import { DbUtils } from '../../../../src/lib/db/utils';
import { config } from '../../../lib/config';

export async function GET() {
  try {
    const dbConnection = DbConnection.getInstance();
    const dbUtils = new DbUtils(dbConnection);
    
    let typeData = [];
    let error = null;
    
    try {
      // Check if the security_alerts table exists first
      const tableCheck = dbUtils.queryOne(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='security_alerts'
      `);
      
      if (!tableCheck) {
        throw new Error('Security alerts table does not exist in the database');
      }
      
      // Check if alert_type column exists
      const columnsCheck = dbUtils.queryMany(`
        PRAGMA table_info(security_alerts)
      `);
      
      const hasAlertTypeColumn = columnsCheck.some((col: any) => col.name === 'alert_type');
      
      if (!hasAlertTypeColumn) {
        throw new Error('Security alerts table is missing required alert_type column');
      }
      
      // Try to query the database
      typeData = dbUtils.queryMany(`
        SELECT 
          alert_type as type,
          COUNT(*) as count
        FROM security_alerts
        GROUP BY alert_type
        ORDER BY count DESC
      `);
      
      // If we got no data
      if (typeData.length === 0) {
        error = 'No security alerts found in the database';
      }
      
    } catch (dbError) {
      console.error('Database error while fetching alert types:', dbError);
      
      // Only use mock data if explicitly configured to do so
      if (config.useMockData) {
        console.log('Using mock data as fallback due to configuration setting');
        // Use alert types matching the database schema enum values
        const alertTypes = [
          'PROMPT_INJECTION',
          'SENSITIVE_DATA_LEAK',
          'UNUSUAL_BEHAVIOR',
          'RATE_LIMIT_EXCEEDED',
          'AUTHORIZATION_BYPASS',
          'JAILBREAK_ATTEMPT',
          'PII_EXPOSURE',
          'SECURITY_ALERT'
        ];
        
        typeData = alertTypes.map(type => ({
          type,
          count: Math.floor(Math.random() * 20) + 1
        }));
      } else {
        // Otherwise, return an error
        return NextResponse.json({ 
          error: `Database error: ${dbError.message}`,
          types: [] 
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({
      types: typeData,
      error
    });
  } catch (error) {
    console.error('Error fetching alert types:', error);
    
    // Return error instead of fallback data
    return NextResponse.json({ 
      error: `Failed to fetch alert types: ${error.message}`,
      types: [] 
    }, { status: 500 });
  }
} 
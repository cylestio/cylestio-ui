import { NextResponse } from 'next/server';
import { DbConnection } from '../../../../src/lib/db/connection';
import { DbUtils } from '../../../../src/lib/db/utils';
import { config } from '../../../lib/config';
import { getMockMetrics } from '../../../lib/mockData';

export async function GET() {
  try {
    const dbConnection = DbConnection.getInstance();
    const dbUtils = new DbUtils(dbConnection);
    
    let metrics: {
      total: number;
      critical: number;
      bySeverity: any[];
      trend: any[];
      byAlertLevel?: any[];
      error?: string;
    } = {
      total: 0,
      critical: 0,
      bySeverity: [],
      trend: []
    };
    
    try {
      // Check if the security_alerts table exists first
      const tableCheck = dbUtils.queryOne(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='security_alerts'
      `);
      
      if (!tableCheck) {
        throw new Error('Security alerts table does not exist in the database');
      }
      
      // Check what columns are available in the security_alerts table
      const columnsCheck = dbUtils.queryMany(`
        PRAGMA table_info(security_alerts)
      `);
      
      // Get column names
      const columns = columnsCheck.map((col: any) => col.name);
      
      // Check if severity column exists
      const hasSeverity = columns.includes('severity');
      const hasTimestamp = columns.includes('timestamp');
      
      if (!hasSeverity) {
        throw new Error('Security alerts table does not have required severity column');
      }
      
      // Get total count and critical count
      const countQuery = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN UPPER(severity) = 'CRITICAL' THEN 1 ELSE 0 END) as critical
        FROM security_alerts
      `;
      
      const countResult = dbUtils.queryOne(countQuery);
      metrics.total = countResult?.total || 0;
      metrics.critical = countResult?.critical || 0;
      
      // If no data at all, return early with a message
      if (metrics.total === 0) {
        metrics.error = 'No security alerts found in the database';
        return NextResponse.json(metrics);
      }
      
      // Get counts by severity
      const severityQuery = `
        SELECT 
          UPPER(severity) as name,
          COUNT(*) as count
        FROM security_alerts
        GROUP BY UPPER(severity)
        ORDER BY 
          CASE 
            WHEN UPPER(severity) = 'CRITICAL' THEN 1
            WHEN UPPER(severity) = 'HIGH' THEN 2
            WHEN UPPER(severity) = 'MEDIUM' THEN 3
            WHEN UPPER(severity) = 'LOW' THEN 4
            ELSE 5
          END
      `;
      
      const severityResult = dbUtils.queryMany(severityQuery);
      metrics.bySeverity = severityResult;
      
      // Get trend data for the last 7 days if timestamp column exists
      if (hasTimestamp) {
        const trendQuery = `
          SELECT 
            DATE(timestamp) as date,
            COUNT(*) as count
          FROM security_alerts
          WHERE timestamp >= DATE('now', '-7 days')
          GROUP BY DATE(timestamp)
          ORDER BY date ASC
        `;
        
        const trendResult = dbUtils.queryMany(trendQuery);
        metrics.trend = trendResult;
        
        // Fill in missing dates in the last 7 days
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        
        // Create a map of existing dates
        const existingDates = new Map();
        metrics.trend.forEach((item: any) => {
          existingDates.set(item.date, item.count);
        });
        
        // Create complete array with all dates
        const completeTrend = [];
        for (let d = new Date(sevenDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          completeTrend.push({
            date: dateStr,
            count: existingDates.get(dateStr) || 0
          });
        }
        
        metrics.trend = completeTrend;
      }
      
      // Get event_security data if that table exists
      try {
        const eventSecurityCheck = dbUtils.queryOne(`
          SELECT name FROM sqlite_master 
          WHERE type='table' AND name='event_security'
        `);
        
        if (eventSecurityCheck) {
          // Get alert level distribution from event_security table
          const alertLevelQuery = `
            SELECT 
              UPPER(alert_level) as name,
              COUNT(*) as count
            FROM event_security
            GROUP BY UPPER(alert_level)
            ORDER BY 
              CASE 
                WHEN UPPER(alert_level) = 'DANGEROUS' THEN 1
                WHEN UPPER(alert_level) = 'SUSPICIOUS' THEN 2
                WHEN UPPER(alert_level) = 'NONE' THEN 3
                ELSE 4
              END
          `;
          
          const alertLevelResult = dbUtils.queryMany(alertLevelQuery);
          if (alertLevelResult && alertLevelResult.length > 0) {
            metrics.byAlertLevel = alertLevelResult;
          }
        }
      } catch (eventSecurityError) {
        console.warn('Could not access event_security table:', eventSecurityError);
      }
      
    } catch (dbError) {
      console.error('Database error fetching security metrics:', dbError);
      
      // Only use mock data if explicitly configured to do so
      if (config.useMockData) {
        console.log('Using mock security metrics data as fallback due to configuration setting');
        
        const mockMetrics = getMockMetrics();
        const securityData = mockMetrics.securityMetrics;
        
        // Generate severity and alert level data
        const severityData = [
          { name: 'LOW', count: Math.floor(Math.random() * 30) + 5 },
          { name: 'MEDIUM', count: Math.floor(Math.random() * 25) + 5 },
          { name: 'HIGH', count: Math.floor(Math.random() * 15) + 1 },
          { name: 'CRITICAL', count: Math.floor(Math.random() * 5) + 1 },
        ];
        
        const alertLevelData = [
          { name: 'NONE', count: Math.floor(Math.random() * 40) + 10 },
          { name: 'SUSPICIOUS', count: securityData.suspicious },
          { name: 'DANGEROUS', count: securityData.blocked },
        ];
        
        const total = severityData.reduce((sum, item) => sum + item.count, 0);
        const critical = severityData.find(item => item.name === 'CRITICAL')?.count || 0;
        
        metrics = {
          total,
          critical,
          bySeverity: severityData,
          byAlertLevel: alertLevelData,
          trend: securityData.events
        };
      } else {
        // Otherwise, return an error
        return NextResponse.json({ 
          error: `Database error: ${dbError.message}`,
          total: 0,
          critical: 0,
          bySeverity: [],
          trend: []
        }, { status: 500 });
      }
    }
    
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching security metrics:', error);
    
    // Return error instead of fallback data
    return NextResponse.json({ 
      error: `Failed to fetch security metrics: ${error.message}`,
      total: 0,
      critical: 0,
      bySeverity: [],
      trend: []
    }, { status: 500 });
  }
} 
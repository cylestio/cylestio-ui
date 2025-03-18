import { EventEmitter } from 'events';
import { DbConnection } from './connection';
import { DbUtils } from './utils';

/**
 * Supported types of data updates
 */
export enum DataUpdateType {
  AGENTS = 'agents',
  SESSIONS = 'sessions',
  CONVERSATIONS = 'conversations',
  EVENTS = 'events',
  LLM_CALLS = 'llm_calls',
  TOOL_CALLS = 'tool_calls',
  SECURITY_ALERTS = 'security_alerts',
  EVENT_SECURITY = 'event_security',
  PERFORMANCE_METRICS = 'performance_metrics',
  ALL = 'all'
}

/**
 * Data update payload containing the update type and data
 */
export interface DataUpdate<T = any> {
  type: DataUpdateType;
  data: T;
  timestamp: Date;
}

/**
 * Options for the data update service
 */
export interface DataUpdateServiceOptions {
  /**
   * Polling interval in milliseconds
   * @default 5000 (5 seconds)
   */
  pollingInterval?: number;
  
  /**
   * Whether to start polling automatically
   * @default true
   */
  autoStart?: boolean;
  
  /**
   * Database connection instance
   */
  dbConnection?: DbConnection;
}

/**
 * Service for real-time data updates
 * Uses polling to check for new data and emits events for UI components
 */
export class DataUpdateService extends EventEmitter {
  private static instance: DataUpdateService;
  private dbUtils: DbUtils;
  private tables: Record<DataUpdateType, string> = {
    [DataUpdateType.AGENTS]: 'agents',
    [DataUpdateType.SESSIONS]: 'sessions',
    [DataUpdateType.CONVERSATIONS]: 'conversations',
    [DataUpdateType.EVENTS]: 'events',
    [DataUpdateType.LLM_CALLS]: 'llm_calls',
    [DataUpdateType.TOOL_CALLS]: 'tool_calls',
    [DataUpdateType.SECURITY_ALERTS]: 'security_alerts',
    [DataUpdateType.EVENT_SECURITY]: 'event_security',
    [DataUpdateType.PERFORMANCE_METRICS]: 'performance_metrics',
    [DataUpdateType.ALL]: ''
  };
  
  private pollingInterval: number;
  private pollingTimer: NodeJS.Timeout | null = null;
  private isPolling: boolean = false;
  private lastUpdates: Record<DataUpdateType, { timestamp: Date, lastId?: number }> = {
    [DataUpdateType.AGENTS]: { timestamp: new Date() },
    [DataUpdateType.SESSIONS]: { timestamp: new Date() },
    [DataUpdateType.CONVERSATIONS]: { timestamp: new Date() },
    [DataUpdateType.EVENTS]: { timestamp: new Date() },
    [DataUpdateType.LLM_CALLS]: { timestamp: new Date() },
    [DataUpdateType.TOOL_CALLS]: { timestamp: new Date() },
    [DataUpdateType.SECURITY_ALERTS]: { timestamp: new Date() },
    [DataUpdateType.EVENT_SECURITY]: { timestamp: new Date() },
    [DataUpdateType.PERFORMANCE_METRICS]: { timestamp: new Date() },
    [DataUpdateType.ALL]: { timestamp: new Date() }
  };
  
  private constructor(options: DataUpdateServiceOptions = {}) {
    super();
    
    const dbConnection = options.dbConnection || DbConnection.getInstance();
    this.dbUtils = new DbUtils(dbConnection);
    this.pollingInterval = options.pollingInterval || 5000;
    
    // Start polling if autoStart is enabled
    if (options.autoStart !== false) {
      this.startPolling();
    }
  }
  
  /**
   * Get singleton instance
   * @param options Options for the data update service
   * @returns DataUpdateService instance
   */
  public static getInstance(options: DataUpdateServiceOptions = {}): DataUpdateService {
    if (!DataUpdateService.instance) {
      DataUpdateService.instance = new DataUpdateService(options);
    }
    return DataUpdateService.instance;
  }
  
  /**
   * Start polling for data updates
   * @returns this instance for chaining
   */
  public startPolling(): this {
    if (!this.isPolling) {
      this.isPolling = true;
      this.emit('connection', { status: 'connected' });
      this.pollForUpdates();
    }
    return this;
  }
  
  /**
   * Stop polling for data updates
   * @returns this instance for chaining
   */
  public stopPolling(): this {
    if (this.pollingTimer) {
      clearTimeout(this.pollingTimer);
      this.pollingTimer = null;
    }
    this.isPolling = false;
    this.emit('connection', { status: 'disconnected' });
    return this;
  }
  
  /**
   * Change polling interval
   * @param interval New interval in milliseconds
   * @returns this instance for chaining
   */
  public setPollingInterval(interval: number): this {
    this.pollingInterval = interval;
    // Restart polling with new interval if active
    if (this.isPolling) {
      this.stopPolling();
      this.startPolling();
    }
    return this;
  }
  
  /**
   * Check connection status
   * @returns true if polling is active
   */
  public isConnected(): boolean {
    return this.isPolling;
  }
  
  /**
   * Poll for updates in all tables
   */
  private pollForUpdates(): void {
    const checkUpdates = async () => {
      try {
        await this.checkForUpdates(DataUpdateType.AGENTS);
        await this.checkForUpdates(DataUpdateType.SESSIONS);
        await this.checkForUpdates(DataUpdateType.CONVERSATIONS);
        await this.checkForUpdates(DataUpdateType.EVENTS);
        await this.checkForUpdates(DataUpdateType.LLM_CALLS);
        await this.checkForUpdates(DataUpdateType.TOOL_CALLS);
        await this.checkForUpdates(DataUpdateType.SECURITY_ALERTS);
        await this.checkForUpdates(DataUpdateType.EVENT_SECURITY);
        await this.checkForUpdates(DataUpdateType.PERFORMANCE_METRICS);
        
        // Update ALL timestamp after checking everything
        this.lastUpdates[DataUpdateType.ALL].timestamp = new Date();
      } catch (error) {
        console.error('Error polling for updates:', error);
        this.emit('error', error);
      }
      
      // Schedule next poll if still active
      if (this.isPolling) {
        this.pollingTimer = setTimeout(checkUpdates, this.pollingInterval);
      }
    };
    
    // Start the polling cycle
    checkUpdates();
  }
  
  /**
   * Check for updates in a specific table
   * @param type The data update type / table to check
   */
  private async checkForUpdates(type: DataUpdateType): Promise<void> {
    // Skip the ALL type since it's just a composite
    if (type === DataUpdateType.ALL) return;
    
    const lastUpdate = this.lastUpdates[type];
    const tableName = this.tables[type];
    let newRecords: any[] = [];
    
    // For most tables, check based on created_at and updated_at
    if (type === DataUpdateType.AGENTS || 
        type === DataUpdateType.SESSIONS || 
        type === DataUpdateType.CONVERSATIONS) {
      const query = `
        SELECT * FROM ${tableName}
        WHERE created_at > datetime('${lastUpdate.timestamp.toISOString()}')
        OR updated_at > datetime('${lastUpdate.timestamp.toISOString()}')
        ORDER BY id DESC LIMIT 100
      `;
      
      newRecords = this.dbUtils.queryMany(query);
    } 
    // For other tables, check based on id
    else {
      const lastId = lastUpdate.lastId || 0;
      const query = `
        SELECT * FROM ${tableName}
        WHERE id > ${lastId}
        ORDER BY id ASC LIMIT 100
      `;
      
      newRecords = this.dbUtils.queryMany(query);
      
      // Update lastId to the highest id from new records if we have any results
      if (newRecords.length > 0) {
        const highestId = Math.max(...newRecords.map(record => record.id));
        lastUpdate.lastId = highestId;
      }
    }
    
    // If we have new records, emit an update
    if (newRecords.length > 0) {
      const update: DataUpdate = {
        type,
        data: newRecords,
        timestamp: new Date()
      };
      
      lastUpdate.timestamp = update.timestamp;
      this.emit(type, update);
      this.emit(DataUpdateType.ALL, update);
    }
  }
} 
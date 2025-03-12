/**
 * @cylestio/ui-dashboard type definitions
 */

declare module '@cylestio/ui-dashboard' {
  import { ReactNode, ComponentProps } from 'react';
  
  // Common props that most components will accept
  interface BaseProps {
    className?: string;
    testId?: string;
  }
  
  // Sidebar Component
  export interface SidebarProps extends BaseProps {
    navigation?: Array<{
      name: string;
      href: string;
      icon?: any;
    }>;
    logo?: ReactNode;
    title?: string;
  }
  export const Sidebar: React.FC<SidebarProps>;
  
  // Dashboard Metrics Component
  export interface MetricsData {
    title: string;
    value: number | string;
    change?: number;
    changeType?: 'increase' | 'decrease';
    icon?: ReactNode;
  }
  
  export interface DashboardMetricsProps extends BaseProps {
    data?: MetricsData[];
    isLoading?: boolean;
    cardClassName?: string;
  }
  export const DashboardMetrics: React.FC<DashboardMetricsProps>;
  
  // Dashboard Charts Component
  export interface ChartData {
    id: string;
    title: string;
    data: Array<Record<string, any>>;
    categories?: string[];
    colors?: string[];
    type?: 'bar' | 'line' | 'area' | 'pie';
  }
  
  export interface DashboardChartsProps extends BaseProps {
    data?: ChartData[];
    isLoading?: boolean;
    gridClassName?: string;
    chartClassName?: string;
  }
  export const DashboardCharts: React.FC<DashboardChartsProps>;
  
  // Loading Spinner Component
  export interface LoadingSpinnerProps extends BaseProps {
    size?: 'sm' | 'md' | 'lg';
    color?: string;
  }
  export const LoadingSpinner: React.FC<LoadingSpinnerProps>;
  
  // Page Components
  export const HomePage: React.FC<BaseProps>;
  export const AlertsPage: React.FC<BaseProps>;
  export const EventsPage: React.FC<BaseProps>;
  export const AnalyticsPage: React.FC<BaseProps>;
  export const SettingsPage: React.FC<BaseProps>;
  
  // Root Layout
  export interface RootLayoutProps {
    children: ReactNode;
  }
  export const RootLayout: React.FC<RootLayoutProps>;
} 
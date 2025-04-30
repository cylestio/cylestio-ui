/**
 * Spacing constants for consistent spacing across the application
 * Based on a 4px grid system
 * 
 * IMPLEMENTATION PLAN FOR CONSISTENT SPACING:
 * 
 * 1. Use these spacing constants in all components for consistent spacing and alignment
 * 2. Key components to update:
 *    - PageContainer (done) - Controls overall page padding
 *    - PageHeader (done) - Controls header spacing and margins
 *    - SectionHeader (done) - Controls section title spacing
 *    - DashboardCard - Update padding and margins
 *    - MetricCard - Update internal padding 
 *    - ResponsiveContainer - Update gap values
 * 
 * 3. Use consistent spacing patterns:
 *    - Use SPACING.TAILWIND.PAGE_X/PAGE_Y for outer page padding
 *    - Use SPACING.TAILWIND.CARD for card components
 *    - Use SPACING.TAILWIND.SECTION_MB for vertical spacing between sections
 *    - Use SPACING.TAILWIND.HEADER_MB for header bottom margins
 *    - Use SPACING.TAILWIND.ELEMENT_MB for element bottom margins
 *    - Use SPACING.TAILWIND.GRID_GAP for grid gaps
 *    - Use SPACING.TAILWIND.FLEX_GAP for flex container gaps
 */

export const SPACING = {
  // Base spacing units
  NONE: '0px',
  XS: '4px',
  SM: '8px',
  MD: '12px',
  LG: '16px',
  XL: '20px',
  XXL: '24px',
  
  // Larger spacing units
  XXXL: '32px',
  XXXXL: '40px',
  
  // Component specific spacing
  PAGE_PADDING: {
    X: {
      DEFAULT: '16px', // 4px
      SM: '24px',      // 6px
      MD: '32px',      // 8px
    },
    Y: {
      DEFAULT: '24px', // 6px
      SM: '32px',      // 8px
    }
  },
  
  // Section spacing
  SECTION: {
    DEFAULT: '24px', // 6px
    SM: '32px',      // 8px
    MD: '40px',      // 10px
  },
  
  // Card padding
  CARD: {
    DEFAULT: '16px', // 4px
    SM: '20px',      // 5px
    MD: '24px',      // 6px
  },
  
  // Grid gaps
  GRID_GAP: {
    DEFAULT: '16px', // 4px
    SM: '24px',      // 6px 
    MD: '32px',      // 8px
  },
  
  // Tailwind CSS classes for common spacing patterns
  TAILWIND: {
    // Padding
    PAGE_X: 'px-4 sm:px-6 lg:px-8',
    PAGE_Y: 'py-6 sm:py-8',
    CARD: 'p-4 sm:p-5 md:p-6',
    
    // Margins
    SECTION_MB: 'mb-6 sm:mb-8 md:mb-10',
    HEADER_MB: 'mb-4 sm:mb-6',
    ELEMENT_MB: 'mb-4 sm:mb-5',
    
    // Gaps
    GRID_GAP: 'gap-4 sm:gap-6 md:gap-8',
    FLEX_GAP: 'gap-3 sm:gap-4',
  }
};

// Generate spacing utility for responsive design
export const getResponsiveSpacing = (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl') => {
  const spacingMap = {
    xs: 'gap-2',
    sm: 'gap-3 sm:gap-4',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8',
    xl: 'gap-8 sm:gap-10',
  };
  
  return spacingMap[size];
};

export default SPACING; 
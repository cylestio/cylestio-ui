'use client';

import React, { ReactNode } from 'react';
import { SPACING } from './spacing';
import SectionHeader from './SectionHeader';

interface ContentSectionProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  rightContent?: ReactNode;
  showDivider?: boolean;
  spacing?: 'default' | 'none';
}

/**
 * ContentSection provides consistent spacing and structure for content sections
 * It includes optional section header and consistent margins
 */
export default function ContentSection({
  title,
  description,
  icon,
  children,
  className = '',
  rightContent,
  showDivider = true,
  spacing = 'default',
}: ContentSectionProps) {
  // Use standardized spacing class from SPACING constants
  const spacingClass = spacing === 'default' ? SPACING.TAILWIND.SECTION_MB : '';
  
  return (
    <section className={`${spacingClass} ${className}`.trim()}>
      {title && (
        <SectionHeader
          title={title}
          description={description}
          icon={icon}
          rightContent={rightContent}
        />
      )}
      
      <div>
        {children}
      </div>
    </section>
  );
} 
'use client';

import { Button, Flex } from '@tremor/react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface RefreshButtonProps {
  onClick: () => void;
  tooltip?: string;
}

export default function RefreshButton({ 
  onClick, 
  tooltip = "Refresh data" 
}: RefreshButtonProps) {
  return (
    <Flex justifyContent="end">
      <Button
        variant="light"
        icon={ArrowPathIcon}
        tooltip={tooltip}
        onClick={onClick}
        size="xs"
      >
        <span className="sr-only">Refresh</span>
      </Button>
    </Flex>
  );
} 
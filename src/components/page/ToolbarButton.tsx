
import React, { useRef, useState, useEffect } from 'react';

interface ToolbarButtonProps {
  id?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  tooltip?: string;
}

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  id,
  onClick,
  disabled = false,
  className = '',
  children,
  tooltip
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('top');

  useEffect(() => {
    if (!tooltip || !buttonRef.current) return;

    const updateTooltipPosition = () => {
      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Check space above and below
      const spaceAbove = rect.top;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceLeft = rect.left;
      const spaceRight = viewportWidth - rect.right;

      // Determine best position based on available space
      if (spaceAbove >= 40 && spaceAbove >= spaceBelow) {
        setTooltipPosition('top');
      } else if (spaceBelow >= 40) {
        setTooltipPosition('bottom');
      } else if (spaceRight >= 100) {
        setTooltipPosition('right');
      } else if (spaceLeft >= 100) {
        setTooltipPosition('left');
      } else {
        // Fallback to top if no good position
        setTooltipPosition('top');
      }
    };

    // Update position on mount and scroll/resize
    updateTooltipPosition();
    window.addEventListener('scroll', updateTooltipPosition);
    window.addEventListener('resize', updateTooltipPosition);

    return () => {
      window.removeEventListener('scroll', updateTooltipPosition);
      window.removeEventListener('resize', updateTooltipPosition);
    };
  }, [tooltip]);

  const getTooltipClasses = () => {
    const baseClasses = "absolute px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50";

    switch (tooltipPosition) {
      case 'top':
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
      case 'bottom':
        return `${baseClasses} top-full left-1/2 transform -translate-x-1/2 mt-2`;
      case 'left':
        return `${baseClasses} right-full top-1/2 transform -translate-y-1/2 mr-2`;
      case 'right':
        return `${baseClasses} left-full top-1/2 transform -translate-y-1/2 ml-2`;
      default:
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
    }
  };

  const getArrowClasses = () => {
    const baseArrowClasses = "absolute w-0 h-0";

    switch (tooltipPosition) {
      case 'top':
        return `${baseArrowClasses} top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700`;
      case 'bottom':
        return `${baseArrowClasses} bottom-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900 dark:border-b-gray-700`;
      case 'left':
        return `${baseArrowClasses} right-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-900 dark:border-l-gray-700`;
      case 'right':
        return `${baseArrowClasses} left-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900 dark:border-r-gray-700`;
      default:
        return `${baseArrowClasses} top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700`;
    }
  };

  return (
    <div className="relative group">
      <button
        ref={buttonRef}
        id={id}
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex items-center px-2 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-300 dark:bg-blue-900/50 dark:hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-200 disabled:opacity-50 flex-shrink-0 ${className}`}
      >
        {children}
      </button>
      {tooltip && (
        <div className={getTooltipClasses()}>
          {tooltip}
          <div className={getArrowClasses()}></div>
        </div>
      )}
    </div>
  )

}
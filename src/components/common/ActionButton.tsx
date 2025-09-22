import React from 'react';
import { ActionViewIcon, ActionEditIcon, ActionDeleteIcon } from '../../icons';

interface ActionButtonProps {
  onClick: () => void;
  title?: string;
  variant?: 'edit' | 'delete' | 'view' | 'default';
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  title,
  variant = 'default',
  className = '',
  disabled = false,
  children
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'edit':
        return 'text-blue-600 hover:text-blue-800 hover:bg-blue-50';
      case 'delete':
        return 'text-red-600 hover:text-red-800 hover:bg-red-50';
      case 'view':
        return 'text-green-600 hover:text-green-800 hover:bg-green-50';
      default:
        return 'text-gray-600 hover:text-gray-800 hover:bg-gray-50';
    }
  };

  const getIcon = () => {
    switch (variant) {
      case 'edit':
        return <ActionEditIcon />;
      case 'delete':
        return <ActionDeleteIcon />;
      case 'view':
        return <ActionViewIcon />;
      default:
        return null;
    }
  };

  const baseClasses = 'p-1 rounded transition-colors';
  const variantClasses = getVariantClasses();
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses} ${disabledClasses} ${className}`}
      title={title}
      disabled={disabled}
    >
      {children ? children : getIcon()}
    </button>
  );
};

export default ActionButton;
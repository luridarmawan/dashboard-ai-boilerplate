import React from 'react';
import { Link } from 'react-router';
import { ActionViewIcon, ActionEditIcon, ActionDeleteIcon } from '../../icons';

interface ActionLinkProps {
  to: string;
  title?: string;
  variant?: 'edit' | 'delete' | 'view' | 'default';
  className?: string;
  children?: React.ReactNode;
}

const ActionLink: React.FC<ActionLinkProps> = ({
  to,
  title,
  variant = 'default',
  className = '',
  children,
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
        return <ActionViewIcon />;
    }
  };

  const baseClasses = 'p-1 rounded transition-colors';
  const variantClasses = getVariantClasses();

  return (
    <Link
      to={to}
      className={`${baseClasses} ${variantClasses} ${className}`}
      title={title}
    >
      {children ? children : getIcon()}
    </Link>
  );
};

export default ActionLink;
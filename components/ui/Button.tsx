
import React, { ButtonHTMLAttributes } from 'react';
import { useDebouncedFunction } from '@/lib/hooks/useDebouncedFunction';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  debounceDelay?: number; 
  isLoading?: boolean; 
  lockOnClick?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  debounceDelay = 500, 
  isLoading = false,
  disabled,
  ...rest
}) => {
  const debouncedOnClick = useDebouncedFunction(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (onClick) {
        onClick(e);
      }
    },
    debounceDelay
  );

  return (
    <button
      onClick={debouncedOnClick}
      disabled={disabled || isLoading}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;

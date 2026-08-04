import React from 'react';

interface HoverLineButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  lineColor?: string;
}

/**
 * HoverLineButton component imported from UIverse.io
 * Features expanding top & bottom lines on hover.
 */
export const HoverLineButton: React.FC<HoverLineButtonProps> = ({
  children,
  className = '',
  lineColor = '#f44336',
  style,
  ...props
}) => {
  return (
    <button
      {...props}
      style={{
        ...style,
        ['--line-color' as string]: lineColor,
      }}
      className={`uiverse-hover-btn ${className}`}
    >
      {children}
    </button>
  );
};

export default HoverLineButton;

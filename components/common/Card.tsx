
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  const combinedClasses = `bg-gray-800 shadow-lg rounded-lg overflow-hidden border border-gray-700 ${className}`;
  return <div className={combinedClasses}>{children}</div>;
};

export const CardHeader: React.FC<CardProps> = ({ children, className = '' }) => {
  return <div className={`p-4 sm:p-6 border-b border-gray-700 ${className}`}>{children}</div>;
};

export const CardContent: React.FC<CardProps> = ({ children, className = '' }) => {
  return <div className={`p-4 sm:p-6 ${className}`}>{children}</div>;
};

export const CardFooter: React.FC<CardProps> = ({ children, className = '' }) => {
    return <div className={`p-4 sm:p-6 bg-gray-800/50 border-t border-gray-700 ${className}`}>{children}</div>;
  };

export default Card;

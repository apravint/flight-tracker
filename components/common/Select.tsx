
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({ children, className = '', ...props }) => {
  const combinedClasses = `block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-white ${className}`;
  return (
    <select className={combinedClasses} {...props}>
      {children}
    </select>
  );
};

export default Select;

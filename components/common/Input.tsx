
import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input: React.FC<InputProps> = ({ className = '', ...props }) => {
  const combinedClasses = `block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-white placeholder-gray-400 ${className}`;
  return <input className={combinedClasses} {...props} />;
};

export default Input;

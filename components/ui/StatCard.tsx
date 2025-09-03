import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  color: 'green' | 'red' | 'blue';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    green: 'bg-green-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md flex items-center overflow-hidden">
      <div className={`p-3 rounded-full text-white ${colorClasses[color]} mr-4 shrink-0`}>
        <Icon className="h-8 w-8" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 font-medium truncate">{title}</p>
        <p 
          className="text-base lg:text-lg font-bold text-gray-800 truncate" 
          title={value}
        >
          {value}
        </p>
      </div>
    </div>
  );
};

export default StatCard;

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
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
      <div className={`p-4 rounded-full text-white ${colorClasses[color]} mr-4`}>
        <Icon className="h-8 w-8" />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;

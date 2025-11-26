import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  color: 'green' | 'red' | 'blue';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color }) => {
  const iconColorClasses = {
      green: 'from-green-400 to-green-600',
      red: 'from-red-400 to-red-600',
      blue: 'from-blue-400 to-blue-600',
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.07)] flex items-center gap-5 transition-all duration-300 ease-out hover:shadow-[0_6px_20px_rgba(0,0,0,0.1)] hover:-translate-y-1">
      <div className={`p-4 rounded-full text-white bg-gradient-to-br ${iconColorClasses[color]} shadow-lg shrink-0`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 font-medium truncate">{title}</p>
        <p 
          className="text-2xl font-bold text-gray-800 truncate" 
          title={value}
        >
          {value}
        </p>
      </div>
    </div>
  );
};

export default React.memo(StatCard);
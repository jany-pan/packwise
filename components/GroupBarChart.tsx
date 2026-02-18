import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Trip, Category } from '../types';

interface GroupBarChartProps {
  trip: Trip;
}

const COLORS = {
  [Category.SHELTER]: '#6366f1',
  [Category.SLEEP]: '#0ea5e9',
  [Category.CLOTHING]: '#10b981',
  [Category.COOKING]: '#f59e0b',
  [Category.ELECTRONICS]: '#f43f5e',
  [Category.HYGIENE]: '#14b8a6',
  [Category.FOOD]: '#34d399',
  [Category.MISC]: '#64748b'
};

const GroupBarChart: React.FC<GroupBarChartProps> = ({ trip }) => {
  const data = useMemo(() => {
    return trip.participants.map(p => {
      const stats: any = { name: p.ownerName };
      // Initialize all categories to 0
      Object.values(Category).forEach(cat => stats[cat] = 0);

      p.items.forEach(item => {
        // weight in kg, rounded to 2 decimals
        const weightKg = (item.weight * item.quantity) / 1000;
        stats[item.category] += weightKg;
      });
      
      // Round values for cleaner tooltips
      Object.keys(stats).forEach(key => {
        if (key !== 'name') stats[key] = Math.round(stats[key] * 100) / 100;
      });

      return stats;
    });
  }, [trip]);

  if (trip.participants.length === 0) return null;

  return (
    <div className="h-80 w-full animate-in fade-in zoom-in duration-700">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 10 }} 
            unit=" kg"
          />
          <Tooltip 
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1)' }}
            itemStyle={{ fontSize: '11px', fontWeight: 600, textTransform: 'capitalize' }}
          />
          <Legend 
            iconType="circle" 
            wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 600 }}
          />
          {Object.values(Category).map((cat) => (
            <Bar 
              key={cat} 
              dataKey={cat} 
              stackId="a" 
              fill={COLORS[cat]} 
              radius={[0, 0, 0, 0]}
              maxBarSize={60}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GroupBarChart;
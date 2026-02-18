import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Trip, Category } from '../types';
import { Tent, Moon, Shirt, Flame, Smartphone, Droplets, Apple, Package } from 'lucide-react';

interface GroupBarChartProps {
  trip: Trip;
}

// Configuration map to keep colors and icons synced with the rest of the app
const CATEGORY_CONFIG: Record<Category, { color: string; icon: React.ReactNode }> = {
  [Category.SHELTER]:     { color: '#6366f1', icon: <Tent size={14} /> },       // indigo-500
  [Category.SLEEP]:       { color: '#0ea5e9', icon: <Moon size={14} /> },       // sky-500
  [Category.CLOTHING]:    { color: '#10b981', icon: <Shirt size={14} /> },      // emerald-500
  [Category.COOKING]:     { color: '#f59e0b', icon: <Flame size={14} /> },      // amber-500
  [Category.ELECTRONICS]: { color: '#f43f5e', icon: <Smartphone size={14} /> }, // rose-500
  [Category.HYGIENE]:     { color: '#14b8a6', icon: <Droplets size={14} /> },   // teal-500
  [Category.FOOD]:        { color: '#34d399', icon: <Apple size={14} /> },      // emerald-400
  [Category.MISC]:        { color: '#64748b', icon: <Package size={14} /> }     // slate-500
};

const GroupBarChart: React.FC<GroupBarChartProps> = ({ trip }) => {
  const data = useMemo(() => {
    return trip.participants.map(p => {
      const stats: any = { name: p.ownerName };
      // Initialize all categories to 0
      Object.values(Category).forEach(cat => stats[cat] = 0);

      p.items.forEach(item => {
        // weight in kg
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

  // Custom Legend Component to render Icons instead of dots
  const renderCustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 pt-6 px-4">
        {payload.map((entry: any, index: number) => {
          const cat = entry.value as Category;
          const config = CATEGORY_CONFIG[cat];
          
          return (
            <div key={`item-${index}`} className="flex items-center gap-1.5">
              <div 
                className="w-5 h-5 rounded-full flex items-center justify-center text-white shadow-sm"
                style={{ backgroundColor: config.color }}
              >
                {config.icon}
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {cat}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  if (trip.participants.length === 0) return null;

  return (
    <div className="h-96 w-full animate-in fade-in zoom-in duration-700">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
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
          <Legend content={renderCustomLegend} />
          
          {Object.values(Category).map((cat) => (
            <Bar 
              key={cat} 
              dataKey={cat} 
              stackId="a" 
              fill={CATEGORY_CONFIG[cat].color} 
              radius={[0, 0, 0, 0]}
              maxBarSize={50}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GroupBarChart;
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';
import { Trip, Category } from '../types';
import { Tent, Moon, Shirt, Flame, Smartphone, Droplets, Apple, Package, Backpack, Utensils } from 'lucide-react';

interface GroupBarChartProps {
  trip: Trip;
}

const CATEGORY_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  [Category.PACKING]:     { color: '#8b5cf6', icon: <Backpack size={14} /> },
  [Category.SHELTER]:     { color: '#6366f1', icon: <Tent size={14} /> },
  [Category.SLEEP]:       { color: '#0ea5e9', icon: <Moon size={14} /> },
  [Category.CLOTHING]:    { color: '#10b981', icon: <Shirt size={14} /> },
  [Category.KITCHEN]:     { color: '#f59e0b', icon: <Utensils size={14} /> },
  [Category.ELECTRONICS]: { color: '#f43f5e', icon: <Smartphone size={14} /> },
  [Category.HYGIENE]:     { color: '#14b8a6', icon: <Droplets size={14} /> },
  [Category.MISC]:        { color: '#64748b', icon: <Package size={14} /> },
  
  'Cooking':              { color: '#f59e0b', icon: <Utensils size={14} /> },
  'Food':                 { color: '#f59e0b', icon: <Utensils size={14} /> },
  'Food & Gas':           { color: '#f59e0b', icon: <Utensils size={14} /> }
};

const GroupBarChart: React.FC<GroupBarChartProps> = ({ trip }) => {
  const data = useMemo(() => {
    return trip.participants.map(p => {
      const stats: any = { name: p.ownerName };
      Object.keys(CATEGORY_CONFIG).forEach(cat => stats[cat] = 0);

      p.items.forEach(item => {
        const weightKg = (item.weight * item.quantity) / 1000;
        let catKey = item.category;
        if (catKey === 'Cooking' || catKey === 'Food' || catKey === 'Food & Gas') {
           catKey = Category.KITCHEN;
        }
        if (!CATEGORY_CONFIG[catKey]) catKey = Category.MISC;
        stats[catKey] += weightKg;
      });
      
      Object.keys(stats).forEach(key => {
        if (key !== 'name') stats[key] = Math.round(stats[key] * 100) / 100;
      });

      return stats;
    });
  }, [trip]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 min-w-[150px]">
          <p className="text-sm font-black text-slate-900 mb-3 border-b border-slate-100 pb-2">{label}</p>
          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => {
              if (entry.value === 0) return null;
              const catKey = entry.dataKey;
              const config = CATEGORY_CONFIG[catKey];
              return (
                <div key={index} className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div style={{ color: entry.fill }} className="shrink-0">
                      {config?.icon}
                    </div>
                    <span className="font-bold text-slate-500 uppercase tracking-wide text-[10px]">{entry.name}</span>
                  </div>
                  <span className="font-black text-slate-900">{entry.value} kg</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  if (trip.participants.length === 0) return null;

  return (
    <div className="w-full animate-in fade-in zoom-in duration-700">
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 10 }}>
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
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
            
            {Object.values(Category).map((cat) => (
              <Bar 
                key={cat} 
                dataKey={cat} 
                stackId="a" 
                fill={CATEGORY_CONFIG[cat].color} 
                radius={[0, 0, 0, 0]}
                maxBarSize={50}
              >
                <LabelList 
                  dataKey={cat} 
                  content={(props: any) => {
                    const { x, y, width, height, value } = props;
                    if (!value || height < 18) return null; 
                    return (
                      <text 
                        x={x + width / 2} 
                        y={y + height / 2} 
                        fill="#fff" 
                        textAnchor="middle" 
                        dominantBaseline="middle"
                        fontSize="8"
                        fontWeight="900"
                        style={{ pointerEvents: 'none' }}
                      >
                        {value}kg
                      </text>
                    );
                  }}
                />
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 pt-6 px-1 border-t border-slate-50 mt-4">
        {Object.values(Category).map((cat) => {
           const config = CATEGORY_CONFIG[cat];
           return (
            <div key={cat} className="flex items-center justify-start gap-2 bg-slate-50/50 px-3 py-2 rounded-xl">
              <div 
                className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-white shadow-sm shrink-0"
                style={{ backgroundColor: config.color }}
              >
                <div className="scale-75 sm:scale-100 flex items-center justify-center">
                  {config.icon}
                </div>
              </div>
              <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">
                {cat}
              </span>
            </div>
           );
        })}
      </div>
    </div>
  );
};

export default GroupBarChart;
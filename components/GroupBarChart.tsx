import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Trip, Category } from '../types';
import { Tent, Moon, Shirt, Flame, Smartphone, Droplets, Apple, Package, Backpack, Utensils } from 'lucide-react';

interface GroupBarChartProps {
  trip: Trip;
}

// Configuration map for consistency
const CATEGORY_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  // New Categories
  [Category.PACKING]:     { color: '#8b5cf6', icon: <Backpack size={14} /> },
  [Category.SHELTER]:     { color: '#6366f1', icon: <Tent size={14} /> },
  [Category.SLEEP]:       { color: '#0ea5e9', icon: <Moon size={14} /> },
  [Category.CLOTHING]:    { color: '#10b981', icon: <Shirt size={14} /> },
  [Category.KITCHEN]:     { color: '#f59e0b', icon: <Utensils size={14} /> },
  [Category.ELECTRONICS]: { color: '#f43f5e', icon: <Smartphone size={14} /> },
  [Category.HYGIENE]:     { color: '#14b8a6', icon: <Droplets size={14} /> },
  [Category.MISC]:        { color: '#64748b', icon: <Package size={14} /> },
  
  // Legacy Fallbacks (Prevents crash if DB has old data)
  'Cooking':              { color: '#f59e0b', icon: <Utensils size={14} /> },
  'Food':                 { color: '#f59e0b', icon: <Utensils size={14} /> },
  'Food & Gas':           { color: '#f59e0b', icon: <Utensils size={14} /> }
};

const GroupBarChart: React.FC<GroupBarChartProps> = ({ trip }) => {
  const data = useMemo(() => {
    return trip.participants.map(p => {
      const stats: any = { name: p.ownerName };
      
      // Initialize all categories to 0
      Object.keys(CATEGORY_CONFIG).forEach(cat => stats[cat] = 0);

      p.items.forEach(item => {
        const weightKg = (item.weight * item.quantity) / 1000;
        
        // Map old data to new keys safely
        let catKey = item.category;
        if (catKey === 'Cooking' || catKey === 'Food' || catKey === 'Food & Gas') {
           catKey = Category.KITCHEN;
        }
        
        // Fallback for unknown categories
        if (!CATEGORY_CONFIG[catKey]) catKey = Category.MISC;

        stats[catKey] += weightKg;
      });
      
      // Round for display
      Object.keys(stats).forEach(key => {
        if (key !== 'name') stats[key] = Math.round(stats[key] * 100) / 100;
      });

      return stats;
    });
  }, [trip]);

  if (trip.participants.length === 0) return null;

  return (
    <div className="w-full animate-in fade-in zoom-in duration-700">
      {/* 1. Chart Area */}
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
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1)' }}
              itemStyle={{ fontSize: '11px', fontWeight: 600, textTransform: 'capitalize' }}
            />
            
            {/* Render Bars for all active categories */}
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

      {/* 2. Legend Area (Cleanly separated below) */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-3 pt-6 px-2 border-t border-slate-50 mt-4">
        {Object.values(Category).map((cat) => {
           const config = CATEGORY_CONFIG[cat];
           return (
            <div key={cat} className="flex items-center gap-1.5 bg-slate-50/50 px-2 py-1 rounded-lg">
              <div 
                className="w-5 h-5 rounded-full flex items-center justify-center text-white shadow-sm shrink-0"
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
    </div>
  );
};

export default GroupBarChart;
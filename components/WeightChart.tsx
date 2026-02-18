import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { GearItem, Category } from '../types';
import { Tent, Moon, Shirt, Flame, Smartphone, Droplets, Apple, Package, Backpack, Utensils } from 'lucide-react';

interface WeightChartProps {
  items: GearItem[];
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

const WeightChart: React.FC<WeightChartProps> = ({ items }) => {
  const data = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    
    items.forEach(item => {
      let catKey = item.category;
      if (catKey === 'Cooking' || catKey === 'Food' || catKey === 'Food & Gas') {
         catKey = Category.KITCHEN;
      }
      
      const weightKg = (item.weight * item.quantity) / 1000;
      categoryTotals[catKey] = (categoryTotals[catKey] || 0) + weightKg;
    });

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ 
        name, 
        value: Math.round(value * 100) / 100 
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [items]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const config = CATEGORY_CONFIG[data.name] || CATEGORY_CONFIG[Category.MISC];
      
      return (
        <div className="bg-white p-3 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: config.color }}
          >
            {config.icon}
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
              {data.name}
            </p>
            <p className="text-sm font-black text-slate-900">{data.value} kg</p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) return null;

  return (
    <div className="w-full animate-in fade-in zoom-in duration-700">
      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="72%" // Slightly smaller to ensure "kg" unit fits on mobile screens
              paddingAngle={5}
              dataKey="value"
              animationBegin={0}
              animationDuration={1200}
              labelLine={true}
              {/* 🆕 Permanent label with bold weight and kg unit */}
              label={({ value }) => ({
                fill: '#64748b',
                fontSize: 10,
                fontWeight: 900,
                text: `${value} kg`
              })}
              {/* If your recharts version prefers a function return for labels: */}
              {/* label={({ value }) => `${value} kg`} */}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={CATEGORY_CONFIG[entry.name]?.color || '#64748b'} 
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 pt-6 px-1 border-t border-slate-50 mt-4">
        {data.map((entry) => {
           const config = CATEGORY_CONFIG[entry.name] || CATEGORY_CONFIG[Category.MISC];
           return (
            <div key={entry.name} className="flex items-center justify-start gap-2 bg-slate-50/50 px-3 py-2 rounded-xl">
              <div 
                className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-white shadow-sm shrink-0"
                style={{ backgroundColor: config.color }}
              >
                <div className="scale-75 sm:scale-100 flex items-center justify-center">
                  {config.icon}
                </div>
              </div>
              <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">
                {entry.name}
              </span>
            </div>
           );
        })}
      </div>
    </div>
  );
};

export default WeightChart;
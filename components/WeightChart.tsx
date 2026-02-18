
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { GearItem, Category } from '../types';

interface WeightChartProps {
  items: GearItem[];
}

const COLORS: Record<string, string> = {
  [Category.PACKING]: '#8b5cf6',
  [Category.SHELTER]: '#6366f1',
  [Category.SLEEP]: '#0ea5e9',
  [Category.CLOTHING]: '#10b981',
  [Category.KITCHEN]: '#f59e0b',
  [Category.ELECTRONICS]: '#f43f5e',
  [Category.HYGIENE]: '#14b8a6',
  [Category.MISC]: '#64748b',
  
  // 🛡️ LEGACY
  'Cooking': '#f59e0b',
  'Food': '#f59e0b',
  'Food & Gas': '#f59e0b'
};

const WeightChart: React.FC<WeightChartProps> = ({ items }) => {
  const data = useMemo(() => {
    const categoryMap = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + (item.weight * item.quantity);
      return acc;
    }, {} as Record<string, number>);

    return (Object.entries(categoryMap) as [string, number][]).map(([name, value]) => ({
      name,
      value: Math.round(value / 1000 * 100) / 100 // convert to kg
    })).sort((a, b) => b.value - a.value);
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-300 gap-4">
        <PieChartIcon size={40} className="opacity-20" />
        <p className="text-[10px] font-black uppercase tracking-widest italic opacity-50">No data to display</p>
      </div>
    );
  }

  return (
    <div className="h-80 w-full animate-in fade-in zoom-in duration-700">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={70}
            outerRadius={95}
            paddingAngle={6}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry) => (
              <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name as Category] || '#ccc'} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [`${value} kg`, 'Weight']}
            contentStyle={{ 
              borderRadius: '24px', 
              border: 'none', 
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)', 
              padding: '15px 20px',
              fontWeight: '900',
              fontSize: '12px'
            }}
            itemStyle={{ color: '#0f172a' }}
          />
          <Legend 
            verticalAlign="bottom" 
            align="center"
            iconType="circle"
            wrapperStyle={{ 
              paddingTop: '30px', 
              fontSize: '9px', 
              fontWeight: 900, 
              textTransform: 'uppercase', 
              letterSpacing: '0.15em',
              color: '#94a3b8'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeightChart;

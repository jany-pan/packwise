
import React, { useState, useEffect } from 'react';
import { Sparkles, AlertCircle, TrendingDown, Layers, ShoppingBag } from 'lucide-react';
import { GearItem, PackStats, Language } from '../types';
import { getPackInsights } from '../services/geminiService';
import { translations } from '../translations';

interface Insight {
  title: string;
  advice: string;
  priority: 'High' | 'Medium' | 'Low';
}

interface AIInsightsProps {
  items: GearItem[];
  stats: PackStats;
  language: Language;
}

const AIInsights: React.FC<AIInsightsProps> = ({ items, stats, language }) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = translations[language];

  const fetchInsights = async () => {
    if (items.length < 2) {
      setError(language === 'sk' ? "Pridajte aspoň 2 položky pre analýzu." : "Add at least 2 items for analysis.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getPackInsights(items, stats, language);
      setInsights(data);
    } catch (err) {
      setError(language === 'sk' ? "Nepodarilo sa načítať analýzu." : "Failed to fetch insights.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (items.length >= 3 && insights.length === 0) {
      fetchInsights();
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white border-2 border-indigo-50 rounded-[2.5rem] p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-500 leading-relaxed mb-8 px-4">
          {t.aiDesc}
        </p>
        <button 
          onClick={fetchInsights}
          disabled={loading}
          className="w-full bg-indigo-600 text-white font-black py-5 rounded-[1.8rem] flex items-center justify-center gap-3 hover:bg-indigo-700 disabled:opacity-30 transition-all shadow-xl shadow-indigo-100 active:scale-[0.98] uppercase text-[11px] tracking-[0.2em]"
        >
          {loading ? <RefreshCw className="animate-spin" size={20} /> : <Sparkles size={20} />}
          {insights.length > 0 ? t.refresh : t.analyze}
        </button>
      </div>

      {loading && (
        <div className="space-y-6 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-slate-50 rounded-[2.5rem] border border-slate-100"></div>
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="bg-rose-50 border-2 border-rose-100 p-10 rounded-[2.5rem] text-center">
          <AlertCircle className="text-rose-400 mx-auto mb-4" size={48} />
          <p className="text-rose-700 font-black text-lg">{error}</p>
        </div>
      )}

      {!loading && insights.map((insight, idx) => (
        <div key={idx} className="bg-white border border-slate-50 rounded-[2.5rem] p-8 shadow-sm hover:shadow-md transition-all group flex gap-6">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
             {getInsightIcon(insight.title)}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start mb-3">
              <h4 className="font-black text-slate-900 text-lg leading-tight group-hover:text-indigo-600 transition-colors">{insight.title}</h4>
              <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full whitespace-nowrap ml-4 tracking-widest ${
                insight.priority === 'High' ? 'bg-rose-50 text-rose-500' : 
                insight.priority === 'Medium' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'
              }`}>
                {insight.priority}
              </span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">{insight.advice}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const getInsightIcon = (title: string) => {
   const t = title.toLowerCase();
   if (t.includes('weight') || t.includes('ľahší')) return <TrendingDown size={24} />;
   if (t.includes('shared') || t.includes('spoločné')) return <Layers size={24} />;
   if (t.includes('food') || t.includes('jedlo')) return <TrendingDown size={24} />;
   return <ShoppingBag size={24} />;
};

const RefreshCw = ({ className, size }: { className?: string, size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
    <path d="M21 3v5h-5"/>
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
    <path d="M3 21v-5h5"/>
  </svg>
);

export default AIInsights;

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { BarChart3, PieChart as PieIcon, Layers } from 'lucide-react';

export default function Analytics({ data }) {
  const { t } = useTranslation();
  const [filterCropId, setFilterCropId] = useState('all');

  const crops = data.crops || [];
  const expenses = data.expenses || [];
  const harvests = data.harvests || [];

  // Filter expenses and harvests based on selection
  const filteredExpenses = filterCropId === 'all' 
    ? expenses 
    : expenses.filter(e => e.cropId === filterCropId);


  // 1. Calculate Expense Breakdown by Category
  const expenseByCategory = filteredExpenses.reduce((acc, exp) => {
    const stage = exp.stage || 'misc';
    acc[stage] = (acc[stage] || 0) + (Number(exp.cost) || 0);
    return acc;
  }, {});

  const getStageLabel = (stage) => {
    switch (stage) {
      case 'land_prep': return t('expense_form.stage_land_prep');
      case 'seeds': return t('expense_form.stage_seeds');
      case 'sowing_labor': return t('expense_form.stage_sowing_labor');
      case 'pesticides': return t('expense_form.stage_pesticides');
      case 'fertilizers': return t('expense_form.stage_fertilizers');
      case 'manual_labor': return t('expense_form.stage_manual_labor');
      case 'misc':
      default:
        return t('expense_form.stage_misc');
    }
  };

  const pieData = Object.keys(expenseByCategory).map(key => ({
    name: getStageLabel(key),
    value: expenseByCategory[key]
  })).filter(item => item.value > 0);

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#64748b'];

  // 2. Calculate Comparison Data (Investment vs Revenue vs Profit)
  // For Bar Chart: We compare crops
  const barData = crops.map(crop => {
    const cropExp = expenses
      .filter(e => e.cropId === crop.id)
      .reduce((sum, e) => sum + (Number(e.cost) || 0), 0);
    
    const cropHarvest = harvests.find(h => h.cropId === crop.id);
    const cropRev = cropHarvest ? Number(cropHarvest.revenue) || 0 : 0;
    const cropProfit = cropHarvest ? cropRev - cropExp : 0;

    return {
      name: crop.cropName,
      [t('analytics.investment')]: cropExp,
      [t('analytics.revenue')]: cropRev,
      [t('analytics.profit')]: cropProfit
    };
  }).filter(item => item[t('analytics.investment')] > 0 || item[t('analytics.revenue')] > 0);

  const formatCurrency = (val) => {
    return `${t('dashboard.currency_symbol')}${Number(val).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="flex-1 px-4 py-6 sm:px-6 max-w-4xl mx-auto w-full space-y-6">
      
      {/* View Header with Crop Selector filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-left">
        <div>
          <h2 className="font-display font-extrabold text-xl text-slate-800 tracking-tight m-0">
            {t('analytics.title')}
          </h2>
          <p className="text-xs text-slate-400 mt-1">Select a crop cycle to filter your expense and profit distribution.</p>
        </div>
        
        {/* Selector */}
        <div className="relative inline-flex items-center w-full sm:w-auto">
          <Layers size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
          <select
            value={filterCropId}
            onChange={(e) => setFilterCropId(e.target.value)}
            className="w-full sm:w-auto pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm cursor-pointer"
          >
            <option value="all">All Crops (Combined)</option>
            {crops.map(c => (
              <option key={c.id} value={c.id}>{c.cropName} ({c.fieldAlias})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Pie Chart Card - Expense Breakdown */}
      <div className="glass-card rounded-2xl p-5 border border-slate-200 shadow-sm text-left">
        <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-1.5 mb-4">
          <PieIcon size={16} className="text-emerald-500" />
          {t('analytics.expense_breakdown')}
        </h3>

        {pieData.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs italic">
            {t('analytics.pie_empty')}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
            {/* Chart */}
            <div className="w-48 h-48 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>

              {/* Total Spent Center Badge */}
              <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-none">Total</span>
                <span className="text-xs font-extrabold text-slate-800 font-display mt-1 leading-none">
                  {formatCurrency(pieData.reduce((s, i) => s + i.value, 0))}
                </span>
              </div>
            </div>

            {/* Legends & Details */}
            <div className="flex-1 space-y-2 w-full">
              {pieData.map((item, index) => {
                const totalVal = pieData.reduce((s, i) => s + i.value, 0);
                const percent = ((item.value / totalVal) * 100).toFixed(0);
                return (
                  <div key={item.name} className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-slate-600 font-medium">{item.name}</span>
                    </div>
                    <div className="text-right font-semibold text-slate-800 flex items-center gap-2">
                      <span>{formatCurrency(item.value)}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                        {percent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bar Chart Card - Performance vs Investment */}
      <div className="glass-card rounded-2xl p-5 border border-slate-200 shadow-sm text-left">
        <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-1.5 mb-4">
          <BarChart3 size={16} className="text-amber-500" />
          {t('analytics.profit_vs_investment')}
        </h3>

        {barData.length === 0 ? (
          <div className="h-56 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs italic">
            {t('analytics.bar_empty')}
          </div>
        ) : (
          <div className="w-full h-64 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
              >
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${v}`} tickLine={false} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend iconSize={10} wrapperStyle={{ paddingTop: 10 }} />
                <Bar dataKey={t('analytics.investment')} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey={t('analytics.revenue')} fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey={t('analytics.profit')} fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

    </div>
  );
}

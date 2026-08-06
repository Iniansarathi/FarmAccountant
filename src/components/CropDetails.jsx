import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Trash2, Calendar, MapPin, Layers, Receipt, Plus, Grape, Pencil, CalendarCheck, PieChart as PieIcon } from 'lucide-react';
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Tooltip as RechartsTooltip } from 'recharts';


export default function CropDetails({ 
  cropId, 
  data, 
  onBack, 
  onDeleteCrop, 
  onDeleteExpense, 
  onDeleteHarvest,
  onConcludeCrop,
  onNavigate, 
  setSelectedCropId,
  onEditCrop,
  onEditExpense,
  onEditHarvest
}) {
  const { t } = useTranslation();

  const [isConcludeModalOpen, setIsConcludeModalOpen] = useState(false);
  const [conclusionDate, setConclusionDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedYear, setSelectedYear] = useState('all');

  const crop = data.crops.find(c => c.id === cropId);
  if (!crop) {
    return (
      <div className="flex-1 p-6 text-center">
        <p className="text-slate-500">Crop cycle not found.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg">
          Go Back
        </button>
      </div>
    );
  }

  const rawExpenses = data.expenses.filter(e => e.cropId === cropId) || [];
  const rawHarvests = data.harvests.filter(h => h.cropId === cropId) || [];

  const isLongTerm = crop.harvestType === 'longterm';

  const cropExpenses = isLongTerm && selectedYear !== 'all'
    ? rawExpenses.filter(e => e.date.startsWith(selectedYear))
    : rawExpenses;

  const cropHarvests = isLongTerm && selectedYear !== 'all'
    ? rawHarvests.filter(h => h.date.startsWith(selectedYear))
    : rawHarvests;

  const totalExpense = cropExpenses.reduce((sum, e) => sum + (Number(e.cost) || 0), 0);



  const getFilterYears = () => {
    const years = new Set();
    rawExpenses.forEach(e => {
      if (e.date) {
        const y = e.date.substring(0, 4);
        if (y.match(/^\d{4}$/)) years.add(y);
      }
    });
    rawHarvests.forEach(h => {
      if (h.date) {
        const y = h.date.substring(0, 4);
        if (y.match(/^\d{4}$/)) years.add(y);
      }
    });
    return Array.from(years).sort().reverse();
  };
  const filterYears = getFilterYears();

  const formatCurrency = (val) => {
    return `${t('dashboard.currency_symbol')}${Number(val).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

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

  const expenseByCategory = cropExpenses.reduce((acc, exp) => {
    const stage = exp.stage || 'misc';
    acc[stage] = (acc[stage] || 0) + (Number(exp.cost) || 0);
    return acc;
  }, {});

  const pieData = Object.keys(expenseByCategory).map(key => ({
    name: getStageLabel(key),
    value: expenseByCategory[key]
  })).filter(item => item.value > 0);

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#64748b'];
  const renderExpenseDetails = (exp) => {
    if (!exp.details) return null;
    
    switch (exp.stage) {
      case 'land_prep':
        return exp.details.tractorRentalOrFuel 
          ? `${t('common.tractor_fuel')}: ${t('dashboard.currency_symbol')}${exp.details.tractorRentalOrFuel}` 
          : null;
      case 'seeds':
        return (
          <span>
            {exp.details.seedName && <strong className="text-emerald-700 font-semibold">{exp.details.seedName} </strong>}
            ({exp.details.quantity || 0} {t('common.pcs')}) • {t('common.cost_label')}: {t('dashboard.currency_symbol')}{exp.details.seedTotalCost || 0} ({t('dashboard.currency_symbol')}{exp.details.seedPerPiece || 0}/{t('common.pcs')}) • {t('common.transport_label')}: {t('dashboard.currency_symbol')}{exp.details.transportCost || 0}
          </span>
        );
      case 'sowing_labor':
        const laborParts = [];
        if (Number(exp.details.laborCost) > 0 || Number(exp.details.numLaborers) > 0) {
          const wagePerWorker = exp.details.costPerLaborer
            ? exp.details.costPerLaborer
            : exp.details.numLaborers && exp.details.laborCost
              ? (exp.details.laborCost / exp.details.numLaborers).toFixed(0)
              : '0';
          laborParts.push(`${exp.details.numLaborers || 0} ${t('common.laborers_label')} (Wages: ${t('dashboard.currency_symbol')}${exp.details.laborCost || 0} @ ${t('dashboard.currency_symbol')}${wagePerWorker}/each)`);
        }
        if (Number(exp.details.machineryCost) > 0) {
          const machName = exp.details.machineryType || 'Machinery';
          laborParts.push(`${machName}: ${t('dashboard.currency_symbol')}${exp.details.machineryCost}`);
        }
        return laborParts.length > 0 ? laborParts.join(' • ') : 'Sowing details';
      case 'pesticides':
        const sprayUnitCost = exp.details.tanks && exp.details.pricePerTank
          ? (exp.details.pricePerTank / exp.details.tanks).toFixed(2)
          : '0';
        return (
          <span>
            {exp.details.chemicalName && <strong>{exp.details.chemicalName} </strong>}
            {exp.details.purchaseCost > 0 && (
              <span>
                • Purchase: {exp.details.quantity || 0} unit(s) @ {t('dashboard.currency_symbol')}{exp.details.pricePerUnit || 0} (Total: {t('dashboard.currency_symbol')}{exp.details.purchaseCost})
              </span>
            )}
            {exp.details.pricePerTank > 0 && (
              <span>
                • Spraying: {t('dashboard.currency_symbol')}{exp.details.pricePerTank} ({exp.details.tanks || 0} tanks @ {t('dashboard.currency_symbol')}{sprayUnitCost}/tank)
              </span>
            )}
          </span>
        );
      case 'fertilizers':
        return (
          <span>
            {exp.details.fertilizerName && <strong>{exp.details.fertilizerName} </strong>}
            • {t('common.qty_label')}: {exp.details.quantity || 0} ({exp.details.usageRate || 0})
          </span>
        );
      case 'manual_labor':
        return `${exp.details.workType || t('common.weeding')} • ${exp.details.numLaborers || 0} ${t('common.workers_x')} ${exp.details.workdays || 0} ${t('common.days_at')} ${t('dashboard.currency_symbol')}${exp.details.costPerWorkerPerDay || 0}/${t('common.day')}`;
      case 'misc':
      default:
        return null;
    }
  };

  const handleDeleteCropClick = () => {
    if (window.confirm("Are you sure you want to delete this entire crop cycle? This will delete all logged expenses and harvest information for this crop.")) {
      onDeleteCrop(cropId);
    }
  };

  return (
    <div className="flex-1 px-4 py-6 sm:px-6 max-w-2xl mx-auto w-full space-y-6">
      
      {/* Back navigation */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-emerald-700 transition-all cursor-pointer hover-scale hover-scale-active"
        >
          <ArrowLeft size={16} />
          {t('common.back_to_dashboard')}
        </button>
        <button
          onClick={handleDeleteCropClick}
          className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-all cursor-pointer hover-scale hover-scale-active border border-rose-205"
        >
          <Trash2 size={13} />
          {t('common.btn_delete_crop')}
        </button>
      </div>

      {/* Crop Header details */}
      <div className="glass-card rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 text-left">
        <div className="flex justify-between items-start">
          <div>
            <span className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-full border mb-2 mr-1.5 ${
              crop.status === 'active' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-250' 
                : 'bg-slate-100 text-slate-600 border-slate-250'
            }`}>
              {crop.status === 'active' ? t('dashboard.status_active') : t('dashboard.status_harvested')}
            </span>
            <span className="inline-block px-2.5 py-0.5 text-xs font-bold rounded-full border bg-slate-50 text-slate-655 border-slate-200 mb-2">
              {crop.harvestType === 'single' ? 'One-Time Harvest' : crop.harvestType === 'multiple' ? 'Multiple Harvests' : 'Long-Term Continuous'}
            </span>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-extrabold text-2xl text-slate-800 tracking-tight m-0">
                {crop.cropName}
              </h2>
              <button
                onClick={() => onEditCrop(crop)}
                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                title={t('common.edit')}
              >
                <Pencil size={14} />
              </button>
            </div>
          </div>
          <div className="w-12 h-12 bg-emerald-100 text-emerald-800 flex items-center justify-center rounded-xl font-display font-black text-xl">
            {crop.cropName.substring(0, 2).toUpperCase()}
          </div>
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-3 gap-2 pt-2 text-slate-500 border-t border-slate-100">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">{t('crop_form.field_alias')}</span>
            <span className="text-sm font-semibold text-slate-700 mt-0.5 flex items-center gap-1">
              <MapPin size={12} className="text-slate-400" /> {crop.fieldAlias}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">{t('dashboard.area')}</span>
            <span className="text-sm font-semibold text-slate-700 mt-0.5 flex items-center gap-1">
              <Layers size={12} className="text-slate-400" /> {crop.landArea} {t('common.acres_abbreviation')}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">{t('crop_form.sowing_date')}</span>
            <span className="text-sm font-semibold text-slate-700 mt-0.5 flex items-center gap-1">
              <Calendar size={12} className="text-slate-400" /> {crop.sowingDate}
            </span>
          </div>
        </div>
      </div>


      {/* Long-Term Year Filter Dropdown */}
      {isLongTerm && filterYears.length > 0 && (
        <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm text-left">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filter Timeline</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          >
            <option value="all">All Years</option>
            {filterYears.map(yr => (
              <option key={yr} value={yr}>Year {yr}</option>
            ))}
          </select>
        </div>
      )}

      {/* Harvest Logs List Section */}
      <div className="text-left space-y-3">
        <h3 className="text-sm font-semibold text-slate-505 text-slate-500 uppercase tracking-wider flex items-center gap-1">
          <Grape size={15} className="text-emerald-500" /> Harvest Records ({cropHarvests.length})
        </h3>

        {cropHarvests.length === 0 ? (
          <div className="rounded-xl border border-slate-200 border-dashed bg-white p-6 text-center text-slate-400 italic text-xs">
            No harvests logged for this cycle yet.
          </div>
        ) : (
          <div className="space-y-2">
            {cropHarvests
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((harv) => (
                <div 
                  key={harv.id}
                  className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex justify-between items-center"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Grape size={15} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-750 text-slate-750 text-slate-700 text-xs leading-none">
                        Yield: {harv.yieldQty} {t(`harvest_form.unit_${harv.yieldUnit}`)}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {harv.date} {harv.pricePerUnit ? `• Price: ${formatCurrency(harv.pricePerUnit)} / unit` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display font-bold text-slate-800 text-xs sm:text-sm">
                      {formatCurrency(harv.revenue)}
                    </span>
                    <button
                      onClick={() => onEditHarvest(harv)}
                      className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-all cursor-pointer"
                      title={t('common.edit')}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete this harvest log?")) {
                          onDeleteHarvest(harv.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                      title={t('common.delete')}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Action Buttons for Active Crops */}
      {crop.status === 'active' && (
        <div className="flex flex-col gap-2.5">
          <div className="flex gap-3">
            <button
              onClick={() => {
                setSelectedCropId(cropId);
                onNavigate('expense_form');
              }}
              className="flex-1 py-3 px-4 rounded-xl border border-dashed border-amber-300 bg-amber-50/20 text-amber-850 hover:bg-amber-50 hover-scale hover-scale-active shadow-sm transition-all flex items-center justify-center gap-1.5 font-semibold text-xs cursor-pointer"
            >
              <Plus size={15} />
              {t('common.btn_add_expense')}
            </button>
            <button
              onClick={() => {
                setSelectedCropId(cropId);
                onNavigate('harvest_form');
              }}
              className="flex-1 py-3 px-4 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/20 text-emerald-850 hover:bg-emerald-50 hover-scale hover-scale-active shadow-sm transition-all flex items-center justify-center gap-1.5 font-semibold text-xs cursor-pointer"
            >
              <Grape size={15} />
              {t('common.btn_log_harvest')}
            </button>
          </div>

          {crop.harvestType !== 'single' && (
            <button
              onClick={() => setIsConcludeModalOpen(true)}
              className="w-full py-3 px-4 rounded-xl bg-slate-800 text-white hover:bg-slate-900 hover-scale hover-scale-active shadow-md transition-all flex items-center justify-center gap-1.5 font-bold text-xs cursor-pointer"
            >
              <CalendarCheck size={15} /> Conclude Crop Cycle
            </button>
          )}
        </div>
      )}

      {/* Expense Logs Section */}
      <div className="text-left space-y-3">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
          <Receipt size={15} /> {t('common.operational_expenses')}
        </h3>

        {cropExpenses.length === 0 ? (
          <div className="rounded-xl border border-slate-200 border-dashed bg-white p-6 text-center text-slate-500 text-xs">
            {t('common.no_expenses_logged')}
          </div>
        ) : (
          <div className="space-y-2">
            {cropExpenses
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((exp) => (
                <div 
                  key={exp.id}
                  className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex justify-between items-center"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Receipt size={15} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-700 text-xs leading-none">
                        {getStageLabel(exp.stage)}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {exp.date} {exp.notes ? `• ${exp.notes}` : ''}
                      </p>
                      {exp.details && renderExpenseDetails(exp) && (
                        <p className="text-[10px] text-slate-600 font-medium leading-relaxed bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5 mt-1 block w-fit">
                          {renderExpenseDetails(exp)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display font-bold text-slate-800 text-xs sm:text-sm">
                      {formatCurrency(exp.cost)}
                    </span>
                    <button
                      onClick={() => onEditExpense(exp)}
                      className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-all cursor-pointer"
                      title={t('common.edit')}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete this expense log?")) {
                          onDeleteExpense(exp.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                      title={t('common.delete')}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Expense Breakdown Card (Financial Analytics) */}
      <div className="glass-card rounded-2xl p-5 border border-slate-200 shadow-sm text-left">
        <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-1.5 mb-4">
          <PieIcon size={16} className="text-emerald-500" />
          {t('analytics.expense_breakdown')}
        </h3>

        {pieData.length === 0 ? (
          <div className="h-32 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs italic">
            {t('crop_details.no_expenses')}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
            {/* Chart */}
            <div className="w-36 h-36 relative flex items-center justify-center shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={58}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                </RechartsPieChart>
              </ResponsiveContainer>

              {/* Total Spent Center Badge */}
              <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-none">{t('crop_details.total_label')}</span>
                <span className="text-xs font-extrabold text-slate-800 font-display mt-0.5 leading-none">
                  {formatCurrency(totalExpense)}
                </span>
              </div>
            </div>

            {/* Legends & Details */}
            <div className="flex-1 space-y-2 w-full">
              {pieData.map((item, index) => {
                const percent = totalExpense > 0 ? ((item.value / totalExpense) * 100).toFixed(0) : 0;
                return (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-slate-600 font-medium">{item.name}</span>
                    </div>
                    <div className="text-right font-semibold text-slate-800 flex items-center gap-2">
                      <span>{formatCurrency(item.value)}</span>
                      <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">
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

      {/* Conclude Crop Cycle Modal */}
      {isConcludeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl text-left space-y-4 animate-scale-in">
            <div className="flex items-center gap-2 text-slate-800">
              <span className="text-xl">🚜</span>
              <h3 className="font-display font-extrabold text-sm tracking-tight m-0">
                Conclude Crop Cycle
              </h3>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to conclude the crop cycle for <strong>{crop.cropName}</strong>? Once concluded, it will be marked as finished.
            </p>

            <form onSubmit={(e) => {
              e.preventDefault();
              onConcludeCrop(crop.id, conclusionDate);
              setIsConcludeModalOpen(false);
            }} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Conclusion Date
                </label>
                <input
                  type="date"
                  required
                  value={conclusionDate}
                  onChange={(e) => setConclusionDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm shadow-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConcludeModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-655 font-semibold text-xs transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-all cursor-pointer text-center shadow-md shadow-slate-100"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

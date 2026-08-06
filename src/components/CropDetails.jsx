import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Trash2, Calendar, MapPin, Layers, Receipt, Plus, Grape, Pencil } from 'lucide-react';

export default function CropDetails({ 
  cropId, 
  data, 
  onBack, 
  onDeleteCrop, 
  onDeleteExpense, 
  onNavigate, 
  setSelectedCropId,
  onEditCrop,
  onEditExpense,
  onEditHarvest
}) {
  const { t } = useTranslation();

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

  const cropExpenses = data.expenses.filter(e => e.cropId === cropId) || [];
  const cropHarvest = data.harvests.find(h => h.cropId === cropId);

  const totalExpense = cropExpenses.reduce((sum, e) => sum + (Number(e.cost) || 0), 0);
  const revenue = cropHarvest ? Number(cropHarvest.revenue) || 0 : 0;
  const profit = revenue - totalExpense;

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
            <span className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-full border mb-2 ${
              crop.status === 'active' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-250' 
                : 'bg-slate-100 text-slate-600 border-slate-250'
            }`}>
              {crop.status === 'active' ? t('dashboard.status_active') : t('dashboard.status_harvested')}
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

      {/* Financial Summary card */}
      <div className="grid grid-cols-3 gap-2">
        <div className="glass-card rounded-xl p-3 text-center border border-slate-100 shadow-sm">
          <p className="text-[10px] text-slate-400 uppercase font-bold">{t('dashboard.total_investment')}</p>
          <p className="font-display font-bold text-slate-700 mt-0.5">{formatCurrency(totalExpense)}</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center border border-slate-100 shadow-sm">
          <p className="text-[10px] text-slate-400 uppercase font-bold">{t('dashboard.total_revenue')}</p>
          <p className="font-display font-bold text-slate-700 mt-0.5">{formatCurrency(revenue)}</p>
        </div>
        <div className={`glass-card rounded-xl p-3 text-center border shadow-sm ${
          !cropHarvest ? 'border-slate-100 opacity-60' : profit >= 0 ? 'border-emerald-200 bg-emerald-50/20' : 'border-rose-200 bg-rose-50/20'
        }`}>
          <p className="text-[10px] text-slate-400 uppercase font-bold">
            {profit >= 0 ? t('dashboard.net_profit') : t('dashboard.net_loss')}
          </p>
          <p className={`font-display font-bold mt-0.5 ${
            !cropHarvest ? 'text-slate-500' : profit >= 0 ? 'text-emerald-600' : 'text-rose-600'
          }`}>
            {cropHarvest ? formatCurrency(Math.abs(profit)) : '--'}
          </p>
        </div>
      </div>

      {/* Harvest Information details */}
      {cropHarvest && (
        <div className="glass-card rounded-xl p-4 border border-slate-200 shadow-sm text-left space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-1">
              <Grape size={16} className="text-emerald-500" /> {t('common.harvest_details')}
            </h3>
            <button
              onClick={() => onEditHarvest(cropHarvest)}
              className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-slate-50 rounded transition-all cursor-pointer flex items-center gap-1 text-[10px] font-semibold"
              title="Edit Harvest Details"
            >
              <Pencil size={12} />
              {t('common.edit')}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-slate-400 font-semibold">{t('harvest_form.yield_qty')}</p>
              <p className="font-bold text-slate-700 mt-0.5">
                {cropHarvest.yieldQty} {t(`harvest_form.unit_${cropHarvest.yieldUnit}`)}
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold">{t('harvest_form.price_per_unit')}</p>
              <p className="font-bold text-slate-700 mt-0.5">{formatCurrency(cropHarvest.pricePerUnit)}</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold">{t('harvest_form.revenue')}</p>
              <p className="font-bold text-slate-700 mt-0.5">{formatCurrency(cropHarvest.revenue)}</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold">{t('harvest_form.date')}</p>
              <p className="font-bold text-slate-700 mt-0.5">{cropHarvest.date}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons for Active Crops */}
      {crop.status === 'active' && (
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

    </div>
  );
}

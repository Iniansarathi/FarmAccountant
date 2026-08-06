import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Grape, CheckSquare, X } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function HarvestForm({ crops, defaultCropId, onSave, onCancel, editingHarvest }) {
  const { t } = useTranslation();

  const [cropId, setCropId] = useState(editingHarvest ? editingHarvest.cropId : (defaultCropId || ''));
  const [yieldQty, setYieldQty] = useState(editingHarvest ? editingHarvest.yieldQty.toString() : '');
  const [yieldUnit, setYieldUnit] = useState(editingHarvest ? editingHarvest.yieldUnit : 'quintals');
  const [pricePerUnit, setPricePerUnit] = useState(editingHarvest ? editingHarvest.pricePerUnit.toString() : '');
  const [revenue, setRevenue] = useState(editingHarvest ? editingHarvest.revenue.toString() : '');
  const [date, setDate] = useState(editingHarvest ? editingHarvest.date : new Date().toISOString().split('T')[0]);

  const activeCrops = crops.filter(c => c.status === 'active');
  const editCrop = editingHarvest ? crops.find(c => c.id === editingHarvest.cropId) : null;
  const selectCropsList = [...activeCrops];
  if (editCrop && !selectCropsList.some(c => c.id === editCrop.id)) {
    selectCropsList.push(editCrop);
  }

  // Auto-calculate revenue
  useEffect(() => {
    if (yieldQty && pricePerUnit) {
      const calculatedRevenue = Number(yieldQty) * Number(pricePerUnit);
      setRevenue(calculatedRevenue.toString());
    }
  }, [yieldQty, pricePerUnit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!cropId) {
      alert("Please select a crop cycle.");
      return;
    }
    if (!yieldQty || Number(yieldQty) <= 0) {
      alert("Please enter a valid yield quantity.");
      return;
    }
    if (!revenue || Number(revenue) <= 0) {
      alert("Please enter a valid revenue value.");
      return;
    }

    // Trigger confetti celebration only if creating a new harvest!
    if (!editingHarvest) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    onSave({
      id: editingHarvest?.id, // will be undefined for new harvests
      cropId,
      yieldQty: parseFloat(yieldQty),
      yieldUnit,
      pricePerUnit: parseFloat(pricePerUnit) || 0,
      revenue: parseFloat(revenue),
      date
    });
  };

  const getDisabledReason = () => {
    if (!editingHarvest && activeCrops.length === 0) {
      return "You do not have any active Crop Cycles. Please go to the Crops tab on the bottom menu to register a new crop cycle first.";
    }
    if (!cropId) {
      return "Please select a Crop Cycle from the dropdown above to enable saving.";
    }
    if (!yieldQty || Number(yieldQty) <= 0) {
      return "Please enter a valid Harvest Yield Quantity to enable saving.";
    }
    if (!revenue || Number(revenue) <= 0) {
      return "Please enter a valid Total Revenue amount to enable saving.";
    }
    return null;
  };

  return (
    <div className="flex-1 px-4 py-6 sm:px-6 max-w-md mx-auto w-full">
      <div className="glass-card rounded-2xl border border-slate-200 p-6 shadow-md">
        
        {/* Form Title */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-2 text-sky-850 text-emerald-800">
            <Grape size={24} className="text-emerald-500 animate-pulse" />
            <h2 className="font-display font-bold text-lg m-0">
              {editingHarvest ? t('harvest_form.title_edit') : t('harvest_form.title')}
            </h2>
          </div>
          <button 
            type="button" 
            onClick={onCancel}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          
          {/* Crop Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {t('harvest_form.select_crop')} *
            </label>
            <select
              value={cropId}
              required
              disabled={!!editingHarvest} // lock crop cycle choice in edit mode
              onChange={(e) => setCropId(e.target.value)}
              className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm shadow-sm transition-all disabled:bg-slate-50 disabled:text-slate-500"
            >
              <option value="" disabled>{t('harvest_form.select_crop')}</option>
              {selectCropsList.map(c => (
                <option key={c.id} value={c.id}>
                  {c.cropName} ({c.fieldAlias}) - {c.landArea} Ac
                </option>
              ))}
            </select>
            {activeCrops.length === 0 && (
              <p className="text-xs text-rose-500 mt-1 font-semibold">
                No active crops found. Please start a crop cycle first!
              </p>
            )}
          </div>

          {/* Yield Quantity & Unit */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                {t('harvest_form.yield_qty')} *
              </label>
              <input
                type="number"
                step="0.01"
                required
                min="0.01"
                value={yieldQty}
                onChange={(e) => setYieldQty(e.target.value)}
                placeholder="e.g. 15.5"
                className="w-full px-3 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm shadow-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                {t('harvest_form.yield_unit')}
              </label>
              <select
                value={yieldUnit}
                onChange={(e) => setYieldUnit(e.target.value)}
                className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm shadow-sm transition-all cursor-pointer"
              >
                <option value="quintals">{t('harvest_form.unit_quintals')}</option>
                <option value="tons">{t('harvest_form.unit_tons')}</option>
                <option value="bags">{t('harvest_form.unit_bags')}</option>
                <option value="kg">{t('harvest_form.unit_kg')}</option>
              </select>
            </div>
          </div>

          {/* Price per unit */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {t('harvest_form.price_per_unit')}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-slate-400 font-bold text-sm">₹</span>
              <input
                type="number"
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(e.target.value)}
                placeholder="e.g. 2100"
                className="w-full pl-8 pr-3 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm shadow-sm transition-all"
              />
            </div>
          </div>

          {/* Total Revenue */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {t('harvest_form.revenue')} *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-slate-550 font-bold text-sm">₹</span>
              <input
                type="number"
                required
                min="1"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                placeholder="e.g. 32550"
                className="w-full pl-8 pr-3 py-3 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm shadow-sm transition-all"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {t('harvest_form.date')} *
            </label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm shadow-sm transition-all"
              />
            </div>
          </div>

          {/* Validation Warning Callout */}
          {getDisabledReason() && (
            <div className="bg-amber-50 border border-amber-250 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-1.5 font-medium leading-relaxed border-amber-200">
              <span>⚠️</span>
              <span>{getDisabledReason()}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-semibold text-sm hover-scale hover-scale-active cursor-pointer transition-all text-center shadow-sm"
            >
              {t('harvest_form.btn_cancel')}
            </button>
            <button
              type="submit"
              disabled={!!getDisabledReason()}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm hover-scale hover-scale-active cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckSquare size={16} />
              {editingHarvest ? t('harvest_form.btn_save_changes') : t('harvest_form.btn_submit')}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sprout, MapPin, Calendar, Layers, X, Save } from 'lucide-react';

export default function CropForm({ onSave, onCancel, editingCrop }) {
  const { t } = useTranslation();
  const [cropName, setCropName] = useState(editingCrop ? editingCrop.cropName : '');
  const [fieldAlias, setFieldAlias] = useState(editingCrop ? editingCrop.fieldAlias : '');
  const [landArea, setLandArea] = useState(editingCrop ? editingCrop.landArea.toString() : '');
  const [sowingDate, setSowingDate] = useState(editingCrop ? editingCrop.sowingDate : new Date().toISOString().split('T')[0]);
  const [harvestType, setHarvestType] = useState(editingCrop ? (editingCrop.harvestType || 'single') : 'single');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!cropName || !fieldAlias || !landArea || !sowingDate) {
      alert("Please fill in all required fields.");
      return;
    }
    onSave({
      id: editingCrop?.id,
      cropName,
      fieldAlias,
      landArea: parseFloat(landArea),
      sowingDate,
      harvestType,
      status: editingCrop ? editingCrop.status : 'active'
    });
  };

  return (
    <div className="flex-1 px-4 py-6 sm:px-6 max-w-md mx-auto w-full">
      <div className="glass-card rounded-2xl border border-slate-200 p-6 shadow-md">
        
        {/* Form Title */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-2 text-emerald-800">
            <Sprout size={24} className="text-emerald-600" />
            <h2 className="font-display font-bold text-lg m-0">
              {editingCrop ? t('crop_form.title_edit') : t('crop_form.title_new')}
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

        {/* Form Input fields */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          
          {/* Crop Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {t('crop_form.crop_name')} *
            </label>
            <div className="relative">
              <Sprout size={16} className="absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                required
                value={cropName}
                onChange={(e) => setCropName(e.target.value)}
                placeholder={t('crop_form.crop_placeholder')}
                className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm shadow-sm transition-all"
              />
            </div>
          </div>

          {/* Field Name / Alias */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {t('crop_form.field_alias')} *
            </label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                required
                value={fieldAlias}
                onChange={(e) => setFieldAlias(e.target.value)}
                placeholder={t('crop_form.field_placeholder')}
                className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm shadow-sm transition-all"
              />
            </div>
          </div>

          {/* Land Area */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {t('crop_form.land_area')} *
            </label>
            <div className="relative">
              <Layers size={16} className="absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
              <input
                type="number"
                step="0.01"
                required
                min="0.01"
                value={landArea}
                onChange={(e) => setLandArea(e.target.value)}
                placeholder={t('crop_form.area_placeholder')}
                className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm shadow-sm transition-all"
              />
            </div>
          </div>

          {/* Sowing Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {t('crop_form.sowing_date')} *
            </label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
              <input
                type="date"
                required
                value={sowingDate}
                onChange={(e) => setSowingDate(e.target.value)}
                className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm shadow-sm transition-all"
              />
            </div>
          </div>

          {/* Harvest Type Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Harvest Scheme *
            </label>
            <div className="space-y-2">
              <label className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                harvestType === 'single' ? 'border-[#0C9D61] bg-emerald-50/20' : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="harvestType"
                  value="single"
                  checked={harvestType === 'single'}
                  onChange={() => setHarvestType('single')}
                  className="mt-1 text-[#0C9D61] focus:ring-emerald-500"
                />
                <div className="text-xs">
                  <span className="block font-bold text-slate-700">One-Time Harvest</span>
                  <span className="block text-slate-400 font-semibold mt-0.5">Crop cycle automatically concludes after logging the first harvest (e.g. Groundnut, Paddy).</span>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                harvestType === 'multiple' ? 'border-[#0C9D61] bg-emerald-50/20' : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="harvestType"
                  value="multiple"
                  checked={harvestType === 'multiple'}
                  onChange={() => setHarvestType('multiple')}
                  className="mt-1 text-[#0C9D61] focus:ring-emerald-500"
                />
                <div className="text-xs">
                  <span className="block font-bold text-slate-700">Multiple Harvests</span>
                  <span className="block text-slate-400 font-semibold mt-0.5">Harvest repeatedly; the cycle stays active until you manually conclude it (e.g. Banana, Tomato).</span>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                harvestType === 'longterm' ? 'border-[#0C9D61] bg-emerald-50/20' : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="harvestType"
                  value="longterm"
                  checked={harvestType === 'longterm'}
                  onChange={() => setHarvestType('longterm')}
                  className="mt-1 text-[#0C9D61] focus:ring-emerald-500"
                />
                <div className="text-xs">
                  <span className="block font-bold text-slate-700">Long-Term Continuous</span>
                  <span className="block text-slate-400 font-semibold mt-0.5">Runs continuously for years (e.g. Coconut, Jasmine). Maintenance cost and yield are filtered by year.</span>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-semibold text-sm hover-scale hover-scale-active cursor-pointer transition-all text-center shadow-sm"
            >
              {t('crop_form.btn_cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm hover-scale hover-scale-active cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-100"
            >
              <Save size={16} />
              {editingCrop ? t('crop_form.btn_save_changes') : t('crop_form.btn_save')}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

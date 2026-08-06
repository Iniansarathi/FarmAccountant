import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sprout, MapPin, Calendar, Layers, X, Save } from 'lucide-react';

export default function CropForm({ onSave, onCancel, editingCrop }) {
  const { t } = useTranslation();
  const [cropName, setCropName] = useState(editingCrop ? editingCrop.cropName : '');
  const [fieldAlias, setFieldAlias] = useState(editingCrop ? editingCrop.fieldAlias : '');
  const [landArea, setLandArea] = useState(editingCrop ? editingCrop.landArea.toString() : '');
  const [sowingDate, setSowingDate] = useState(editingCrop ? editingCrop.sowingDate : new Date().toISOString().split('T')[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!cropName || !fieldAlias || !landArea || !sowingDate) {
      alert("Please fill in all required fields.");
      return;
    }
    onSave({
      id: editingCrop?.id, // will be undefined for new crops
      cropName,
      fieldAlias,
      landArea: parseFloat(landArea),
      sowingDate,
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

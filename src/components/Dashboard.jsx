import React from 'react';
import { useTranslation } from 'react-i18next';
import { PlusCircle, Receipt, Grape, Sprout, TrendingUp, TrendingDown, Layers, MapPin } from 'lucide-react';

export default function Dashboard({ 
  data, 
  onNavigate, // navigation trigger: 'crop_form', 'expense_form', 'harvest_form', 'crop_details'
  setSelectedCropId,
  syncStatus,
  user
}) {
  const { t } = useTranslation();

  const activeCrops = data.crops.filter(c => c.status === 'active') || [];
  const harvestedCrops = data.crops.filter(c => c.status === 'harvested') || [];
  
  // Calculate stats
  // Total expenses for all crops (active + harvested)
  const totalInvestment = data.expenses.reduce((sum, exp) => sum + (Number(exp.cost) || 0), 0);
  const totalRevenue = data.harvests.reduce((sum, harv) => sum + (Number(harv.revenue) || 0), 0);
  
  // Realized investment (only concluded crop cycles)
  const concludedCropsInvestment = data.expenses
    .filter(exp => harvestedCrops.some(c => c.id === exp.cropId))
    .reduce((sum, exp) => sum + (Number(exp.cost) || 0), 0);
  
  const netProfit = totalRevenue - concludedCropsInvestment;

  // Calculate expenses per active crop for dashboard list
  const getCropExpenses = (cropId) => {
    return data.expenses
      .filter(exp => exp.cropId === cropId)
      .reduce((sum, exp) => sum + (Number(exp.cost) || 0), 0);
  };


  const formatCurrency = (val) => {
    return `${t('dashboard.currency_symbol')}${Number(val).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="flex-1 px-4 py-6 sm:px-6 space-y-6 max-w-4xl mx-auto w-full">
      
      {/* Google Drive Access Warning Callout */}
      {user?.type === 'google' && syncStatus === 'error' && (
        <div className="bg-amber-50 border border-amber-250 rounded-2xl p-5 text-sm text-amber-800 flex items-start gap-3.5 shadow-sm leading-relaxed border-amber-200 animate-pulse">
          <span className="text-xl shrink-0">⚠️</span>
          <div>
            <h4 className="font-bold text-amber-900 mb-0.5">Google Drive Sync Restricted</h4>
            <p className="text-xs text-amber-800">
              The application is running in local offline mode. This happens because Google Drive access permissions were not granted during sign-in. Your changes are saved safely to this browser's cache, but will <strong>not</strong> sync or back up to your Google account.
            </p>
            <p className="text-xs text-amber-800 font-semibold mt-2">
              How to fix this:
            </p>
            <ul className="list-disc list-inside text-xs text-amber-700 mt-1 space-y-1 ml-1">
              <li>Click the profile icon in the top-right and select <strong>Logout</strong>.</li>
              <li>Click <strong>Sign in with Google</strong> again.</li>
              <li>When the Google permission popup opens, make sure to <strong>CHECK/TICK</strong> the box allowing the app to view and manage its own files on Google Drive.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 to-emerald-600 text-white p-6 shadow-md">
        <div className="absolute right-0 bottom-0 opacity-10 translate-y-4 translate-x-4">
          <Sprout size={180} />
        </div>
        <div className="relative z-10">
          <p className="text-emerald-100 text-xs font-semibold tracking-wider uppercase">{t('app_subtitle')}</p>
          <h2 className="font-display font-bold text-2xl mt-1 tracking-tight">
            {activeCrops.length > 0 
              ? `Tracking ${activeCrops.length} Active Crop Cycles` 
              : "Welcome to farmaccountant"}
          </h2>
          <p className="text-emerald-50 text-xs mt-2 max-w-md">
            Manage your field operations, input investments, and harvest sales in one secure, regional language platform.
          </p>
        </div>
      </div>

      {/* Visual Analytics / Stats Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Active Crops Stat */}
        <div className="glass-card rounded-xl p-4 flex flex-col justify-between shadow-sm border border-slate-100">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">{t('dashboard.active_crops')}</span>
            <Layers size={18} className="text-emerald-600" />
          </div>
          <div className="mt-3">
            <span className="font-display font-extrabold text-2xl text-slate-800 leading-none">
              {activeCrops.length}
            </span>
          </div>
        </div>

        {/* Total Investment Stat */}
        <div className="glass-card rounded-xl p-4 flex flex-col justify-between shadow-sm border border-slate-100">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">{t('dashboard.total_investment')}</span>
            <Receipt size={18} className="text-amber-500" />
          </div>
          <div className="mt-3">
            <span className="font-display font-extrabold text-2xl text-slate-800 leading-none">
              {formatCurrency(totalInvestment)}
            </span>
          </div>
        </div>

        {/* Total Revenue Stat */}
        <div className="glass-card rounded-xl p-4 flex flex-col justify-between shadow-sm border border-slate-100">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">{t('dashboard.total_revenue')}</span>
            <TrendingUp size={18} className="text-emerald-500" />
          </div>
          <div className="mt-3">
            <span className="font-display font-extrabold text-2xl text-slate-800 leading-none">
              {formatCurrency(totalRevenue)}
            </span>
          </div>
        </div>

        {/* Net Profit/Loss Stat */}
        <div className={`glass-card rounded-xl p-4 flex flex-col justify-between shadow-sm border border-slate-100 ${
          netProfit >= 0 ? 'bg-gradient-to-br from-emerald-50/40 to-white' : 'bg-gradient-to-br from-rose-50/40 to-white'
        }`}>
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">{netProfit >= 0 ? t('dashboard.net_profit') : t('dashboard.net_loss')}</span>
            {netProfit >= 0 
              ? <TrendingUp size={18} className="text-emerald-600" /> 
              : <TrendingDown size={18} className="text-rose-500" />}
          </div>
          <div className="mt-3">
            <span className={`font-display font-extrabold text-2xl leading-none ${
              netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {formatCurrency(Math.abs(netProfit))}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Large Buttons */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          {t('dashboard.quick_actions')}
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => onNavigate('crop_form')}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/30 text-emerald-800 hover:bg-emerald-50 hover-scale hover-scale-active shadow-sm transition-all cursor-pointer text-center h-24"
          >
            <PlusCircle size={22} className="mb-2 text-emerald-600" />
            <span className="text-xs font-semibold leading-tight">{t('dashboard.add_crop')}</span>
          </button>

          <button
            onClick={() => {
              if (activeCrops.length > 0) {
                setSelectedCropId(activeCrops[0].id);
              }
              onNavigate('expense_form');
            }}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-amber-300 bg-amber-50/30 text-amber-850 hover:bg-amber-50 hover-scale hover-scale-active shadow-sm transition-all cursor-pointer text-center h-24"
          >
            <Receipt size={22} className="mb-2 text-amber-600" />
            <span className="text-xs font-semibold leading-tight">{t('dashboard.log_expense')}</span>
          </button>

          <button
            onClick={() => {
              if (activeCrops.length > 0) {
                setSelectedCropId(activeCrops[0].id);
              }
              onNavigate('harvest_form');
            }}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-sky-300 bg-sky-50/30 text-sky-850 hover:bg-sky-55 hover-scale hover-scale-active shadow-sm transition-all cursor-pointer text-center h-24"
          >
            <Grape size={22} className="mb-2 text-sky-655" />
            <span className="text-xs font-semibold leading-tight">{t('dashboard.log_harvest')}</span>
          </button>
        </div>
      </div>

      {/* Active Crop Cycles List */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          {t('dashboard.active_crop_list')}
        </h3>
        
        {activeCrops.length === 0 ? (
          <div className="rounded-xl border border-slate-200 border-dashed bg-white p-8 text-center text-slate-500">
            <Sprout size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm">{t('dashboard.no_active_crops')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeCrops.map((crop) => {
              const cropExp = getCropExpenses(crop.id);
              const cropHarvests = data.harvests.filter(h => h.cropId === crop.id) || [];
              const revenue = cropHarvests.reduce((sum, h) => sum + (Number(h.revenue) || 0), 0);
              const profit = revenue - cropExp;
              return (
                <div 
                  key={crop.id}
                  onClick={() => {
                    setSelectedCropId(crop.id);
                    onNavigate('crop_details');
                  }}
                  className="glass-card rounded-2xl p-4 flex flex-col border border-slate-250/50 shadow-sm hover:border-emerald-350 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer hover-scale hover-scale-active bg-white space-y-3.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-display font-bold shadow-inner">
                        {crop.cropName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold text-slate-800 text-sm leading-snug">{crop.cropName}</h4>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold mt-1">
                          <MapPin size={10} className="text-slate-450" />
                          <span>{crop.fieldAlias}</span>
                          <span className="mx-1">•</span>
                          <span>{crop.landArea} Ac</span>
                          {crop.harvestType && (
                            <>
                              <span className="mx-1">•</span>
                              <span className="bg-slate-50 border border-slate-100 text-slate-655 px-1 py-0.2 rounded text-[9px] font-extrabold uppercase">
                                {crop.harvestType === 'single' ? 'One-Time' : crop.harvestType === 'multiple' ? 'Multi-Harvest' : 'Long-Term'}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="inline-block px-2.5 py-0.5 text-[9px] font-extrabold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {t('dashboard.status_active')}
                    </span>
                  </div>

                  <div className="border-t border-slate-100"></div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs pt-0.5">
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Investment</span>
                      <span className="block font-display font-bold text-slate-700">{formatCurrency(cropExp)}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Revenue</span>
                      <span className="block font-display font-bold text-slate-700">{formatCurrency(revenue)}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Net</span>
                      <span className={`block font-display font-extrabold ${
                        cropHarvests.length === 0 
                          ? 'text-slate-400' 
                          : profit >= 0 
                            ? 'text-emerald-600' 
                            : 'text-rose-600'
                      }`}>
                        {cropHarvests.length > 0 
                          ? `${profit >= 0 ? '+' : ''}${formatCurrency(profit)}` 
                          : '--'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Harvested / Closed Crop Cycles List */}
      <div className="pt-2">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          {t('dashboard.harvested_crop_list')}
        </h3>
        
        {harvestedCrops.length === 0 ? (
          <div className="rounded-xl border border-slate-200 border-dashed bg-white p-6 text-center text-slate-400 text-xs">
            <Sprout size={24} className="mx-auto text-slate-350 mb-1 opacity-50" />
            <p>No completed crop cycles recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {harvestedCrops.map((crop) => {
              const cropExp = getCropExpenses(crop.id);
              const cropHarvests = data.harvests.filter(h => h.cropId === crop.id) || [];
              const revenue = cropHarvests.reduce((sum, h) => sum + (Number(h.revenue) || 0), 0);
              const profit = revenue - cropExp;
              return (
                <div 
                  key={crop.id}
                  onClick={() => {
                    setSelectedCropId(crop.id);
                    onNavigate('crop_details');
                  }}
                  className="glass-card rounded-2xl p-4 flex flex-col border border-slate-250/50 shadow-sm hover:border-emerald-350 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer hover-scale hover-scale-active bg-white space-y-3.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-display font-bold shadow-inner">
                        {crop.cropName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold text-slate-800 text-sm leading-snug">{crop.cropName}</h4>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold mt-1">
                          <MapPin size={10} className="text-slate-450" />
                          <span>{crop.fieldAlias}</span>
                          <span className="mx-1">•</span>
                          <span>{crop.landArea} Ac</span>
                          {crop.harvestType && (
                            <>
                              <span className="mx-1">•</span>
                              <span className="bg-slate-50 border border-slate-100 text-slate-655 px-1 py-0.2 rounded text-[9px] font-extrabold uppercase">
                                {crop.harvestType === 'single' ? 'One-Time' : crop.harvestType === 'multiple' ? 'Multi-Harvest' : 'Long-Term'}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="inline-block px-2.5 py-0.5 text-[9px] font-extrabold rounded-full bg-slate-100 text-slate-600 border border-slate-205">
                      {t('dashboard.status_harvested')}
                    </span>
                  </div>

                  <div className="border-t border-slate-100"></div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs pt-0.5">
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Investment</span>
                      <span className="block font-display font-bold text-slate-700">{formatCurrency(cropExp)}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Revenue</span>
                      <span className="block font-display font-bold text-slate-700">{formatCurrency(revenue)}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Net</span>
                      <span className={`block font-display font-extrabold ${
                        cropHarvests.length === 0 
                          ? 'text-slate-400' 
                          : profit >= 0 
                            ? 'text-emerald-600' 
                            : 'text-rose-600'
                      }`}>
                        {cropHarvests.length > 0 
                          ? `${profit >= 0 ? '+' : ''}${formatCurrency(profit)}` 
                          : '--'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

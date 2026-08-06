import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Receipt, Info, X } from 'lucide-react';

export default function ExpenseForm({ crops, defaultCropId, onSave, onCancel, editingExpense }) {
  const { t } = useTranslation();

  const [cropId, setCropId] = useState(editingExpense ? editingExpense.cropId : (defaultCropId || ''));
  const [stage, setStage] = useState(editingExpense ? editingExpense.stage : 'land_prep');
  const [date, setDate] = useState(editingExpense ? editingExpense.date : new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(editingExpense ? editingExpense.notes : '');
  const [cost, setCost] = useState(editingExpense ? editingExpense.cost.toString() : '');

  // Detailed fields per stage
  const [tractorRental, setTractorRental] = useState(editingExpense?.stage === 'land_prep' ? (editingExpense.details.tractorRentalOrFuel?.toString() || '') : '');
  
  const [seedName, setSeedName] = useState(editingExpense?.stage === 'seeds' ? (editingExpense.details.seedName || '') : '');
  const [seedDealer, setSeedDealer] = useState(editingExpense?.stage === 'seeds' ? (editingExpense.details.seedDealer || '') : '');
  const [seedQty, setSeedQty] = useState(editingExpense?.stage === 'seeds' ? (editingExpense.details.quantity?.toString() || '') : '');
  const [seedTotalCost, setSeedTotalCost] = useState(editingExpense?.stage === 'seeds' ? (editingExpense.details.seedTotalCost?.toString() || '') : '');
  const [seedPerPiece, setSeedPerPiece] = useState(editingExpense?.stage === 'seeds' ? (editingExpense.details.seedPerPiece?.toString() || '') : '');
  const [seedTransport, setSeedTransport] = useState(editingExpense?.stage === 'seeds' ? (editingExpense.details.transportCost?.toString() || '') : '');
  
  const [sowingLaborers, setSowingLaborers] = useState(editingExpense?.stage === 'sowing_labor' ? (editingExpense.details.numLaborers?.toString() || '') : '');
  const [sowingCost, setSowingCost] = useState(editingExpense?.stage === 'sowing_labor' ? (editingExpense.details.laborCost?.toString() || '') : '');
  const [sowingCostPerLaborer, setSowingCostPerLaborer] = useState(editingExpense?.stage === 'sowing_labor' ? (editingExpense.details.costPerLaborer?.toString() || '') : '');
  const [includeSowingLabor, setIncludeSowingLabor] = useState(editingExpense?.stage === 'sowing_labor' ? (Number(editingExpense.details.laborCost) > 0 || !editingExpense.details.machineryCost) : true);
  const [includeSowingMachinery, setIncludeSowingMachinery] = useState(editingExpense?.stage === 'sowing_labor' ? (Number(editingExpense.details.machineryCost) > 0) : false);
  const [sowingMachineryCost, setSowingMachineryCost] = useState(editingExpense?.stage === 'sowing_labor' ? (editingExpense.details.machineryCost?.toString() || '') : '');
  const [sowingMachineryType, setSowingMachineryType] = useState(editingExpense?.stage === 'sowing_labor' ? (editingExpense.details.machineryType || '') : '');

  const [pestName, setPestName] = useState(editingExpense?.stage === 'pesticides' ? (editingExpense.details.chemicalName || '') : '');
  const [pestQty, setPestQty] = useState(editingExpense?.stage === 'pesticides' ? (editingExpense.details.quantity?.toString() || '') : '');
  const [pestPurchaseCost, setPestPurchaseCost] = useState(editingExpense?.stage === 'pesticides' ? (editingExpense.details.purchaseCost?.toString() || '') : '');
  const [pestPricePerUnit, setPestPricePerUnit] = useState(editingExpense?.stage === 'pesticides' ? (editingExpense.details.pricePerUnit?.toString() || '') : '');
  const [pestTanks, setPestTanks] = useState(editingExpense?.stage === 'pesticides' ? (editingExpense.details.tanks?.toString() || '') : '');
  const [pestPricePerTank, setPestPricePerTank] = useState(editingExpense?.stage === 'pesticides' ? (editingExpense.details.pricePerTank?.toString() || '') : '');

  const [fertName, setFertName] = useState(editingExpense?.stage === 'fertilizers' ? (editingExpense.details.fertilizerName || '') : '');
  const [fertQty, setFertQty] = useState(editingExpense?.stage === 'fertilizers' ? (editingExpense.details.quantity?.toString() || '') : '');
  const [fertUsageRate, setFertUsageRate] = useState(editingExpense?.stage === 'fertilizers' ? (editingExpense.details.usageRate?.toString() || '') : '');
  const [fertCost, setFertCost] = useState(editingExpense?.stage === 'fertilizers' ? (editingExpense.details.fertilizerCost?.toString() || editingExpense.cost.toString() || '') : '');

  const [laborWorkType, setLaborWorkType] = useState(editingExpense?.stage === 'manual_labor' ? (editingExpense.details.workType || '') : '');
  const [laborCount, setLaborCount] = useState(editingExpense?.stage === 'manual_labor' ? (editingExpense.details.numLaborers?.toString() || '') : '');
  const [laborDays, setLaborDays] = useState(editingExpense?.stage === 'manual_labor' ? (editingExpense.details.workdays?.toString() || '') : '');
  const [laborCostPerDay, setLaborCostPerDay] = useState(editingExpense?.stage === 'manual_labor' ? (editingExpense.details.costPerWorkerPerDay?.toString() || '') : '');

  const handleSeedQtyChange = (val) => {
    setSeedQty(val);
    const q = parseFloat(val);
    if (!isNaN(q) && q > 0) {
      const p = parseFloat(seedPerPiece);
      const tVal = parseFloat(seedTotalCost);
      if (!isNaN(p)) {
        setSeedTotalCost((q * p).toFixed(0));
      } else if (!isNaN(tVal)) {
        setSeedPerPiece((tVal / q).toFixed(2));
      }
    }
  };

  const handleSeedTotalCostChange = (val) => {
    setSeedTotalCost(val);
    const tVal = parseFloat(val);
    const q = parseFloat(seedQty);
    if (!isNaN(tVal) && !isNaN(q) && q > 0) {
      setSeedPerPiece((tVal / q).toFixed(2));
    }
  };

  const handleSeedPerPieceChange = (val) => {
    setSeedPerPiece(val);
    const p = parseFloat(val);
    const q = parseFloat(seedQty);
    if (!isNaN(p) && !isNaN(q) && q > 0) {
      setSeedTotalCost((q * p).toFixed(0));
    }
  };

  const handleSowingLaborersChange = (val) => {
    setSowingLaborers(val);
    const q = parseFloat(val);
    if (!isNaN(q) && q > 0) {
      const p = parseFloat(sowingCostPerLaborer);
      const tVal = parseFloat(sowingCost);
      if (!isNaN(p)) {
        setSowingCost((q * p).toFixed(0));
      } else if (!isNaN(tVal)) {
        setSowingCostPerLaborer((tVal / q).toFixed(2));
      }
    }
  };

  const handleSowingCostChange = (val) => {
    setSowingCost(val);
    const tVal = parseFloat(val);
    const q = parseFloat(sowingLaborers);
    if (!isNaN(tVal) && !isNaN(q) && q > 0) {
      setSowingCostPerLaborer((tVal / q).toFixed(2));
    }
  };

  useEffect(() => {
    if (stage === 'sowing_labor') {
      const labor = includeSowingLabor ? (parseFloat(sowingCost) || 0) : 0;
      const machine = includeSowingMachinery ? (parseFloat(sowingMachineryCost) || 0) : 0;
      if (labor > 0 || machine > 0) {
        setCost((labor + machine).toString());
      }
    }
  }, [sowingCost, sowingMachineryCost, stage, includeSowingLabor, includeSowingMachinery]);

  const handlePestQtyChange = (val) => {
    setPestQty(val);
    const q = parseFloat(val);
    if (!isNaN(q) && q > 0) {
      const p = parseFloat(pestPricePerUnit);
      const tVal = parseFloat(pestPurchaseCost);
      if (!isNaN(p)) {
        setPestPurchaseCost((q * p).toFixed(0));
      } else if (!isNaN(tVal)) {
        setPestPricePerUnit((tVal / q).toFixed(2));
      }
    }
  };

  const handlePestPurchaseCostChange = (val) => {
    setPestPurchaseCost(val);
    const tVal = parseFloat(val);
    const q = parseFloat(pestQty);
    if (!isNaN(tVal) && !isNaN(q) && q > 0) {
      setPestPricePerUnit((tVal / q).toFixed(2));
    }
  };

  const handlePestPricePerUnitChange = (val) => {
    setPestPricePerUnit(val);
    const p = parseFloat(val);
    const q = parseFloat(pestQty);
    if (!isNaN(p) && !isNaN(q) && q > 0) {
      setPestPurchaseCost((q * p).toFixed(0));
    }
  };

  const activeCrops = crops.filter(c => c.status === 'active');
  const editCrop = editingExpense ? crops.find(c => c.id === editingExpense.cropId) : null;
  const selectCropsList = [...activeCrops];
  if (editCrop && !selectCropsList.some(c => c.id === editCrop.id)) {
    selectCropsList.push(editCrop);
  }

  // Auto-calculate costs based on detailed fields
  useEffect(() => {
    let calculatedCost = 0;
    switch (stage) {
      case 'land_prep':
        calculatedCost = Number(tractorRental) || 0;
        break;
      case 'seeds':
        calculatedCost = (Number(seedTotalCost) || 0) + (Number(seedTransport) || 0);
        break;
      case 'sowing_labor':
        calculatedCost = Number(sowingCost) || 0;
        break;
      case 'pesticides':
        calculatedCost = (Number(pestPurchaseCost) || 0) + (Number(pestPricePerTank) || 0);
        break;
      case 'fertilizers':
        calculatedCost = Number(fertCost) || 0;
        break;
      case 'manual_labor':
        calculatedCost = (Number(laborCount) || 0) * (Number(laborDays) || 0) * (Number(laborCostPerDay) || 0);
        break;
      case 'misc':
      default:
        calculatedCost = Number(cost) || 0;
        break;
    }
    if (calculatedCost > 0) {
      setCost(calculatedCost.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    stage, tractorRental, seedQty, seedTotalCost, seedTransport, sowingCost, sowingCostPerLaborer,
    pestQty, pestPurchaseCost, pestPricePerUnit, pestTanks, pestPricePerTank, fertCost, laborCount, laborDays, laborCostPerDay
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!cropId) {
      alert("Please select a crop cycle.");
      return;
    }
    if (!cost || Number(cost) <= 0) {
      alert("Please enter a valid expense cost.");
      return;
    }

    // Assemble detailed payload
    let details = {};
    switch (stage) {
      case 'land_prep':
        details = { tractorRentalOrFuel: Number(tractorRental) };
        break;
      case 'seeds':
        details = { 
          seedName, 
          seedDealer, 
          quantity: Number(seedQty) || 0, 
          transportCost: Number(seedTransport) || 0,
          seedTotalCost: Number(seedTotalCost) || 0,
          seedPerPiece: Number(seedPerPiece) || 0
        };
        break;
      case 'sowing_labor':
        details = { 
          numLaborers: includeSowingLabor ? (Number(sowingLaborers) || 0) : 0, 
          laborCost: includeSowingLabor ? (Number(sowingCost) || 0) : 0, 
          costPerLaborer: includeSowingLabor ? (Number(sowingCostPerLaborer) || 0) : 0,
          machineryCost: includeSowingMachinery ? (Number(sowingMachineryCost) || 0) : 0,
          machineryType: includeSowingMachinery ? sowingMachineryType : ''
        };
        break;
      case 'pesticides':
        details = { 
          chemicalName: pestName, 
          quantity: Number(pestQty) || 0, 
          purchaseCost: Number(pestPurchaseCost) || 0, 
          pricePerUnit: Number(pestPricePerUnit) || 0, 
          tanks: Number(pestTanks) || 0, 
          pricePerTank: Number(pestPricePerTank) || 0 
        };
        break;
      case 'fertilizers':
        details = { fertilizerName: fertName, quantity: fertQty, usageRate: fertUsageRate };
        break;
      case 'manual_labor':
        details = { workType: laborWorkType, numLaborers: Number(laborCount), workdays: Number(laborDays), costPerWorkerPerDay: Number(laborCostPerDay) };
        break;
      case 'misc':
      default:
        details = {};
        break;
    }

    onSave({
      id: editingExpense?.id, // will be undefined for new expenses
      cropId,
      stage,
      cost: parseFloat(cost),
      date,
      notes,
      details
    });
  };

  const getDisabledReason = () => {
    if (!editingExpense && activeCrops.length === 0) {
      return "You do not have any active Crop Cycles. Please go to the Crops tab on the bottom menu to register a new crop cycle first.";
    }
    if (!cropId) {
      return "Please select a Crop Cycle from the dropdown above to enable saving.";
    }
    if (!cost || Number(cost) <= 0) {
      return "Please enter a valid amount in the Total Cost field to enable saving.";
    }
    return null;
  };

  return (
    <div className="flex-1 px-4 py-6 sm:px-6 max-w-md mx-auto w-full">
      <div className="glass-card rounded-2xl border border-slate-200 p-6 shadow-md">
        
        {/* Form Title */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-2 text-amber-800">
            <Receipt size={24} className="text-amber-500 animate-pulse" />
            <h2 className="font-display font-bold text-lg m-0 text-slate-800">
              {editingExpense ? t('expense_form.title_edit') : t('expense_form.title')}
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
              {t('expense_form.select_crop')} *
            </label>
            <select
              value={cropId}
              required
              disabled={!!editingExpense}
              onChange={(e) => setCropId(e.target.value)}
              className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm shadow-sm transition-all disabled:bg-slate-50 disabled:text-slate-500"
            >
              <option value="" disabled>{t('expense_form.select_crop')}</option>
              {selectCropsList.map(c => (
                <option key={c.id} value={c.id}>
                  {c.cropName} ({c.fieldAlias}) - {c.landArea} Ac
                </option>
              ))}
            </select>
            {!editingExpense && activeCrops.length === 0 && (
              <p className="text-xs text-rose-500 mt-1 font-semibold">
                No active crops found. Please start a crop cycle first!
              </p>
            )}
          </div>

          {/* Stage / Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {t('expense_form.stage')} *
            </label>
            <select
              value={stage}
              disabled={!!editingExpense}
              onChange={(e) => setStage(e.target.value)}
              className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm shadow-sm transition-all disabled:bg-slate-50 disabled:text-slate-500"
            >
              <option value="land_prep">{t('expense_form.stage_land_prep')}</option>
              <option value="seeds">{t('expense_form.stage_seeds')}</option>
              <option value="sowing_labor">{t('expense_form.stage_sowing_labor')}</option>
              <option value="pesticides">{t('expense_form.stage_pesticides')}</option>
              <option value="fertilizers">{t('expense_form.stage_fertilizers')}</option>
              <option value="manual_labor">{t('expense_form.stage_manual_labor')}</option>
              <option value="misc">{t('expense_form.stage_misc')}</option>
            </select>
          </div>

          {/* Dynamic Stage Detailed Inputs */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Info size={12} /> Details
            </h4>
            
            {/* 1. Land Prep */}
            {stage === 'land_prep' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  {t('expense_form.details.tractor_rental')} (₹)
                </label>
                <input
                  type="number"
                  value={tractorRental}
                  onChange={(e) => setTractorRental(e.target.value)}
                  placeholder="e.g. 3500"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>
            )}

            {/* 2. Seeds */}
            {stage === 'seeds' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Seed / Crop Variety</label>
                  <input
                    type="text"
                    value={seedName}
                    onChange={(e) => setSeedName(e.target.value)}
                    placeholder="e.g. BG-II Cotton, Paddy HMT"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                </div>
                
                {/* Qty & Saplings Cost Total */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 h-8 flex items-end mb-1">Quantity (Saplings/Packets)</label>
                    <input
                      type="number"
                      value={seedQty}
                      onChange={(e) => handleSeedQtyChange(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 h-8 flex items-end mb-1">Saplings Cost (Total) (₹)</label>
                    <input
                      type="number"
                      value={seedTotalCost}
                      onChange={(e) => handleSeedTotalCostChange(e.target.value)}
                      placeholder="e.g. 10000"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                    />
                  </div>
                </div>

                {/* Per Piece & Transport Cost next to it */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 h-8 flex items-end mb-1">Cost per Piece (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={seedPerPiece}
                      onChange={(e) => handleSeedPerPieceChange(e.target.value)}
                      placeholder="e.g. 20"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 h-8 flex items-end mb-1">{t('expense_form.details.transport_cost')}</label>
                    <input
                      type="number"
                      value={seedTransport}
                      onChange={(e) => setSeedTransport(e.target.value)}
                      placeholder="e.g. 2000"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t('expense_form.details.seeds_dealer')}</label>
                  <input
                    type="text"
                    value={seedDealer}
                    onChange={(e) => setSeedDealer(e.target.value)}
                    placeholder="e.g. Krishi Kendra / Neighbor"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                </div>
              </div>
            )}

            {/* 3. Sowing Labor & Machinery */}
            {stage === 'sowing_labor' && (
              <div className="space-y-4">
                {/* Checkboxes to select options */}
                <div className="flex gap-4 pb-2 border-b border-slate-100">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeSowingLabor}
                      onChange={(e) => {
                        setIncludeSowingLabor(e.target.checked);
                        if (!e.target.checked && !includeSowingMachinery) {
                          setIncludeSowingMachinery(true); // make sure at least one is checked
                        }
                      }}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Sowing Labor</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeSowingMachinery}
                      onChange={(e) => {
                        setIncludeSowingMachinery(e.target.checked);
                        if (!e.target.checked && !includeSowingLabor) {
                          setIncludeSowingLabor(true); // make sure at least one is checked
                        }
                      }}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Sowing Machinery</span>
                  </label>
                </div>

                {/* Sowing Labor Details */}
                {includeSowingLabor && (
                  <div className="space-y-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Labor Details</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">{t('expense_form.details.num_laborers')}</label>
                        <input
                          type="number"
                          value={sowingLaborers}
                          onChange={(e) => handleSowingLaborersChange(e.target.value)}
                          placeholder="e.g. 8"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-655 mb-1">{t('expense_form.details.cost_per_laborer')}</label>
                        <input
                          type="number"
                          value={sowingCostPerLaborer}
                          onChange={(e) => handleSowingCostPerLaborerChange(e.target.value)}
                          placeholder="e.g. 300"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-655 mb-1">{t('expense_form.details.labor_cost')}</label>
                      <input
                        type="number"
                        value={sowingCost}
                        onChange={(e) => handleSowingCostChange(e.target.value)}
                        placeholder="e.g. 2400"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-semibold"
                      />
                    </div>
                  </div>
                )}

                {/* Sowing Machinery Details */}
                {includeSowingMachinery && (
                  <div className="space-y-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Machinery Details</p>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Machinery Type / Rental Notes</label>
                      <input
                        type="text"
                        value={sowingMachineryType}
                        onChange={(e) => setSowingMachineryType(e.target.value)}
                        placeholder="e.g. Tractor seed drill rental"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Machinery Cost (₹)</label>
                      <input
                        type="number"
                        value={sowingMachineryCost}
                        onChange={(e) => setSowingMachineryCost(e.target.value)}
                        placeholder="e.g. 1500"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-semibold"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. Pesticides */}
            {stage === 'pesticides' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t('expense_form.details.chemical_name')}</label>
                  <input
                    type="text"
                    value={pestName}
                    onChange={(e) => setPestName(e.target.value)}
                    placeholder="e.g. Neem Oil, Coragen"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 h-8 flex items-end mb-1">{t('expense_form.details.quantity_purchased')}</label>
                    <input
                      type="number"
                      value={pestQty}
                      onChange={(e) => handlePestQtyChange(e.target.value)}
                      placeholder="e.g. 2"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 h-8 flex items-end mb-1">{t('expense_form.details.purchase_cost')}</label>
                    <input
                      type="number"
                      value={pestPurchaseCost}
                      onChange={(e) => handlePestPurchaseCostChange(e.target.value)}
                      placeholder="e.g. 1000"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-semibold"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 h-8 flex items-end mb-1">{t('expense_form.details.price_per_unit')}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={pestPricePerUnit}
                      onChange={(e) => handlePestPricePerUnitChange(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 h-8 flex items-end mb-1">Tanks / Liters Sprayed</label>
                    <input
                      type="number"
                      value={pestTanks}
                      onChange={(e) => setPestTanks(e.target.value)}
                      placeholder="e.g. 10"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t('expense_form.details.total_spraying_cost')}</label>
                  <input
                    type="number"
                    value={pestPricePerTank}
                    onChange={(e) => setPestPricePerTank(e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                  {Number(pestTanks) > 0 && Number(pestPricePerTank) > 0 && (
                    <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                      (₹{(Number(pestPricePerTank) / Number(pestTanks)).toFixed(1)}/tank spraying cost)
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 5. Fertilizers */}
            {stage === 'fertilizers' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t('expense_form.details.fertilizer_name')}</label>
                  <input
                    type="text"
                    value={fertName}
                    onChange={(e) => setFertName(e.target.value)}
                    placeholder="e.g. Urea, DAP, potash"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Total Qty (Bags/kg)</label>
                    <input
                      type="text"
                      value={fertQty}
                      onChange={(e) => setFertQty(e.target.value)}
                      placeholder="e.g. 2 bags"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">{t('expense_form.details.usage_rate')}</label>
                    <input
                      type="text"
                      value={fertUsageRate}
                      onChange={(e) => setFertUsageRate(e.target.value)}
                      placeholder="e.g. 25 kg/Ac"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Fertilizer Purchase Cost (₹)</label>
                  <input
                    type="number"
                    value={fertCost}
                    onChange={(e) => setFertCost(e.target.value)}
                    placeholder="e.g. 1800"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                </div>
              </div>
            )}

            {/* 6. Manual Labor */}
            {stage === 'manual_labor' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t('expense_form.details.work_type')}</label>
                  <input
                    type="text"
                    value={laborWorkType}
                    onChange={(e) => setLaborWorkType(e.target.value)}
                    placeholder="e.g. Hand weeding, channel cleaning"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="col-span-1">
                    <label className="block text-[10px] font-semibold text-slate-550 mb-1">Laborers</label>
                    <input
                      type="number"
                      value={laborCount}
                      onChange={(e) => setLaborCount(e.target.value)}
                      placeholder="e.g. 5"
                      className="w-full px-2 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-center"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[10px] font-semibold text-slate-550 mb-1">Workdays</label>
                    <input
                      type="number"
                      value={laborDays}
                      onChange={(e) => setLaborDays(e.target.value)}
                      placeholder="e.g. 2"
                      className="w-full px-2 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-center"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[10px] font-semibold text-slate-550 mb-1">Cost/Day (₹)</label>
                    <input
                      type="number"
                      value={laborCostPerDay}
                      onChange={(e) => setLaborCostPerDay(e.target.value)}
                      placeholder="350"
                      className="w-full px-2 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-center"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 7. Misc */}
            {stage === 'misc' && (
              <p className="text-xs text-slate-500 italic">
                No specific details required. Please use the fields below to enter cost and notes.
              </p>
            )}

          </div>

          {/* Sowing Date/Expense Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {t('expense_form.date')} *
            </label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm shadow-sm transition-all"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {t('expense_form.notes')}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. bought from village seed bank, tractor rented from Ramesh"
              rows={2}
              className="w-full px-3 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm shadow-sm transition-all"
            />
          </div>

          {/* Total Cost Display / Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {t('expense_form.total_cost')} *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-slate-500 font-bold text-sm">₹</span>
              <input
                type="number"
                required
                min="1"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="e.g. 1500"
                className="w-full pl-8 pr-3 py-3 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm shadow-sm transition-all"
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

          {/* Form Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-semibold text-sm hover-scale hover-scale-active cursor-pointer transition-all text-center shadow-sm"
            >
              {t('expense_form.btn_cancel')}
            </button>
            <button
              type="submit"
              disabled={!!getDisabledReason()}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm hover-scale hover-scale-active cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingExpense ? t('expense_form.btn_save_changes') : t('expense_form.btn_submit')}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

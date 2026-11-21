/**
 * @AUTHOR: Garima Mittal
 * @FILE: InventoryStockView.jsx
 * @RESPONSIBILITY: Dedicated Inventory Stock panel (Director & Operations): live available / reserved units per solar material, low-stock warning pills and a quick "+ Restock Units" modal.
 * @DEPENDENCIES: react, lucide-react, api.js, AuthContext.jsx, AlertBanner.jsx
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Boxes, PackagePlus, Search, RefreshCw } from 'lucide-react';
import { KpiCard, KpiStrip } from '../../components/KpiCard';
import { AlertBanner } from '../../components/AlertBanner';
import { executeHttpRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const STOCK_GROUP_LABELS = {
  SOLAR_PANELS: 'Solar Panels (DCR 540W)',
  ON_GRID_INVERTERS: 'On-Grid Inverters',
  OFF_GRID_INVERTERS: 'Off-Grid Hybrid Inverters',
  LITHIUM_BATTERIES: 'Lithium Solar Batteries',
  MPPT_CONTROLLERS: 'MPPT Charge Controllers',
  MOUNTING_STANDS: 'Mounting Metal Stands',
  WIRING_EARTHING: 'AC/DC Wiring Boxes & Earthing Kits'
};

const GROUP_ORDER = Object.keys(STOCK_GROUP_LABELS);

const StockStatusPill = ({ item }) => {
  if (item.isOutOfStock) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-300">
        ⛔ Out of Stock
      </span>
    );
  }
  if (item.isLowStock) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300">
        ⚠️ Low Stock — reorder soon
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
      ✓ In Stock
    </span>
  );
};

export const InventoryStockView = () => {
  const { currentUser, setIsSystemProcessing } = useAuth();
  const [stockItems, setStockItems] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [restockTarget, setRestockTarget] = useState(null);
  const [restockQuantity, setRestockQuantity] = useState('');
  const [restockNote, setRestockNote] = useState('');
  const [restockError, setRestockError] = useState('');

  const canRestock = currentUser?.role === 'ADMIN' || currentUser?.role === 'OPERATIONS';

  const loadStock = async () => {
    try {
      const response = await executeHttpRequest('/api/inventory/stock');
      if (response.success) setStockItems(response.stock || []);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  useEffect(() => {
    loadStock();
  }, []);

  const groupedItems = useMemo(() => {
    const needle = searchText.trim().toLowerCase();
    const visible = stockItems.filter(
      (item) => !needle || item.itemName.toLowerCase().includes(needle) || item.sku.toLowerCase().includes(needle)
    );
    return GROUP_ORDER
      .map((groupKey) => ({ groupKey, items: visible.filter((item) => item.stockGroup === groupKey) }))
      .filter((group) => group.items.length > 0);
  }, [stockItems, searchText]);

  const totalAvailable = stockItems.reduce((sum, item) => sum + item.availableUnits, 0);
  const totalReserved = stockItems.reduce((sum, item) => sum + item.reservedUnits, 0);
  const lowStockCount = stockItems.filter((item) => item.isLowStock).length;
  const outOfStockCount = stockItems.filter((item) => item.isOutOfStock).length;

  const openRestock = (item) => {
    setRestockTarget(item);
    setRestockQuantity('');
    setRestockNote('');
    setRestockError('');
  };

  const handleRestockSubmit = async (event) => {
    event.preventDefault();
    const cleaned = restockQuantity.trim();
    if (!/^\d+$/.test(cleaned) || Number(cleaned) <= 0) {
      setRestockError('Please enter a whole number of units greater than 0.');
      return;
    }
    if (Number(cleaned) > 100000) {
      setRestockError('Please enter 100,000 units or fewer.');
      return;
    }
    setRestockError('');
    setIsSystemProcessing(true);
    try {
      const response = await executeHttpRequest(`/api/inventory/stock/${restockTarget._id}/restock`, {
        method: 'POST',
        body: JSON.stringify({ quantity: Number(cleaned), note: restockNote.trim() })
      });
      if (response.success) {
        setFeedback({
          type: 'success',
          text: `${Number(cleaned).toLocaleString('en-IN')} units of ${restockTarget.itemName} added. It now has ${response.stockItem.availableUnits.toLocaleString('en-IN')} units available.`
        });
        setRestockTarget(null);
        await loadStock();
      }
    } catch (err) {
      setRestockError(err.message);
    } finally {
      setIsSystemProcessing(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="page-hero flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Boxes className="w-4 h-4 text-[#135D3B]" />
            <span>Warehouse — Live Material Stock</span>
          </div>
          <h2 className="font-heading text-2xl font-black tracking-tight text-slate-900 mt-1">Inventory Stock</h2>
          <p className="text-xs text-slate-600 max-w-2xl mt-1.5 leading-relaxed font-normal">
            Real-time units on the shelf for every solar material. <strong>Available</strong> units can still be assigned to a packing slip;
            <strong> Reserved</strong> units are already promised to confirmed orders waiting for dispatch.
          </p>
        </div>
        <button
          type="button"
          onClick={loadStock}
          className="rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs px-4 py-2 flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      <KpiStrip>
        <KpiCard label="Available units" value={totalAvailable.toLocaleString('en-IN')} icon={Boxes} tone="emerald" trend="on the shelf" trendDir="up" hint="ready to assign" />
        <KpiCard label="Reserved units" value={totalReserved.toLocaleString('en-IN')} icon={PackagePlus} tone="sky" trend="for open orders" hint="awaiting dispatch" />
        <KpiCard label="Low-stock items" value={lowStockCount} icon={Boxes} tone="amber" trend={lowStockCount > 0 ? 'reorder soon' : 'all healthy'} hint="at or below threshold" />
        <KpiCard label="Out of stock" value={outOfStockCount} icon={Boxes} tone="rose" trend={outOfStockCount > 0 ? 'blocks dispatch' : 'none'} hint="zero units" />
      </KpiStrip>

      <AlertBanner type={feedback.type} message={feedback.text} onDismiss={() => setFeedback({ type: '', text: '' })} />

      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search material or SKU..."
          className="odoo-input pl-9 text-xs"
        />
      </div>

      <div className="space-y-5">
        {groupedItems.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-xs text-slate-500 font-medium">
            No materials match your search.
          </div>
        )}
        {groupedItems.map(({ groupKey, items }) => (
          <section key={groupKey} className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
              {STOCK_GROUP_LABELS[groupKey]}
            </div>
            <table className="w-full text-left text-xs">
              <thead className="text-slate-500 font-bold uppercase tracking-wide text-[10px]">
                <tr>
                  <th className="px-5 py-2.5">Material</th>
                  <th className="px-3 py-2.5 text-right">Available Units</th>
                  <th className="px-3 py-2.5 text-right">Reserved Units</th>
                  <th className="px-3 py-2.5">Stock Status</th>
                  <th className="px-5 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3">
                      <div className="font-bold text-slate-900">{item.itemName}</div>
                      <div className="text-[10px] font-mono text-slate-500">{item.sku} • reorder at {item.lowStockThreshold}</div>
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-extrabold text-sm tabular-nums text-[#0F291E]">
                      {item.availableUnits.toLocaleString('en-IN')}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-bold tabular-nums text-sky-800">
                      {item.reservedUnits.toLocaleString('en-IN')}
                    </td>
                    <td className="px-3 py-3"><StockStatusPill item={item} /></td>
                    <td className="px-5 py-3 text-right">
                      {canRestock && (
                        <button
                          type="button"
                          onClick={() => openRestock(item)}
                          className="rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white font-semibold text-[11px] px-3.5 py-1.5 shadow-sm cursor-pointer"
                        >
                          + Restock Units
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>

      {restockTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-extrabold text-base text-[#0F291E]">Restock Units</h3>
                <p className="text-xs text-slate-600 mt-0.5">{restockTarget.itemName}</p>
              </div>
              <button
                type="button"
                onClick={() => setRestockTarget(null)}
                aria-label="Close restock window"
                className="text-2xl leading-none text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ×
              </button>
            </div>
            <div className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between">
              <span className="text-slate-600">Currently available</span>
              <strong className="font-mono">{restockTarget.availableUnits.toLocaleString('en-IN')} units</strong>
            </div>
            <form onSubmit={handleRestockSubmit} noValidate className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Units to add *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={restockQuantity}
                  onChange={(e) => { setRestockQuantity(e.target.value); setRestockError(''); }}
                  className={`odoo-input font-mono font-bold text-sm ${restockError ? 'border-rose-400' : ''}`}
                  placeholder="e.g. 25"
                  autoFocus
                />
                {restockError && <p className="text-rose-700 font-semibold mt-1">⚠️ {restockError}</p>}
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Note (optional)</label>
                <input
                  type="text"
                  maxLength={200}
                  value={restockNote}
                  onChange={(e) => setRestockNote(e.target.value)}
                  className="odoo-input"
                  placeholder="Supplier / delivery reference"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setRestockTarget(null)} className="rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold px-4 py-2 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white font-semibold px-5 py-2 shadow-sm cursor-pointer">
                  Add Units
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryStockView;

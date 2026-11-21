/**
 * @AUTHOR: Garima Mittal
 * @FILE: ProgressWorkflowRibbon.jsx
 * @RESPONSIBILITY: Renders the SolIMS finite state machine (FSM) status progression ribbon, including the explicit Leftover Pay (BALANCE_DUE) order stage.
 * @DEPENDENCIES: react, lucide-react
 */

import React from 'react';
import { Check } from 'lucide-react';

// Order lifecycle: Leftover Pay (BALANCE_DUE) sits explicitly between Advance Paid and Dispatched / Completed
export const ORDER_LIFECYCLE_STAGES = ['Draft', 'Advance Paid', 'Leftover Pay', 'Dispatched', 'Installed'];

export const deriveOrderLifecycleStage = (order) => {
  if (!order) return 'Draft';
  const status = order.orderWorkflowStatus;
  const balanceDue = Number(order.balancePaymentDueInr ?? order.balanceDue ?? 0);
  if (status === 'Draft' || status === 'Cancelled') return 'Draft';
  if (status === 'Installed' || status === 'Done') return 'Installed';
  if (status === 'Dispatched') return 'Dispatched';
  // Advance_Paid / BALANCE_DUE / Packed
  return balanceDue > 0 ? 'Leftover Pay' : 'Dispatched';
};

/** Stages that were passed but still have an outstanding balance (shown amber with a clock). */
export const getOrderPendingStages = (order) => {
  if (!order) return [];
  const balanceDue = Number(order.balancePaymentDueInr ?? order.balanceDue ?? 0);
  const isPastLeftoverStage = ['Dispatched', 'Installed', 'Done'].includes(order.orderWorkflowStatus);
  return balanceDue > 0 && isPastLeftoverStage ? ['Leftover Pay'] : [];
};

export const ProgressWorkflowRibbon = ({
  stages = ['Draft', 'Waiting', 'Ready', 'Done'],
  currentStage = 'Draft',
  pendingStages = [],
  onStageClick = null,
  onSelectStage = null
}) => {
  const currentIndex = stages.findIndex((st) => st.toLowerCase() === (currentStage || '').toLowerCase());
  const normalizedIndex = currentIndex >= 0 ? currentIndex : 0;
  const handleStageAction = onStageClick || onSelectStage;

  return (
    <div
      data-component="workflow-ribbon"
      data-purpose="fsm-status-indicator"
      className="flex items-center flex-wrap gap-0.5 p-0.5 border border-slate-200 rounded-full bg-slate-100 text-xs font-semibold shadow-inner"
    >
      {stages.map((stageName, stageIdx) => {
        const isCurrentActive = stageIdx === normalizedIndex;
        const isCompleted = stageIdx < normalizedIndex;
        const isPending = pendingStages.includes(stageName);

        let styleClasses = 'text-slate-600 bg-transparent hover:text-slate-900 hover:bg-slate-200/60';
        if (isCurrentActive) {
          styleClasses = isPending || stageName === 'Leftover Pay'
            ? 'bg-amber-500 text-white font-extrabold shadow-[0_0_0_3px_rgba(245,158,11,0.35)]'
            : 'bg-[#135D3B] text-white font-extrabold shadow-[0_0_0_3px_rgba(245,158,11,0.35),0_6px_14px_-4px_rgba(19,93,59,0.6)]';
        } else if (isPending) {
          styleClasses = 'bg-amber-50 text-amber-800 border border-amber-300 font-bold';
        } else if (isCompleted) {
          styleClasses = 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold';
        }

        return (
          <button
            type="button"
            key={stageName}
            onClick={() => handleStageAction && handleStageAction(stageName, stageIdx)}
            title={`Stage: ${stageName}${isPending ? ' (Balance still pending)' : isCurrentActive ? ' (Active)' : isCompleted ? ' (Completed)' : ''}`}
            className={`px-3.5 py-1 rounded-full flex items-center gap-1.5 transition-all duration-300 cursor-pointer ${styleClasses}`}
          >
            {isPending ? <span aria-hidden="true">⏳</span> : isCompleted ? <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[2.5]" /> : null}
            <span>{stageName}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ProgressWorkflowRibbon;

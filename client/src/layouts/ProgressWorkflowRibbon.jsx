/**
 * @AUTHOR: Garima Mittal
 * @FILE: ProgressWorkflowRibbon.jsx
 * @RESPONSIBILITY: Renders the glowing Odoo finite state machine (FSM) status progression ribbon with active stage glow.
 * @DEPENDENCIES: react, lucide-react
 */

import React from 'react';
import { Check } from 'lucide-react';

export const ProgressWorkflowRibbon = ({ stages = ['Draft', 'Waiting', 'Ready', 'Done'], currentStage = 'Draft' }) => {
  const currentIndex = stages.findIndex((st) => st.toLowerCase() === (currentStage || '').toLowerCase());
  const normalizedIndex = currentIndex >= 0 ? currentIndex : 0;

  return (
    <div
      data-component="workflow-ribbon"
      data-purpose="fsm-status-indicator"
      className="flex items-center overflow-hidden border border-slate-200 rounded-lg bg-white text-xs font-bold shadow-sm"
    >
      {stages.map((stageName, stageIdx) => {
        const isCurrentActive = stageIdx === normalizedIndex;
        const isCompleted = stageIdx < normalizedIndex;

        let styleClasses = 'text-slate-500 bg-slate-50';
        if (isCurrentActive) {
          styleClasses = 'bg-[#714B67] text-white shadow-sm ring-1 ring-[#714B67] font-extrabold';
        } else if (isCompleted) {
          styleClasses = 'bg-emerald-50 text-emerald-800 border-r border-emerald-200 font-bold';
        }

        return (
          <div
            key={stageName}
            className={`px-3 py-1.5 flex items-center gap-1.5 transition-all ${styleClasses} ${
              stageIdx > 0 ? 'border-l border-slate-200' : ''
            }`}
          >
            {isCompleted ? <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[2.5]" /> : null}
            <span>{stageName}</span>
          </div>
        );
      })}
    </div>
  );
};

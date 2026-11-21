/**
 * @AUTHOR: Garima Mittal
 * @FILE: ProgressWorkflowRibbon.jsx
 * @RESPONSIBILITY: Renders the glowing SolIMS finite state machine (FSM) status progression ribbon with Forest-Emerald & Soft-Mint active stage glow.
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
      className="flex items-center overflow-hidden border border-emerald-900/15 rounded-full bg-white text-xs font-bold shadow-xs"
    >
      {stages.map((stageName, stageIdx) => {
        const isCurrentActive = stageIdx === normalizedIndex;
        const isCompleted = stageIdx < normalizedIndex;

        let styleClasses = 'text-slate-500 bg-slate-50';
        if (isCurrentActive) {
          styleClasses = 'bg-[#135D3B] text-white shadow-sm ring-1 ring-[#135D3B] font-extrabold';
        } else if (isCompleted) {
          styleClasses = 'bg-[#E6F4EC] text-[#135D3B] border-r border-[#135D3B]/20 font-bold';
        }

        return (
          <div
            key={stageName}
            className={`px-3 py-1 flex items-center gap-1.5 transition-all ${styleClasses} ${
              stageIdx > 0 ? 'border-l border-slate-200' : ''
            }`}
          >
            {isCompleted ? <Check className="w-3.5 h-3.5 text-[#135D3B] stroke-[2.5]" /> : null}
            <span>{stageName}</span>
          </div>
        );
      })}
    </div>
  );
};

export default ProgressWorkflowRibbon;

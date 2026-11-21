/**
 * @AUTHOR: Garima Mittal
 * @FILE: ProgressWorkflowRibbon.jsx
 * @RESPONSIBILITY: Renders the glowing SolIMS finite state machine (FSM) status progression ribbon with Forest-Emerald & Soft-Mint active stage glow.
 * @DEPENDENCIES: react, lucide-react
 */

import React from 'react';
import { Check } from 'lucide-react';

export const ProgressWorkflowRibbon = ({
  stages = ['Draft', 'Waiting', 'Ready', 'Done'],
  currentStage = 'Draft',
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
      className="flex items-center gap-0.5 p-0.5 border border-slate-200 rounded-full bg-slate-100 text-xs font-semibold shadow-inner"
    >
      {stages.map((stageName, stageIdx) => {
        const isCurrentActive = stageIdx === normalizedIndex;
        const isCompleted = stageIdx < normalizedIndex;

        let styleClasses = 'text-slate-600 bg-transparent hover:text-slate-900 hover:bg-slate-200/60';
        if (isCurrentActive) {
          styleClasses = 'bg-[#135D3B] text-white font-extrabold shadow-[0_0_0_3px_rgba(245,158,11,0.35),0_6px_14px_-4px_rgba(19,93,59,0.6)]';
        } else if (isCompleted) {
          styleClasses = 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold';
        }

        return (
          <button
            type="button"
            key={stageName}
            onClick={() => handleStageAction && handleStageAction(stageName, stageIdx)}
            title={`Stage: ${stageName}${isCurrentActive ? ' (Active)' : isCompleted ? ' (Completed)' : ''}`}
            className={`px-3.5 py-1 rounded-full flex items-center gap-1.5 transition-all duration-300 cursor-pointer ${styleClasses}`}
          >
            {isCompleted ? <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[2.5]" /> : null}
            <span>{stageName}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ProgressWorkflowRibbon;

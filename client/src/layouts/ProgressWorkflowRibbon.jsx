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
      className="flex items-center overflow-hidden border border-gray-200 rounded-md bg-white text-xs font-semibold shadow-xs"
    >
      {stages.map((stageName, stageIdx) => {
        const isCurrentActive = stageIdx === normalizedIndex;
        const isCompleted = stageIdx < normalizedIndex;

        let styleClasses = 'text-gray-400 bg-gray-50';
        if (isCurrentActive) {
          styleClasses = 'bg-[#714B67] text-white shadow-sm ring-1 ring-[#714B67] font-bold';
        } else if (isCompleted) {
          styleClasses = 'bg-emerald-50 text-emerald-700 border-r border-emerald-100';
        }

        return (
          <div
            key={stageName}
            className={`px-3 py-1.5 flex items-center gap-1.5 transition-all ${styleClasses} ${
              stageIdx > 0 ? 'border-l border-gray-200' : ''
            }`}
          >
            {isCompleted ? <Check className="w-3 h-3 text-emerald-600" /> : null}
            <span>{stageName}</span>
          </div>
        );
      })}
    </div>
  );
};

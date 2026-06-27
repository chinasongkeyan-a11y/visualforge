'use client';

import { SEGMENT_LIBRARY } from '../../lib/segment-schemas';
import type { SegmentType } from '../../lib/types';
import {
  Type,
  BarChart3,
  PieChart,
  TrendingUp,
  Highlighter,
  Quote,
  Workflow,
  Columns2,
  Hash,
  GitCommitVertical,
  Layers,
} from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

const ICONS: Record<string, typeof Type> = {
  type: Type,
  'bar-chart-3': BarChart3,
  'pie-chart': PieChart,
  'trending-up': TrendingUp,
  highlighter: Highlighter,
  quote: Quote,
  'git-branch': Workflow,
  'columns-2': Columns2,
  hash: Hash,
  'git-commit-vertical': GitCommitVertical,
  layers: Layers,
};

interface SegmentLibraryProps {
  onAddSegment: (type: SegmentType) => void;
}

export function SegmentLibrary({ onAddSegment }: SegmentLibraryProps) {
  return (
    <div className="w-44 border-r border-[#30363d] bg-[#0d1117] flex flex-col">
      <div className="px-3 py-3 border-b border-[#30363d]">
        <span className="text-xs font-medium text-[#7d8590] uppercase tracking-wide">片段库</span>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {SEGMENT_LIBRARY.map((item) => {
            const Icon = ICONS[item.icon] ?? Type;
            return (
              <button
                key={item.type}
                onClick={() => onAddSegment(item.type)}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs text-[#e6edf3] hover:bg-[#161b22] transition-colors group"
              >
                <Icon className="h-4 w-4 text-[#7d8590] group-hover:text-[#2f81f7] transition-colors shrink-0" />
                <span className="truncate">{item.name}</span>
              </button>
            );
          })}
        </div>
      </ScrollArea>
      <div className="px-3 py-2 border-t border-[#30363d] text-[10px] text-[#484f58]">
        点击添加到时间线
      </div>
    </div>
  );
}

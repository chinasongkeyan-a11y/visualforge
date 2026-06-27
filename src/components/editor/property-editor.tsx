'use client';

import type { EditorHook } from '../../hooks/use-editor';
import type { SegmentPropSchema } from '../../lib/types';
import { getSegmentSchema } from '../../lib/segment-schemas';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Plus, Trash2, Copy } from 'lucide-react';

interface PropertyEditorProps {
  editor: EditorHook;
}

export function PropertyEditor({ editor }: PropertyEditorProps) {
  const { selectedSegment } = editor;

  if (!selectedSegment) {
    return (
      <div className="w-72 border-l border-[#30363d] bg-[#0d1117] flex items-center justify-center p-4">
        <p className="text-sm text-[#7d8590] text-center">
          选中一个片段以编辑其属性
        </p>
      </div>
    );
  }

  const schema = getSegmentSchema(selectedSegment.type);
  if (!schema) return null;

  return (
    <div className="w-72 border-l border-[#30363d] bg-[#0d1117] flex flex-col">
      <div className="px-4 py-3 border-b border-[#30363d] flex items-center justify-between">
        <span className="text-sm font-medium text-[#e6edf3]">{schema.name} 属性</span>
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-[#7d8590] hover:text-[#e6edf3]"
            onClick={() => editor.duplicateSegment(selectedSegment.id)}
            title="复制片段"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-[#f85149] hover:text-[#f85149]"
            onClick={() => editor.deleteSegment(selectedSegment.id)}
            title="删除片段"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Time properties */}
          <div className="space-y-2 pb-3 border-b border-[#21262d]">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-[#7d8590]">开始时间</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={selectedSegment.start.toFixed(1)}
                  onChange={(e) => editor.updateSegment(selectedSegment.id, { start: parseFloat(e.target.value) || 0 })}
                  className="h-8 text-xs bg-[#161b22] border-[#30363d] text-[#e6edf3]"
                />
              </div>
              <div>
                <Label className="text-xs text-[#7d8590]">持续时间</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="10"
                  value={selectedSegment.duration.toFixed(1)}
                  onChange={(e) => editor.updateSegment(selectedSegment.id, { duration: parseFloat(e.target.value) || 0.5 })}
                  className="h-8 text-xs bg-[#161b22] border-[#30363d] text-[#e6edf3]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-[#7d8590]">入场转场</Label>
                <Select
                  value={selectedSegment.transitionIn}
                  onValueChange={(v) => editor.updateSegment(selectedSegment.id, { transitionIn: v as typeof selectedSegment.transitionIn })}
                >
                  <SelectTrigger className="h-8 text-xs bg-[#161b22] border-[#30363d] text-[#e6edf3]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">无</SelectItem>
                    <SelectItem value="fadeIn">淡入</SelectItem>
                    <SelectItem value="slideUp">滑入</SelectItem>
                    <SelectItem value="scaleIn">缩放进入</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-[#7d8590]">出场转场</Label>
                <Select
                  value={selectedSegment.transitionOut}
                  onValueChange={(v) => editor.updateSegment(selectedSegment.id, { transitionOut: v as typeof selectedSegment.transitionOut })}
                >
                  <SelectTrigger className="h-8 text-xs bg-[#161b22] border-[#30363d] text-[#e6edf3]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">无</SelectItem>
                    <SelectItem value="fadeOut">淡出</SelectItem>
                    <SelectItem value="slideOut">滑出</SelectItem>
                    <SelectItem value="scaleOut">缩放退出</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Segment-specific properties */}
          {schema.props.map((prop) => (
            <PropertyField
              key={prop.key}
              prop={prop}
              value={(selectedSegment.props as unknown as Record<string, unknown>)[prop.key]}
              onChange={(value) => editor.updateSegmentProps(selectedSegment.id, prop.key, value)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function PropertyField({
  prop,
  value,
  onChange,
}: {
  prop: SegmentPropSchema;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  switch (prop.type) {
    case 'string':
      return (
        <div className="space-y-1.5">
          <Label className="text-xs text-[#7d8590]">{prop.label}</Label>
          <Input
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 text-xs bg-[#161b22] border-[#30363d] text-[#e6edf3]"
          />
        </div>
      );

    case 'number':
      return (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-[#7d8590]">{prop.label}</Label>
            <span className="text-xs text-[#e6edf3] tabular-nums">{Number(value ?? 0).toFixed(prop.step && prop.step < 1 ? 2 : 0)}</span>
          </div>
          {prop.min !== undefined && prop.max !== undefined ? (
            <Slider
              value={[Number(value ?? prop.default ?? 0)]}
              min={prop.min}
              max={prop.max}
              step={prop.step ?? 1}
              onValueChange={([v]) => onChange(v)}
            />
          ) : (
            <Input
              type="number"
              value={Number(value ?? 0)}
              onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
              className="h-8 text-xs bg-[#161b22] border-[#30363d] text-[#e6edf3]"
            />
          )}
        </div>
      );

    case 'color':
      return (
        <div className="space-y-1.5">
          <Label className="text-xs text-[#7d8590]">{prop.label}</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={(value as string) ?? '#000000'}
              onChange={(e) => onChange(e.target.value)}
              className="h-8 w-10 rounded border border-[#30363d] bg-[#161b22] cursor-pointer"
            />
            <Input
              value={(value as string) ?? ''}
              onChange={(e) => onChange(e.target.value)}
              className="h-8 flex-1 text-xs bg-[#161b22] border-[#30363d] text-[#e6edf3] font-mono"
            />
          </div>
        </div>
      );

    case 'boolean':
      return (
        <div className="flex items-center justify-between">
          <Label className="text-xs text-[#7d8590]">{prop.label}</Label>
          <Switch
            checked={Boolean(value)}
            onCheckedChange={onChange}
          />
        </div>
      );

    case 'enum':
      return (
        <div className="space-y-1.5">
          <Label className="text-xs text-[#7d8590]">{prop.label}</Label>
          <Select value={value as string} onValueChange={onChange}>
            <SelectTrigger className="h-8 text-xs bg-[#161b22] border-[#30363d] text-[#e6edf3]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {prop.options?.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case 'colorArray':
      return <ColorArrayEditor label={prop.label} value={value as string[]} onChange={onChange} />;

    case 'data':
      return <DataEditor label={prop.label} value={value as { label: string; value: number; color: string }[]} onChange={onChange} />;

    default:
      return null;
  }
}

function ColorArrayEditor({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  const colors = Array.isArray(value) ? value : ['#000000', '#ffffff'];
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-[#7d8590]">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {colors.map((color, i) => (
          <input
            key={i}
            type="color"
            value={color}
            onChange={(e) => {
              const next = [...colors];
              next[i] = e.target.value;
              onChange(next);
            }}
            className="h-7 w-7 rounded border border-[#30363d] cursor-pointer"
          />
        ))}
        <Button
          size="sm"
          variant="outline"
          className="h-7 w-7 p-0 border-[#30363d] bg-[#161b22]"
          onClick={() => onChange([...colors, '#888888'])}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

function DataEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: { label: string; value: number; color: string }[];
  onChange: (v: { label: string; value: number; color: string }[]) => void;
}) {
  const items = Array.isArray(value) ? value : [];
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-[#7d8590]">{label}</Label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <input
              type="color"
              value={item.color}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...item, color: e.target.value };
                onChange(next);
              }}
              className="h-7 w-7 rounded border border-[#30363d] cursor-pointer shrink-0"
            />
            <Input
              value={item.label}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...item, label: e.target.value };
                onChange(next);
              }}
              className="h-7 w-16 text-xs bg-[#161b22] border-[#30363d] text-[#e6edf3]"
              placeholder="标签"
            />
            <Input
              type="number"
              value={item.value}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...item, value: parseFloat(e.target.value) || 0 };
                onChange(next);
              }}
              className="h-7 flex-1 text-xs bg-[#161b22] border-[#30363d] text-[#e6edf3]"
              placeholder="数值"
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-[#f85149] shrink-0"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button
          size="sm"
          variant="outline"
          className="h-7 w-full text-xs border-[#30363d] bg-[#161b22] text-[#7d8590] hover:text-[#e6edf3]"
          onClick={() => onChange([...items, { label: '新项', value: 50, color: '#888888' }])}
        >
          <Plus className="h-3 w-3 mr-1" /> 添加数据项
        </Button>
      </div>
    </div>
  );
}

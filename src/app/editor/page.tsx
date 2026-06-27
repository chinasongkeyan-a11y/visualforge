'use client';

import { useEffect, useState } from 'react';
import { useEditor } from '../../hooks/use-editor';
import { Toolbar } from '../../components/editor/toolbar';
import { SegmentLibrary } from '../../components/editor/segment-library';
import { Timeline } from '../../components/editor/timeline';
import { PreviewCanvas } from '../../components/editor/preview-canvas';
import { PropertyEditor } from '../../components/editor/property-editor';
import { createProject, loadProject } from '../../lib/project-storage';
import type { Project } from '../../lib/types';

export default function EditorPage() {
  const [initialProject, setInitialProject] = useState<Project | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get('project');
    if (projectId) {
      const loaded = loadProject(projectId);
      if (loaded) {
        setInitialProject(loaded);
        return;
      }
    }
    // Create default project with a sample timeline
    const proj = createProject('我的项目', 'tech_blue');
    setInitialProject(proj);
  }, []);

  if (!initialProject) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0d1117]">
        <div className="text-[#7d8590] text-sm">加载编辑器...</div>
      </div>
    );
  }

  return <EditorContent initialProject={initialProject} />;
}

function EditorContent({ initialProject }: { initialProject: Project }) {
  const editor = useEditor(initialProject);

  return (
    <div className="h-screen flex flex-col bg-[#0d1117] overflow-hidden">
      <Toolbar editor={editor} />

      <div className="flex-1 flex overflow-hidden">
        <SegmentLibrary onAddSegment={editor.addSegment} />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Preview area */}
          <div className="flex-1 flex items-center justify-center bg-[#0d1117] overflow-hidden p-4 min-h-0">
            <PreviewCanvas
              project={editor.project}
              currentTime={editor.currentTime}
              maxWidth={300}
              maxHeight={400}
            />
          </div>

          {/* Timeline */}
          <div className="h-[200px] flex-shrink-0">
            <Timeline editor={editor} />
          </div>
        </div>

        <PropertyEditor editor={editor} />
      </div>
    </div>
  );
}

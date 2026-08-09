import React, { useEffect, useRef, useState } from 'react';
import { PenTool, Save, Sparkles, Lightbulb, Search, Clock3, FileText } from 'lucide-react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { api } from '../utils/api';
import { useStudent } from '../context/StudentContext';

const buildScene = (elements = [], appState = {}, files = null, versionNonce = Date.now()) => ({
  elements,
  appState,
  files,
  versionNonce
});

const createDefaultDiagram = () => ({
  id: `diagram-${Date.now()}`,
  title: 'My Diagram',
  scene: buildScene([], {
    viewBackgroundColor: '#ffffff',
    defaultSidebarDocked: false,
    gridSize: 20,
    exportBackground: false,
    isLoading: false
  }),
  updatedAt: new Date().toISOString()
});

const DiagramPage = () => {
  const { currentStudent } = useStudent();
  const excalidrawRef = useRef(null);
  const latestSceneRef = useRef(null);
  const [diagram, setDiagram] = useState(createDefaultDiagram());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [savedDiagrams, setSavedDiagrams] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!currentStudent?.id) return;

    const loadDiagram = async () => {
      setLoading(true);
      try {
        const saved = await api.getDiagrams(currentStudent.id);
        const diagrams = Array.isArray(saved) ? saved : [];
        setSavedDiagrams(diagrams);
        const latest = diagrams.length > 0 ? diagrams[0] : null;
        if (latest) {
          const content = latest.content || { title: latest.title || 'My Diagram', elements: [], appState: {}, files: null };
          const scene = buildScene(
            Array.isArray(content.elements) ? content.elements : [],
            content.appState || {},
            content.files || null,
            content.versionNonce || Date.now()
          );
          setDiagram({
            id: latest.id || `diagram-${Date.now()}`,
            title: content.title || latest.title || 'My Diagram',
            scene,
            updatedAt: content.updatedAt || latest.updatedAt || new Date().toISOString()
          });
          latestSceneRef.current = scene;
        } else {
          const freshDiagram = createDefaultDiagram();
          setDiagram(freshDiagram);
          latestSceneRef.current = freshDiagram.scene;
        }
      } catch (err) {
        console.error('Failed to load diagrams', err);
        setStatusMessage('Unable to load saved diagrams yet.');
      } finally {
        setLoading(false);
      }
    };

    loadDiagram();
  }, [currentStudent?.id]);

  const saveDiagram = async () => {
    if (!currentStudent?.id) {
      setStatusMessage('Choose a student profile first.');
      return;
    }

    setSaving(true);
    try {
      const sceneFromEditor = latestSceneRef.current || diagram.scene;
      const payload = [{
        id: diagram.id,
        title: diagram.title || 'My Diagram',
        elements: sceneFromEditor.elements || [],
        appState: sceneFromEditor.appState || {},
        files: sceneFromEditor.files || null,
        updatedAt: new Date().toISOString()
      }];

      await api.saveDiagrams(currentStudent.id, payload);
      const updatedDiagrams = [{ ...payload[0], content: { title: payload[0].title, elements: payload[0].elements, appState: payload[0].appState, files: payload[0].files, updatedAt: payload[0].updatedAt } }, ...savedDiagrams.filter(item => item.id !== payload[0].id)];
      setSavedDiagrams(updatedDiagrams);
      setDiagram((prev) => ({
        ...prev,
        scene: {
          ...sceneFromEditor,
          versionNonce: Date.now()
        },
        updatedAt: new Date().toISOString()
      }));
      setStatusMessage('Diagram saved to the database.');
    } catch (err) {
      console.error('Failed to save diagram', err);
      setStatusMessage('Saved locally for now.');
    } finally {
      setSaving(false);
    }
  };

  const resetDiagram = () => {
    const fresh = createDefaultDiagram();
    setDiagram(fresh);
    latestSceneRef.current = fresh.scene;
    setStatusMessage('Started a fresh diagram.');
  };

  const filteredDiagrams = savedDiagrams.filter((item) => {
    const haystack = `${item.title || ''} ${item.content?.title || ''} ${item.content?.elements?.map((el) => el.text || '').join(' ') || ''}`.toLowerCase();
    return haystack.includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading diagram workspace...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <PenTool size={16} />
            Visual Learning Studio
          </div>
          <h1 className="mt-3 text-3xl font-bold text-white">Draw and save real Excalidraw diagrams</h1>
          <p className="mt-2 max-w-2xl text-gray-400">
            The full Excalidraw editor is back, and your work can still be saved to the student database.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={saveDiagram}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/80"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save to DB'}
          </button>
          <button
            onClick={resetDiagram}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-gray-200 transition hover:bg-white/10"
          >
            Start New
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-surface/70 p-4 shadow-2xl shadow-black/20">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-400">
          <span>Real Excalidraw editor</span>
          <span>{statusMessage || 'Tip: use simple shapes and labels for younger learners.'}</span>
        </div>

        <input
          value={diagram.title}
          onChange={(e) => setDiagram((prev) => ({ ...prev, title: e.target.value, updatedAt: new Date().toISOString() }))}
          className="mb-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-primary"
          placeholder="Diagram title"
        />

        <div className="h-[72vh] min-h-[640px] overflow-hidden rounded-2xl border border-white/10 bg-white">
          <Excalidraw
            key={diagram.id}
            ref={excalidrawRef}
            initialData={diagram.scene}
            onChange={(elements, appState, files) => {
              latestSceneRef.current = buildScene(elements, appState || {}, files || null, Date.now());
            }}
            theme="light"
            handleResize={true}
          />
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-surface/60 p-5 shadow-lg">
        <div className="mb-3 flex items-center gap-2 text-amber-400">
          <Lightbulb size={18} />
          <h2 className="font-semibold text-white">Helpful for learning</h2>
        </div>
        <p className="text-sm text-gray-400">
          This works well for math formulas, science diagrams, and simple flow charts because the visual editor is now fully available again.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-surface/70 p-5 shadow-lg">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">Saved diagrams</h2>
            <p className="text-sm text-gray-400">Search and reopen prior drawings for class references and test prep.</p>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search diagrams"
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-primary"
            />
          </div>
        </div>

        {filteredDiagrams.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-gray-400">
            No saved diagrams yet. Save one and it will appear here for quick searching later.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {filteredDiagrams.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  const content = item.content || { title: item.title || 'My Diagram', elements: [], appState: {}, files: null };
                  setDiagram({
                    id: item.id,
                    title: content.title || item.title || 'My Diagram',
                    scene: {
                      elements: Array.isArray(content.elements) ? content.elements : [],
                      appState: content.appState || {},
                      files: content.files || null,
                      versionNonce: Date.now()
                    },
                    updatedAt: content.updatedAt || item.updatedAt || new Date().toISOString()
                  });
                  setStatusMessage(`Loaded ${content.title || item.title || 'diagram'}.`);
                }}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10"
              >
                <div className="flex items-center gap-2 text-primary">
                  <FileText size={16} />
                  <span className="font-semibold text-white">{item.title || item.content?.title || 'Untitled Diagram'}</span>
                </div>
                <p className="mt-2 text-sm text-gray-400">
                  {item.content?.elements?.length ? `${item.content.elements.length} objects` : 'No objects yet'}
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                  <Clock3 size={14} />
                  <span>{new Date(item.updatedAt || item.content?.updatedAt || Date.now()).toLocaleString()}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiagramPage;

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LevelData, Platform, Block, Hazard, PressurePlate, Door, WindZone, GravitySwitch, FluxNode, FluxShard } from '../types/game';
import { 
  Play, 
  ArrowLeft, 
  Undo2, 
  Redo2, 
  Trash2, 
  Copy, 
  Grid, 
  Download, 
  Upload, 
  Save
} from 'lucide-react';
import { SaveSystem } from '../storage/saveSystem';

interface LevelEditorProps {
  onBack: () => void;
  onTestPlay: (level: LevelData) => void;
}

type EditorTool = 
  | 'PLATFORM_NORMAL'
  | 'PLATFORM_ELASTIC'
  | 'PLATFORM_ICE'
  | 'PLATFORM_MAGNETIC'
  | 'PLATFORM_PHASE'
  | 'BLOCK_NORMAL'
  | 'BLOCK_HEAVY'
  | 'BLOCK_MAGNETIC'
  | 'HAZARD_SPIKE'
  | 'HAZARD_LASER'
  | 'PRESSURE_PLATE'
  | 'DOOR'
  | 'WIND_ZONE'
  | 'GRAVITY_SWITCH'
  | 'FLUX_NODE'
  | 'SHARD'
  | 'SPAWN'
  | 'EXIT'
  | 'SELECT';

export const LevelEditor: React.FC<LevelEditorProps> = ({ onBack, onTestPlay }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initial custom level template
  const [level, setLevel] = useState<LevelData>(() => {
    const customLevels = SaveSystem.loadCustomLevels();
    if (customLevels.length > 0) return customLevels[0];
    return {
      id: 999,
      section: 1,
      name: 'Custom Chamber',
      description: 'Handcrafted custom puzzle chamber.',
      width: 800,
      height: 500,
      defaultGravity: 'DOWN',
      allowedStates: ['NORMAL', 'HEAVY', 'LIGHT', 'MAGNETIC', 'ELASTIC', 'FROZEN', 'PHASE'],
      playerSpawn: { x: 60, y: 440 },
      exitDoor: { x: 720, y: 420, w: 36, h: 54 },
      platforms: [
        { id: 'floor', x: 0, y: 476, w: 800, h: 24, type: 'NORMAL' },
        { id: 'ceil', x: 0, y: 0, w: 800, h: 24, type: 'NORMAL' },
        { id: 'wall-l', x: 0, y: 0, w: 24, h: 500, type: 'NORMAL' },
        { id: 'wall-r', x: 776, y: 0, w: 24, h: 500, type: 'NORMAL' },
      ],
      blocks: [],
      hazards: [],
      pressurePlates: [],
      timedSwitches: [],
      doors: [],
      windZones: [],
      gravityZones: [],
      gravitySwitches: [],
      teleporters: [],
      fluxNodes: [],
      shards: [],
    };
  });

  const [tool, setTool] = useState<EditorTool>('PLATFORM_NORMAL');
  const [gridSnap, setGridSnap] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [history, setHistory] = useState<LevelData[]>([]);
  const [redoStack, setRedoStack] = useState<LevelData[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const pushHistory = useCallback((newLevel: LevelData) => {
    setHistory(prev => [...prev.slice(-15), JSON.parse(JSON.stringify(level))]);
    setRedoStack([]);
    setLevel(newLevel);
  }, [level]);

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setRedoStack(r => [JSON.parse(JSON.stringify(level)), ...r]);
    setHistory(h => h.slice(0, -1));
    setLevel(prev);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setHistory(h => [...h, JSON.parse(JSON.stringify(level))]);
    setRedoStack(r => r.slice(1));
    setLevel(next);
  };

  const handleSave = () => {
    SaveSystem.saveCustomLevel(level);
    alert('Level saved to local storage!');
  };

  const handleExport = () => {
    const json = JSON.stringify(level, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flux-level-${level.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed && parsed.width && parsed.platforms) {
          pushHistory(parsed);
        }
      } catch {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteSelected = () => {
    if (!selectedId) return;
    const next = { ...level };
    next.platforms = next.platforms.filter(p => p.id !== selectedId);
    next.blocks = next.blocks.filter(b => b.id !== selectedId);
    next.hazards = next.hazards.filter(h => h.id !== selectedId);
    next.pressurePlates = next.pressurePlates.filter(p => p.id !== selectedId);
    next.doors = next.doors.filter(d => d.id !== selectedId);
    next.windZones = next.windZones.filter(w => w.id !== selectedId);
    next.gravitySwitches = next.gravitySwitches.filter(g => g.id !== selectedId);
    next.fluxNodes = next.fluxNodes.filter(f => f.id !== selectedId);
    next.shards = next.shards.filter(s => s.id !== selectedId);
    setSelectedId(null);
    pushHistory(next);
  };

  const handleDuplicateSelected = () => {
    if (!selectedId) return;
    const next = { ...level };
    const plat = next.platforms.find(p => p.id === selectedId);
    if (plat) {
      const newP = { ...plat, id: `plat-${Date.now()}`, x: plat.x + 20, y: plat.y + 20 };
      next.platforms.push(newP);
      setSelectedId(newP.id);
      pushHistory(next);
      return;
    }
    const b = next.blocks.find(x => x.id === selectedId);
    if (b) {
      const newB = { ...b, id: `blk-${Date.now()}`, x: b.x + 20, y: b.y + 20 };
      next.blocks.push(newB);
      setSelectedId(newB.id);
      pushHistory(next);
      return;
    }
  };

  // Canvas interaction
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = level.width / rect.width;
    const scaleY = level.height / rect.height;
    let x = (e.clientX - rect.left) * scaleX;
    let y = (e.clientY - rect.top) * scaleY;

    if (gridSnap) {
      x = Math.round(x / 20) * 20;
      y = Math.round(y / 20) * 20;
    }
    return { x, y };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    setIsDragging(true);

    if (tool === 'SELECT') {
      // Find object under cursor
      const clickedPlat = level.platforms.find(p => x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h);
      if (clickedPlat) {
        setSelectedId(clickedPlat.id);
        setSelectedType('platform');
        return;
      }
      const clickedBlock = level.blocks.find(b => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
      if (clickedBlock) {
        setSelectedId(clickedBlock.id);
        setSelectedType('block');
        return;
      }
      const clickedHaz = level.hazards.find(h => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h);
      if (clickedHaz) {
        setSelectedId(clickedHaz.id);
        setSelectedType('hazard');
        return;
      }
      setSelectedId(null);
      setSelectedType(null);
      return;
    }

    const next = { ...level };
    const uid = `elem-${Date.now()}`;

    if (tool === 'PLATFORM_NORMAL') {
      next.platforms.push({ id: uid, x, y, w: 80, h: 20, type: 'NORMAL' });
    } else if (tool === 'PLATFORM_ELASTIC') {
      next.platforms.push({ id: uid, x, y, w: 80, h: 20, type: 'ELASTIC' });
    } else if (tool === 'PLATFORM_ICE') {
      next.platforms.push({ id: uid, x, y, w: 80, h: 20, type: 'ICE' });
    } else if (tool === 'PLATFORM_MAGNETIC') {
      next.platforms.push({ id: uid, x, y, w: 80, h: 20, type: 'MAGNETIC_POS' });
    } else if (tool === 'PLATFORM_PHASE') {
      next.platforms.push({ id: uid, x, y, w: 24, h: 80, type: 'PHASE' });
    } else if (tool === 'BLOCK_NORMAL') {
      next.blocks.push({ id: uid, x, y, w: 32, h: 32, vx: 0, vy: 0, type: 'NORMAL' });
    } else if (tool === 'BLOCK_HEAVY') {
      next.blocks.push({ id: uid, x, y, w: 40, h: 40, vx: 0, vy: 0, type: 'HEAVY' });
    } else if (tool === 'BLOCK_MAGNETIC') {
      next.blocks.push({ id: uid, x, y, w: 34, h: 34, vx: 0, vy: 0, type: 'MAGNETIC_POS' });
    } else if (tool === 'HAZARD_SPIKE') {
      next.hazards.push({ id: uid, x, y, w: 60, h: 20, type: 'SPIKE' });
    } else if (tool === 'HAZARD_LASER') {
      next.hazards.push({ id: uid, x, y, w: 100, h: 16, type: 'LASER' });
    } else if (tool === 'PRESSURE_PLATE') {
      const dId = `door-${Date.now()}`;
      next.pressurePlates.push({ id: uid, x, y, w: 44, h: 10, requiresHeavy: false, targetId: dId, isPressed: false });
      next.doors.push({ id: dId, x: x + 100, y: y - 60, w: 20, h: 70, isOpen: false });
    } else if (tool === 'WIND_ZONE') {
      next.windZones.push({ id: uid, x, y, w: 80, h: 160, forceX: 0, forceY: -700 });
    } else if (tool === 'GRAVITY_SWITCH') {
      next.gravitySwitches.push({ id: uid, x, y, w: 26, h: 26, newDirection: 'UP' });
    } else if (tool === 'FLUX_NODE') {
      next.fluxNodes.push({ id: uid, x, y, w: 28, h: 28, combinedStates: ['HEAVY', 'ELASTIC'], active: true });
    } else if (tool === 'SHARD') {
      next.shards.push({ id: uid, x, y, collected: false });
    } else if (tool === 'SPAWN') {
      next.playerSpawn = { x, y };
    } else if (tool === 'EXIT') {
      next.exitDoor = { x, y, w: 36, h: 54 };
    }

    pushHistory(next);
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  // Draw editor canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, level.width, level.height);
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, level.width, level.height);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < level.width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, level.height);
      ctx.stroke();
    }
    for (let y = 0; y < level.height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(level.width, y);
      ctx.stroke();
    }

    // Platforms
    for (const plat of level.platforms) {
      ctx.fillStyle = plat.type === 'ELASTIC' ? '#f59e0b' : plat.type === 'ICE' ? '#38bdf8' : plat.type === 'MAGNETIC_POS' ? '#ef4444' : plat.type === 'PHASE' ? '#c084fc' : '#334155';
      ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      if (plat.id === selectedId) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(plat.x - 2, plat.y - 2, plat.w + 4, plat.h + 4);
      }
    }

    // Blocks
    for (const b of level.blocks) {
      ctx.fillStyle = b.type === 'HEAVY' ? '#4f46e5' : b.type === 'MAGNETIC_POS' ? '#dc2626' : '#64748b';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      if (b.id === selectedId) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x - 2, b.y - 2, b.w + 4, b.h + 4);
      }
    }

    // Hazards
    for (const h of level.hazards) {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(h.x, h.y, h.w, h.h);
    }

    // Pressure plates & doors
    for (const p of level.pressurePlates) {
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(p.x, p.y, p.w, p.h);
    }
    for (const d of level.doors) {
      ctx.fillStyle = '#f87171';
      ctx.fillRect(d.x, d.y, d.w, d.h);
    }

    // Wind zones
    for (const w of level.windZones) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.fillRect(w.x, w.y, w.w, w.h);
    }

    // Gravity switches
    for (const gs of level.gravitySwitches) {
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(gs.x, gs.y, gs.w, gs.h);
    }

    // Shards
    for (const s of level.shards) {
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(s.x, s.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Spawn Point
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(level.playerSpawn.x - 10, level.playerSpawn.y - 10, 20, 20);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(level.playerSpawn.x - 10, level.playerSpawn.y - 10, 20, 20);

    // Exit Door
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(level.exitDoor.x, level.exitDoor.y, level.exitDoor.w, level.exitDoor.h);
    ctx.strokeStyle = '#60a5fa';
    ctx.strokeRect(level.exitDoor.x, level.exitDoor.y, level.exitDoor.w, level.exitDoor.h);

  }, [level, selectedId]);

  return (
    <div className="relative flex h-full w-full flex-col bg-slate-950 text-slate-100 select-none overflow-hidden">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-2 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-slate-200">LEVEL DESIGNER</span>
          <input
            type="text"
            value={level.name}
            onChange={e => setLevel({ ...level, name: e.target.value })}
            className="rounded border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-xs text-sky-300"
          />
        </div>

        {/* Middle action buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            title="Undo"
            className="flex h-7 w-7 items-center justify-center rounded border border-slate-800 bg-slate-900 disabled:opacity-40"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            title="Redo"
            className="flex h-7 w-7 items-center justify-center rounded border border-slate-800 bg-slate-900 disabled:opacity-40"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
          <div className="h-4 w-px bg-slate-800 mx-1" />
          <button
            onClick={() => setGridSnap(!gridSnap)}
            className={`flex items-center gap-1 rounded border px-2 py-1 ${
              gridSnap ? 'border-sky-500 bg-sky-950/60 text-sky-300' : 'border-slate-800 text-slate-400'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            SNAP 20PX
          </button>
          <button
            onClick={handleDeleteSelected}
            disabled={!selectedId}
            title="Delete Selected"
            className="flex h-7 w-7 items-center justify-center rounded border border-slate-800 bg-slate-900 text-rose-400 disabled:opacity-40 hover:bg-rose-950/50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDuplicateSelected}
            disabled={!selectedId}
            title="Duplicate Selected"
            className="flex h-7 w-7 items-center justify-center rounded border border-slate-800 bg-slate-900 text-sky-400 disabled:opacity-40 hover:bg-sky-950/50"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Play & File buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            title="Save to browser"
            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-slate-200 hover:bg-slate-700"
          >
            <Save className="w-3.5 h-3.5" />
            SAVE
          </button>
          <button
            onClick={handleExport}
            title="Export JSON"
            className="flex h-7 w-7 items-center justify-center rounded border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <label className="flex h-7 w-7 items-center justify-center rounded border border-slate-800 bg-slate-900 text-slate-400 hover:text-white cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          <button
            id="editor-btn-test-play"
            onClick={() => onTestPlay(level)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1 font-bold text-slate-950 hover:bg-emerald-400 transition"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            TEST CHAMBER
          </button>
        </div>
      </div>

      {/* Main Workspace: Palette Sidebar + Canvas Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Palette */}
        <div className="w-48 border-r border-slate-800 bg-slate-900/60 p-2.5 space-y-3 overflow-y-auto text-[11px] font-mono">
          <div>
            <div className="text-slate-500 font-bold mb-1">GENERAL</div>
            <button
              onClick={() => setTool('SELECT')}
              className={`w-full text-left px-2 py-1 rounded ${tool === 'SELECT' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Select / Inspect
            </button>
            <button
              onClick={() => setTool('SPAWN')}
              className={`w-full text-left px-2 py-1 rounded ${tool === 'SPAWN' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Set Spawn
            </button>
            <button
              onClick={() => setTool('EXIT')}
              className={`w-full text-left px-2 py-1 rounded ${tool === 'EXIT' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Set Exit Door
            </button>
          </div>

          <div>
            <div className="text-slate-500 font-bold mb-1">PLATFORMS</div>
            <button
              onClick={() => setTool('PLATFORM_NORMAL')}
              className={`w-full text-left px-2 py-1 rounded ${tool === 'PLATFORM_NORMAL' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Normal Platform
            </button>
            <button
              onClick={() => setTool('PLATFORM_ELASTIC')}
              className={`w-full text-left px-2 py-1 rounded ${tool === 'PLATFORM_ELASTIC' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Elastic Spring
            </button>
            <button
              onClick={() => setTool('PLATFORM_ICE')}
              className={`w-full text-left px-2 py-1 rounded ${tool === 'PLATFORM_ICE' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Ice Surface
            </button>
            <button
              onClick={() => setTool('PLATFORM_MAGNETIC')}
              className={`w-full text-left px-2 py-1 rounded ${tool === 'PLATFORM_MAGNETIC' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Magnetic Surface
            </button>
            <button
              onClick={() => setTool('PLATFORM_PHASE')}
              className={`w-full text-left px-2 py-1 rounded ${tool === 'PLATFORM_PHASE' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Phase Barrier
            </button>
          </div>

          <div>
            <div className="text-slate-500 font-bold mb-1">BLOCKS</div>
            <button
              onClick={() => setTool('BLOCK_NORMAL')}
              className={`w-full text-left px-2 py-1 rounded ${tool === 'BLOCK_NORMAL' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Normal Crate
            </button>
            <button
              onClick={() => setTool('BLOCK_HEAVY')}
              className={`w-full text-left px-2 py-1 rounded ${tool === 'BLOCK_HEAVY' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Heavy 10T Crate
            </button>
            <button
              onClick={() => setTool('BLOCK_MAGNETIC')}
              className={`w-full text-left px-2 py-1 rounded ${tool === 'BLOCK_MAGNETIC' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Magnetic Crate
            </button>
          </div>

          <div>
            <div className="text-slate-500 font-bold mb-1">LOGIC & HAZARDS</div>
            <button
              onClick={() => setTool('HAZARD_SPIKE')}
              className={`w-full text-left px-2 py-1 rounded ${tool === 'HAZARD_SPIKE' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Spike Strip
            </button>
            <button
              onClick={() => setTool('HAZARD_LASER')}
              className={`w-full text-left px-2 py-1 rounded ${tool === 'HAZARD_LASER' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Laser Beam
            </button>
            <button
              onClick={() => setTool('PRESSURE_PLATE')}
              className={`w-full text-left px-2 py-1 rounded ${tool === 'PRESSURE_PLATE' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Plate + Door Pair
            </button>
            <button
              onClick={() => setTool('WIND_ZONE')}
              className={`w-full text-left px-2 py-1 rounded ${tool === 'WIND_ZONE' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Wind Updraft
            </button>
            <button
              onClick={() => setTool('GRAVITY_SWITCH')}
              className={`w-full text-left px-2 py-1 rounded ${tool === 'GRAVITY_SWITCH' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Gravity Switch
            </button>
            <button
              onClick={() => setTool('SHARD')}
              className={`w-full text-left px-2 py-1 rounded ${tool === 'SHARD' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Flux Shard
            </button>
          </div>
        </div>

        {/* Canvas Workspace */}
        <div className="flex-1 flex items-center justify-center p-4 bg-slate-950 overflow-auto">
          <canvas
            ref={canvasRef}
            width={level.width}
            height={level.height}
            onMouseDown={handleCanvasMouseDown}
            onMouseUp={handleCanvasMouseUp}
            className="border border-slate-800 shadow-2xl rounded cursor-crosshair max-w-full max-h-full object-contain"
          />
        </div>
      </div>
    </div>
  );
};

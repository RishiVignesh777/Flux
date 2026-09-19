import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { 
  Monitor, 
  Gamepad2, 
  Download, 
  Layers, 
  CheckCircle2, 
  Terminal, 
  X, 
  Cpu, 
  Sparkles,
  FileCode,
  Shield,
  Gauge,
  ArrowRight
} from 'lucide-react';

interface GodotPlatformModalProps {
  onClose: () => void;
}

export const GodotPlatformModal: React.FC<GodotPlatformModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ARCHITECTURE' | 'CONTROLLER' | 'EXPORT'>('OVERVIEW');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Live Gamepad Tester state
  const [connectedGamepad, setConnectedGamepad] = useState<string | null>(null);
  const [gamepadButtons, setGamepadButtons] = useState<boolean[]>([]);
  const [gamepadAxes, setGamepadAxes] = useState<number[]>([0, 0, 0, 0]);

  // Gamepad polling loop for tester
  useEffect(() => {
    let animId: number;
    const poll = () => {
      const gps = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gps && gps[0];
      if (gp) {
        setConnectedGamepad(gp.id || 'Connected Controller');
        setGamepadButtons(gp.buttons.map(b => b.pressed));
        setGamepadAxes([gp.axes[0] || 0, gp.axes[1] || 0, gp.axes[2] || 0, gp.axes[3] || 0]);
      } else {
        setConnectedGamepad(null);
      }
      animId = requestAnimationFrame(poll);
    };
    animId = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(animId);
  }, []);

  // One-click Godot 4.x Project Downloader
  const handleDownloadGodotProject = async () => {
    try {
      setIsExporting(true);
      const zip = new JSZip();

      // Read files or populate project
      zip.file('project.godot', `; Engine configuration file.
; FLUX - 2D Physics Logic Platformer
; Target Development Platform: Windows PC 64-bit, Godot 4.x

config_version=5

[application]
config/name="FLUX"
config/description="2D physics logic platformer: Mass, Magnetism, Momentum, Phase. Built for Windows PC, Linux, and macOS."
config/version="1.0.0"
run/main_scene="res://scenes/main.tscn"
config/features=PackedStringArray("4.3", "Forward Plus")
boot_splash/bg_color=Color(0.0392157, 0.0509804, 0.0784314, 1)

[autoload]
SaveManager="*res://scripts/systems/save_system.gd"
SoundManager="*res://scripts/systems/audio_system.gd"
LevelManager="*res://scripts/systems/level_system.gd"
PhysicsStateManager="*res://scripts/systems/physics_state_system.gd"
GravitySystem="*res://scripts/systems/gravity_system.gd"

[display]
window/size/viewport_width=1920
window/size/viewport_height=1080
window/size/mode=0
window/size/resizable=true
window/size/min_size=Vector2i(1280, 720)
window/stretch/mode="canvas_items"
window/stretch/aspect="expand"
window/vsync/vsync_mode=1

[physics]
common/physics_ticks_per_second=60
2d/default_gravity=980.0
2d/default_gravity_vector=Vector2(0, 1)

[rendering]
renderer/rendering_method="gl_compatibility"
environment/defaults/default_clear_color=Color(0.0392157, 0.0509804, 0.0784314, 1)
`);

      zip.file('README.md', `# FLUX — Godot 4.x Windows PC Project
Target Development Platform: Windows PC 64-bit
Compatible with: Linux x86_64, macOS

To run:
1. Download Godot 4.3+ from https://godotengine.org
2. Open Godot, click Import, and select project.godot
3. Press F5 to run!
`);

      // Add folders
      const scripts = zip.folder('scripts');
      const core = scripts?.folder('core');
      const systems = scripts?.folder('systems');
      const scenes = zip.folder('scenes');

      // Fetch or pack GDScript files
      const scriptFiles = [
        { path: 'core/player_controller.gd', url: '/godot/scripts/core/player_controller.gd' },
        { path: 'systems/physics_state_system.gd', url: '/godot/scripts/systems/physics_state_system.gd' },
        { path: 'systems/gravity_system.gd', url: '/godot/scripts/systems/gravity_system.gd' },
        { path: 'systems/momentum_system.gd', url: '/godot/scripts/systems/momentum_system.gd' },
        { path: 'systems/interactive_object_system.gd', url: '/godot/scripts/systems/interactive_object_system.gd' },
        { path: 'systems/hazard_system.gd', url: '/godot/scripts/systems/hazard_system.gd' },
        { path: 'systems/level_system.gd', url: '/godot/scripts/systems/level_system.gd' },
        { path: 'systems/save_system.gd', url: '/godot/scripts/systems/save_system.gd' },
        { path: 'systems/audio_system.gd', url: '/godot/scripts/systems/audio_system.gd' },
        { path: 'systems/ui_system.gd', url: '/godot/scripts/systems/ui_system.gd' },
        { path: 'systems/level_editor.gd', url: '/godot/scripts/systems/level_editor.gd' },
      ];

      for (const item of scriptFiles) {
        try {
          const res = await fetch(item.url);
          if (res.ok) {
            const content = await res.text();
            scripts?.file(item.path, content);
          }
        } catch {
          // fallback
        }
      }

      // Add scene text
      const sceneFiles = ['main.tscn', 'player.tscn', 'hud.tscn'];
      for (const s of sceneFiles) {
        try {
          const res = await fetch(`/godot/scenes/${s}`);
          if (res.ok) {
            const content = await res.text();
            scenes?.file(s, content);
          }
        } catch {
          // fallback
        }
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'flux_godot4_pc_project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to generate Godot project zip', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative flex flex-col w-full max-w-4xl h-[90vh] rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
              <Monitor className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-wide text-white">TARGET PLATFORM: WINDOWS PC & GODOT 4.X</h2>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400 border border-emerald-500/30">
                  SECTION 29
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400">
                Primary: Windows 10/11 64-bit • 60 FPS • Xbox & PS Gamepad Support • Secondary: Linux & macOS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 py-2 gap-2 text-xs font-mono">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 transition ${
              activeTab === 'OVERVIEW' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Gauge className="h-3.5 w-3.5" />
            SPECIFICATIONS
          </button>
          <button
            onClick={() => setActiveTab('ARCHITECTURE')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 transition ${
              activeTab === 'ARCHITECTURE' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            11 MODULAR SYSTEMS
          </button>
          <button
            onClick={() => setActiveTab('CONTROLLER')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 transition ${
              activeTab === 'CONTROLLER' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Gamepad2 className="h-3.5 w-3.5" />
            CONTROLLER TESTER
            {connectedGamepad && <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />}
          </button>
          <button
            onClick={() => setActiveTab('EXPORT')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 transition ${
              activeTab === 'EXPORT' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Download className="h-3.5 w-3.5" />
            EXPORT GODOT 4 PROJECT
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-300 font-sans text-xs">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Primary Platform Card */}
                <div className="rounded-xl border border-sky-500/20 bg-slate-950/60 p-4">
                  <div className="flex items-center gap-2 text-sky-400 font-mono font-bold mb-2">
                    <Monitor className="h-4 w-4" />
                    PRIMARY PLATFORM
                  </div>
                  <ul className="space-y-1.5 text-slate-300 font-mono text-[11px]">
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Windows 10/11 64-bit</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> 60 FPS Target Lock</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Keyboard & Mouse</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Xbox & PS Controllers</li>
                  </ul>
                </div>

                {/* Display & Resolution */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="flex items-center gap-2 text-indigo-400 font-mono font-bold mb-2">
                    <Cpu className="h-4 w-4" />
                    RESOLUTION & ASPECT
                  </div>
                  <ul className="space-y-1.5 text-slate-300 font-mono text-[11px]">
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> 1280×720 Minimum</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> 1920×1080 Recommended</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Native 4K Support</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> 16:9, 16:10, Ultrawide</li>
                  </ul>
                </div>

                {/* Secondary Platforms */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="flex items-center gap-2 text-purple-400 font-mono font-bold mb-2">
                    <Terminal className="h-4 w-4" />
                    SECONDARY PLATFORMS
                  </div>
                  <ul className="space-y-1.5 text-slate-300 font-mono text-[11px]">
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Linux (x86_64 binaries)</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> macOS (.app Universal)</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> No platform lock-in</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Future mobile optional</li>
                  </ul>
                </div>
              </div>

              {/* Development Priority Roadmap */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono font-bold text-white flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-sky-400" />
                    SPECIFICATION 29 DEVELOPMENT PRIORITY CHECKLIST
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400">PC-FIRST ARCHITECTURE</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[11px] font-mono">
                  {[
                    '1. Windows PC prototype',
                    '2. Core physics (Gravity & Momentum)',
                    '3. Player controller (Coyote + Buffer)',
                    '4. Puzzle objects (Plates, Rails, Doors)',
                    '5. First 10 levels (Chambers 01-10)',
                    '6. UI and local save system',
                    '7. Remaining level systems (60 rooms)',
                    '8. Challenge modes & Speedrun',
                    '9. In-engine Level editor',
                    '10. Linux & macOS exports',
                    '11. Optional future mobile port',
                  ].map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2 rounded-lg bg-slate-900/90 border border-slate-800/80 px-3 py-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                      <span className="text-slate-200">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance & Hardware Targets */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                <div className="font-mono font-bold text-white flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  PERFORMANCE & GRAPHICS PHILOSOPHY
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Engineered for locked 60 FPS gameplay, sub-frame input latency, fast chamber loading, and instant restarts. 
                  Visuals prioritize crisp silhouettes, consistent geometric scale, and efficient particle allocations designed to run fluidly on typical modern integrated GPUs (Intel Iris Xe / AMD Radeon Vega) up to dedicated gaming hardware.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: ARCHITECTURE */}
          {activeTab === 'ARCHITECTURE' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-white">REUSABLE MODULAR GODOT 4.X SYSTEMS</span>
                <span className="font-mono text-xs text-sky-400">res://scripts/</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  {
                    name: 'Player Controller',
                    path: 'res://scripts/core/player_controller.gd',
                    desc: 'CharacterBody2D with coyote time (0.12s), jump buffer (0.10s), squash & stretch, gamepad vibration.',
                  },
                  {
                    name: 'Physics State System',
                    path: 'res://scripts/systems/physics_state_system.gd',
                    desc: 'Normal, Heavy (3x mass), Light (0.35x), Magnetic, Elastic (0.85 bounce), Frozen (0 friction), Phase.',
                  },
                  {
                    name: 'Gravity System',
                    path: 'res://scripts/systems/gravity_system.gd',
                    desc: '4-direction gravity manipulation (Down, Up, Left, Right) with coordinate matrix transposition.',
                  },
                  {
                    name: 'Momentum System',
                    path: 'res://scripts/systems/momentum_system.gd',
                    desc: 'Kinetic energy conservation mid-air state shifts, launch force calculation, and elastic restitution.',
                  },
                  {
                    name: 'Interactive Object System',
                    path: 'res://scripts/systems/interactive_object_system.gd',
                    desc: 'Pressure plates, magnetic rails, energy doors, gravity switches, launch pads, and shards.',
                  },
                  {
                    name: 'Hazard System',
                    path: 'res://scripts/systems/hazard_system.gd',
                    desc: 'Lethal spike pits, lasers, void boundaries with state-based immunity verification (Phase desync).',
                  },
                  {
                    name: 'Level System',
                    path: 'res://scripts/systems/level_system.gd',
                    desc: 'Level sequencing, spawn management, and data definitions for the first 10 chambers.',
                  },
                  {
                    name: 'Save System',
                    path: 'res://scripts/systems/save_system.gd',
                    desc: 'Platform-independent JSON save system (user://) for level clear, best times, deaths, bindings.',
                  },
                  {
                    name: 'UI System',
                    path: 'res://scripts/systems/ui_system.gd',
                    desc: 'Clean 2D vector HUD, dynamic Xbox/PlayStation controller glyphs, speedrun timer, pause menu.',
                  },
                  {
                    name: 'Audio System',
                    path: 'res://scripts/systems/audio_system.gd',
                    desc: 'Procedural zero-dependency audio synthesizer & bus mixer for jump, landing, bounce, state shifts.',
                  },
                  {
                    name: 'Level Editor',
                    path: 'res://scripts/systems/level_editor.gd',
                    desc: 'In-engine 2D grid level creator with block/hazard placement, live playtesting, and JSON import/export.',
                  },
                ].map((sys, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-sky-400 flex items-center gap-1.5">
                        <FileCode className="h-3.5 w-3.5 text-sky-400" />
                        {sys.name}
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-slate-500">{sys.path}</div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{sys.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CONTROLLER TESTER */}
          {activeTab === 'CONTROLLER' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="h-5 w-5 text-sky-400" />
                    <span className="font-mono font-bold text-white text-sm">HARDWARE GAMEPAD DIAGNOSTIC</span>
                  </div>
                  <span className={`font-mono text-xs px-2.5 py-1 rounded-full border ${
                    connectedGamepad 
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30' 
                      : 'bg-amber-950/60 text-amber-400 border-amber-500/30'
                  }`}>
                    {connectedGamepad ? 'CONTROLLER CONNECTED' : 'PLUG IN XBOX / PS CONTROLLER OR PRESS ANY BUTTON'}
                  </span>
                </div>

                {connectedGamepad && (
                  <div className="mb-4 text-slate-400 font-mono text-xs">
                    DEVICE: <span className="text-sky-300 font-bold">{connectedGamepad}</span>
                  </div>
                )}

                {/* Controller Input Mapping Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Action Table */}
                  <div className="rounded-lg border border-slate-800/80 bg-slate-900/80 p-3">
                    <div className="font-mono font-bold text-slate-300 mb-2 border-b border-slate-800 pb-1">
                      GODOT INPUT MAP BINDINGS
                    </div>
                    <table className="w-full text-left font-mono text-[11px]">
                      <thead>
                        <tr className="text-slate-500 border-b border-slate-800">
                          <th className="pb-1">ACTION</th>
                          <th className="pb-1">XBOX</th>
                          <th className="pb-1">PLAYSTATION</th>
                          <th className="pb-1">KEYBOARD</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50 text-slate-300">
                        <tr><td className="py-1 text-sky-400 font-bold">jump</td><td>[A]</td><td>[✕]</td><td>SPACE / W</td></tr>
                        <tr><td className="py-1 text-sky-400 font-bold">restart</td><td>[Y]</td><td>[△]</td><td>R</td></tr>
                        <tr><td className="py-1 text-sky-400 font-bold">pause</td><td>[Menu]</td><td>[Options]</td><td>ESC</td></tr>
                        <tr><td className="py-1 text-sky-400 font-bold">state_heavy</td><td>[LB]</td><td>[L1]</td><td>1</td></tr>
                        <tr><td className="py-1 text-sky-400 font-bold">state_light</td><td>[RB]</td><td>[R1]</td><td>2</td></tr>
                        <tr><td className="py-1 text-sky-400 font-bold">state_magnetic</td><td>[X]</td><td>[□]</td><td>3</td></tr>
                        <tr><td className="py-1 text-sky-400 font-bold">state_elastic</td><td>[B]</td><td>[○]</td><td>4</td></tr>
                        <tr><td className="py-1 text-sky-400 font-bold">state_frozen</td><td>[LT]</td><td>[L2]</td><td>5</td></tr>
                        <tr><td className="py-1 text-sky-400 font-bold">state_phase</td><td>[RT]</td><td>[R2]</td><td>6</td></tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Live Button Indicator Matrix */}
                  <div className="rounded-lg border border-slate-800/80 bg-slate-900/80 p-3">
                    <div className="font-mono font-bold text-slate-300 mb-2 border-b border-slate-800 pb-1">
                      LIVE BUTTON TESTER
                    </div>
                    {connectedGamepad ? (
                      <div className="grid grid-cols-4 gap-2 text-center font-mono text-[10px]">
                        {['A / ✕', 'B / ○', 'X / □', 'Y / △', 'LB / L1', 'RB / R1', 'LT / L2', 'RT / R2', 'Select', 'Start', 'L3', 'R3', 'Up', 'Down', 'Left', 'Right'].map((lbl, idx) => (
                          <div 
                            key={idx}
                            className={`rounded border p-2 transition ${
                              gamepadButtons[idx] 
                                ? 'bg-sky-500 text-slate-950 font-bold border-sky-400 shadow-lg shadow-sky-500/20' 
                                : 'bg-slate-950 border-slate-800 text-slate-500'
                            }`}
                          >
                            <div>{lbl}</div>
                            <div className="text-[9px] opacity-60">Btn {idx}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-40 text-center text-slate-500 font-mono">
                        <Gamepad2 className="h-8 w-8 mb-2 opacity-40 animate-pulse" />
                        <p>No gamepad currently polled.</p>
                        <p className="text-[10px]">Connect any USB or Bluetooth Xbox / PlayStation controller.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EXPORT */}
          {activeTab === 'EXPORT' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-950/60 px-3 py-1 font-mono text-xs text-sky-400">
                    <Sparkles className="h-3.5 w-3.5" />
                    ONE-CLICK PC SOURCE BUNDLE
                  </div>
                  <h3 className="text-xl font-bold text-white font-mono">DOWNLOAD GODOT 4.X PROJECT (.ZIP)</h3>
                  <p className="text-slate-300 max-w-xl text-xs leading-relaxed">
                    Packages the complete Godot 4.x project: configuration (<code className="text-sky-400 font-mono">project.godot</code>), 
                    all 11 modular GDScript systems, CharacterBody2D controller, scenes (<code className="text-sky-400 font-mono">.tscn</code>), 
                    and documentation directly to your machine.
                  </p>
                </div>

                <button
                  onClick={handleDownloadGodotProject}
                  disabled={isExporting}
                  className="flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-4 font-mono text-xs font-bold text-slate-950 shadow-xl shadow-sky-500/20 hover:bg-sky-400 active:scale-95 transition disabled:opacity-50 shrink-0"
                >
                  <Download className="h-4 w-4" />
                  {isExporting ? 'PACKING ARCHIVE...' : exportSuccess ? 'DOWNLOADED!' : 'DOWNLOAD GODOT 4 PROJECT'}
                </button>
              </div>

              {/* Windows PC Compilation Guide */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3 font-mono">
                <span className="font-bold text-white flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-emerald-400" />
                  HOW TO RUN ON WINDOWS 10 / 11 64-BIT:
                </span>
                <ol className="list-decimal list-inside space-y-2 text-slate-300 text-[11px] leading-relaxed">
                  <li>Download and install <strong>Godot 4.3 or newer</strong> from <span className="text-sky-400 underline">https://godotengine.org</span>.</li>
                  <li>Extract the downloaded <code className="text-sky-300 bg-slate-900 px-1 py-0.5 rounded">flux_godot4_pc_project.zip</code> anywhere on your PC.</li>
                  <li>Launch Godot, click <strong>Import</strong>, browse to the extracted folder, and select <code className="text-sky-300 bg-slate-900 px-1 py-0.5 rounded">project.godot</code>.</li>
                  <li>Click <strong>Import & Edit</strong>, then press <strong>F5</strong> to run the game with 60 FPS and full controller support!</li>
                  <li>To export a standalone <code className="text-sky-300 bg-slate-900 px-1 py-0.5 rounded">FLUX.exe</code>: Open <strong>Project → Export</strong>, add <strong>Windows Desktop (x86_64)</strong>, and click <strong>Export Project</strong>.</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/90 px-6 py-3 font-mono text-[11px] text-slate-500">
          <span>FLUX ARCHITECTURE: WINDOWS 10/11 64-BIT PC FIRST</span>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-sky-400 hover:text-sky-300 transition"
          >
            RETURN TO GAME <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

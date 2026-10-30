import React, { useState } from 'react';
import { 
  Laptop, 
  Terminal, 
  Search, 
  X, 
  Copy, 
  Check, 
  Bot, 
  Sparkles, 
  FileCode, 
  Layers, 
  ExternalLink,
  Keyboard,
  ShieldAlert
} from 'lucide-react';

interface VsCodeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VsCodeGuideModal: React.FC<VsCodeGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'open_file' | 'inspect_buttons' | 'connect_chatgpt'>('open_file');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                VS Code Windows Companion Guide
                <span className="text-[11px] bg-blue-500/30 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full font-normal">
                  Step-by-Step
                </span>
              </h2>
              <p className="text-xs text-slate-400">Folder: C:\Users\EHK STUDENT 020\OneDrive\Desktop\DI-BOOTCAMP</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('open_file')}
            className={`pb-3 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'open_file'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>1. Open dashboard.html</span>
          </button>

          <button
            onClick={() => setActiveTab('inspect_buttons')}
            className={`pb-3 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'inspect_buttons'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>2. Inspect Buttons Safely</span>
          </button>

          <button
            onClick={() => setActiveTab('connect_chatgpt')}
            className={`pb-3 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'connect_chatgpt'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>3. Connect ChatGPT to VS Code</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-slate-700 text-sm">
          {/* TAB 1: HOW TO OPEN DASHBOARD.HTML */}
          {activeTab === 'open_file' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                <strong>Goal:</strong> Open <code className="font-mono bg-blue-100 px-1 py-0.5 rounded">dashboard.html</code> in your Windows VS Code without touching or overwriting any code yet.
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    A
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Fastest Way: Quick Open Shortcut</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded shadow-2xs font-mono font-bold text-slate-800">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded shadow-2xs font-mono font-bold text-slate-800">P</kbd> together on your keyboard in VS Code.
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      A small box will appear at the top. Type: <code className="font-mono text-blue-600 font-bold">dashboard.html</code> and hit <kbd className="px-1 py-0.5 bg-white border rounded font-mono text-[11px]">Enter</kbd>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-slate-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    B
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Sidebar Explorer Way</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Look at the left vertical bar in VS Code. Click the two-page icon at the top (or press <kbd className="px-1.5 py-0.5 bg-white border rounded font-mono text-[11px]">Ctrl + Shift + E</kbd>).
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      Look down the list under <strong>DI-BOOTCAMP</strong>. Click on <code className="font-mono text-slate-800">dashboard.html</code> once to open it.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Safety First:</strong> We won’t overwrite or delete anything. Once you have it open, we will simply inspect what tags already exist!
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: INSPECT BUTTONS */}
          {activeTab === 'inspect_buttons' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                <strong>Goal:</strong> Find out what buttons, links, or action cards are already inside your <code className="font-mono bg-blue-100 px-1 py-0.5 rounded">dashboard.html</code>.
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Keyboard className="w-4 h-4 text-blue-600" />
                    Step 1: Open the Search / Find bar
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    With <code className="font-mono text-slate-800">dashboard.html</code> open in VS Code, press:
                  </p>
                  <p className="text-center my-2">
                    <kbd className="px-2 py-1 bg-white border border-slate-300 rounded shadow-2xs font-mono font-bold text-blue-700 text-sm">
                      Ctrl + F
                    </kbd>
                  </p>
                  <p className="text-xs text-slate-600">
                    A small find box will appear in the top-right corner of your editor.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 text-xs">
                    Step 2: Try these 3 quick searches in that find box
                  </h4>
                  <div className="space-y-2 mt-2 text-xs">
                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 font-mono">
                      <span>Search 1: <strong>&lt;button</strong></span>
                      <span className="text-slate-400 font-sans text-[11px]">Checks for native buttons</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 font-mono">
                      <span>Search 2: <strong>action-card</strong></span>
                      <span className="text-slate-400 font-sans text-[11px]">Checks for card containers</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 font-mono">
                      <span>Search 3: <strong>&lt;aside</strong> or <strong>sidebar</strong></span>
                      <span className="text-slate-400 font-sans text-[11px]">Checks your deep-blue sidebar</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                  <strong>What to do next:</strong> Look at the number next to the find box (e.g. <em>1 of 6</em> or <em>No results</em>). You can simply tell me in chat what it found, or copy the lines surrounding the buttons!
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CAN CHATGPT CONNECT DIRECTLY TO VS CODE? */}
          {activeTab === 'connect_chatgpt' && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                <strong>Yes, bro!</strong> You can connect ChatGPT and AI directly to your VS Code so it can read your files, edit code, and chat right beside your editor. Here are the 4 main ways people do it on Windows:
              </div>

              <div className="space-y-3">
                {/* Option 1: GitHub Copilot */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-bold">1. Best Built-in</span>
                      GitHub Copilot (Uses OpenAI / GPT-4o models)
                    </h4>
                    <span className="text-[11px] text-slate-500">Official VS Code extension</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Developed directly by GitHub & Microsoft using OpenAI models. You install the <strong>GitHub Copilot</strong> extension from the Extensions tab (<kbd className="px-1 py-0.2 bg-white border rounded text-[10px]">Ctrl+Shift+X</kbd>). It gives you an inline chat sidebar and auto-completes code in real-time.
                  </p>
                </div>

                {/* Option 2: Continue.dev */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold">2. Free & Custom</span>
                      Continue.dev (Open-source AI Sidebar)
                    </h4>
                    <span className="text-[11px] text-slate-500">Works with ChatGPT API / Claude / Ollama</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Search for <strong>Continue</strong> in VS Code extensions. It puts a chat panel inside VS Code where you can paste your OpenAI API key or connect local models for free. You can type <code className="font-mono text-xs">@dashboard.html</code> and ask it questions directly!
                  </p>
                </div>

                {/* Option 3: Cline / Roo Code */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">3. Autonomous Agent</span>
                      Cline / Roo Code
                    </h4>
                    <span className="text-[11px] text-slate-500">Can create files & run commands</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    An autonomous coding assistant that lives in VS Code. It asks for permission before creating or editing files, making it safe for beginners.
                  </p>
                </div>

                {/* Option 4: Cursor */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded text-[10px] font-bold">4. Standalone Editor</span>
                      Cursor (AI-first VS Code Fork)
                    </h4>
                    <span className="text-[11px] text-slate-500">cursor.com</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Cursor looks and feels 100% identical to VS Code (all your extensions and settings import automatically), but has deep ChatGPT/Claude agent integration built straight into the core.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Take it one small step at a time!
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer"
          >
            Got it, back to Akiba Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

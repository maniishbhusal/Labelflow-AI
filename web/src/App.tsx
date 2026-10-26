import type { FC } from 'react';
import { Sparkles, Terminal, CheckCircle2 } from 'lucide-react';

const App: FC = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 gap-6 p-4">
      {/* Icon Card Container */}
      <div className="flex bg-white p-6 rounded-2xl shadow-md items-center gap-4 border border-slate-200">
        <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
          <Terminal size={28} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            Environment Ready <Sparkles size={18} className="text-amber-500 fill-amber-500" />
          </h1>
          <p className="text-sm text-slate-500">React + Vite + TS + Tailwind + Lucide</p>
        </div>
      </div>

      {/* Success Badge */}
      <div className="flex items-center gap-2 text-emerald-600 font-semibold bg-emerald-50 px-4 py-2 rounded-full text-sm border border-emerald-200">
        <CheckCircle2 size={16} /> Everything is working perfectly!
      </div>
    </div>
  );
};

export default App;
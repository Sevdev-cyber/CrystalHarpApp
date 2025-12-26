
import React, { useState } from 'react';
import { getHealingMessage } from '../services/geminiService';

const MindfulChat: React.FC = () => {
  const [mood, setMood] = useState('');
  const [intent, setIntent] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mood || !intent) return;

    setIsLoading(true);
    const healingText = await getHealingMessage(mood, intent);
    setResponse(healingText);
    setIsLoading(false);
  };

  const reset = () => {
    setResponse(null);
    setMood('');
    setIntent('');
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold mb-4 text-iridescent italic">
          Sacred Intentions
        </h2>
        <p className="text-slate-400 tracking-wide font-medium">Whisper your heart's longing to the crystal light.</p>
      </div>

      <div className="w-full max-w-lg bg-white/60 backdrop-blur-2xl rounded-[2.5rem] p-10 border border-white shadow-xl shadow-slate-200/50">
        {!response ? (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Current State of Being</label>
              <input 
                type="text"
                placeholder="How does your heart feel today?"
                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all text-sm"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Soul Aspiration</label>
              <input 
                type="text"
                placeholder="What intention shall we set?"
                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all text-sm"
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
              />
            </div>
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full relative group overflow-hidden bg-gradient-to-r from-indigo-400 to-rose-400 hover:scale-[1.02] text-white font-bold py-5 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              {isLoading ? (
                <span className="flex items-center justify-center gap-3 tracking-[0.2em] text-xs uppercase">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Aligning Frequencies
                </span>
              ) : <span className="tracking-[0.2em] text-xs uppercase">Receive Divine Wisdom</span>}
            </button>
          </form>
        ) : (
          <div className="text-center animate-in fade-in zoom-in duration-1000">
            <div className="mb-10 p-8 bg-slate-50/50 rounded-3xl italic text-xl font-light text-slate-700 leading-relaxed border-t-2 border-indigo-100 shadow-inner">
              <span className="text-slate-300 text-5xl font-serif leading-none mr-2">“</span>
              {response}
              <span className="text-slate-300 text-5xl font-serif leading-none ml-2">”</span>
            </div>
            <button 
              onClick={reset}
              className="px-8 py-3 rounded-full text-slate-400 hover:text-indigo-500 transition-all text-[10px] uppercase tracking-[0.3em] font-black border border-slate-100 hover:bg-slate-50"
            >
              Begin New Journey
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MindfulChat;

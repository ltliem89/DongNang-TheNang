import React, { useState } from 'react';
import { ActiveTab, Language } from './types';
import { Header } from './components/Header';
import { ZoneKinetic } from './components/ZoneKinetic';
import { ZonePotential } from './components/ZonePotential';
import { ZoneHydroElectric } from './components/ZoneHydroElectric';
import { ZoneChallenges } from './components/ZoneChallenges';
import { DataSummaryModal } from './components/DataSummaryModal';
import { BookOpen, Sparkles, Heart } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('kinetic');
  const [lang, setLang] = useState<Language>('vi');
  const [isTheoryOpen, setIsTheoryOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        setLang={setLang}
        onOpenTheory={() => setIsTheoryOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-6 space-y-6">
        {activeTab === 'kinetic' && <ZoneKinetic lang={lang} />}
        {activeTab === 'potential' && <ZonePotential lang={lang} />}
        {activeTab === 'hydro' && <ZoneHydroElectric lang={lang} />}
        {activeTab === 'challenges' && (
          <ZoneChallenges
            lang={lang}
            onNavigateZone={(tab) => setActiveTab(tab)}
          />
        )}
      </main>

      {/* Theory & Formula Reference Modal */}
      <DataSummaryModal
        isOpen={isTheoryOpen}
        onClose={() => setIsTheoryOpen(false)}
        lang={lang}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-4 text-slate-400 text-xs text-center mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 font-medium">
            <span>Mô phỏng Khoa học tự nhiên 9 — Kết nối tri thức với cuộc sống</span>
          </p>
          <p className="text-[11px] text-slate-400">
            Mô hình lí tưởng giáo dục: Wđ = ½·m·v², Wt = m·g·h (g = 10 N/kg), Wc = Wt + Wđ = const
          </p>
        </div>
      </footer>
    </div>
  );
}


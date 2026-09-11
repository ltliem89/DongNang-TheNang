import React from 'react';
import { ActiveTab, Language } from '../types';
import { DICTIONARY } from '../locales/i18n';
import { Gauge, Droplets, Zap, HelpCircle, Volume2, VolumeX, BookOpen, Globe } from 'lucide-react';
import { getSoundMuted, setSoundMuted } from '../utils/sound';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  onOpenTheory: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  lang,
  setLang,
  onOpenTheory,
}) => {
  const t = DICTIONARY[lang];
  const [muted, setMutedState] = React.useState(getSoundMuted());

  const toggleSound = () => {
    const next = !muted;
    setSoundMuted(next);
    setMutedState(next);
  };

  const toggleLang = () => {
    setLang(lang === 'vi' ? 'en' : 'vi');
  };

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; color: string }[] = [
    {
      id: 'kinetic',
      label: lang === 'vi' ? 'Khu A: Động năng' : 'Zone A: Kinetic',
      icon: <Gauge className="w-4 h-4" />,
      color: 'from-amber-500 to-orange-600',
    },
    {
      id: 'potential',
      label: lang === 'vi' ? 'Khu B: Thế năng' : 'Zone B: Potential',
      icon: <Droplets className="w-4 h-4" />,
      color: 'from-sky-500 to-blue-600',
    },
    {
      id: 'hydro',
      label: lang === 'vi' ? 'Khu C: Thủy điện & Cơ năng' : 'Zone C: Hydro & Mech',
      icon: <Zap className="w-4 h-4" />,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      id: 'challenges',
      label: lang === 'vi' ? 'Thử thách & Ngộ nhận' : 'Challenges',
      icon: <HelpCircle className="w-4 h-4" />,
      color: 'from-purple-500 to-indigo-600',
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
        {/* Top bar: title, badge, action toggles */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 via-sky-500 to-emerald-400 p-0.5 flex items-center justify-center shadow-md shadow-amber-500/10">
              <div className="w-full h-full bg-slate-900 rounded-[7px] flex items-center justify-center">
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  {t.appTitle}
                </h1>
                <span className="hidden md:inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20">
                  KHTN 9
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Controls: Theory modal, sound mute, language */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              id="theory-ref-btn"
              onClick={onOpenTheory}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              title={t.common.theory}
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">{t.common.theory}</span>
            </button>

            <button
              id="mute-toggle-btn"
              onClick={toggleSound}
              className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
                muted
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              id="lang-toggle-btn"
              onClick={toggleLang}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-gradient-to-r from-amber-500/20 to-sky-500/20 hover:from-amber-500/30 hover:to-sky-500/30 border border-slate-700 text-amber-300 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              title="Chuyển đổi ngôn ngữ / Switch language"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{lang === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}</span>
            </button>
          </div>
        </div>

        {/* Navigation tabs */}
        <nav className="flex space-x-1 sm:space-x-2 pt-2 overflow-x-auto scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r text-white shadow-md ' + item.color
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

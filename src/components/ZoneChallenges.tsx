import React, { useState } from 'react';
import { Language, ActiveTab } from '../types';
import { DICTIONARY, CHALLENGES_DATA, MISCONCEPTIONS_DATA } from '../locales/i18n';
import { playSuccessChime, playErrorBuzz } from '../utils/sound';
import {
  CheckCircle,
  XCircle,
  HelpCircle,
  Award,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';

interface ZoneChallengesProps {
  lang: Language;
  onNavigateZone: (tab: ActiveTab) => void;
}

export const ZoneChallenges: React.FC<ZoneChallengesProps> = ({
  lang,
  onNavigateZone,
}) => {
  const t = DICTIONARY[lang];
  const cText = t.challengesZone;

  const [activeSubTab, setActiveSubTab] = useState<'challenges' | 'misconceptions'>('challenges');
  const [currentChallengeIdx, setCurrentChallengeIdx] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [userScore, setUserScore] = useState<number>(0);
  const [answeredMap, setAnsweredMap] = useState<Record<number, { selected: number; isCorrect: boolean }>>({});

  const challenge = CHALLENGES_DATA[currentChallengeIdx];
  const isLastQuestion = currentChallengeIdx === CHALLENGES_DATA.length - 1;

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
  };

  const handleCheckAnswer = () => {
    if (selectedOption === null || isAnswered) return;

    const isCorrect = selectedOption === challenge.correctIndex;
    setIsAnswered(true);

    if (isCorrect) {
      playSuccessChime();
      setUserScore((prev) => prev + 1);
    } else {
      playErrorBuzz();
    }

    setAnsweredMap((prev) => ({
      ...prev,
      [challenge.id]: { selected: selectedOption, isCorrect },
    }));
  };

  const handleNextQuestion = () => {
    if (currentChallengeIdx < CHALLENGES_DATA.length - 1) {
      setCurrentChallengeIdx((prev) => prev + 1);
      const nextId = CHALLENGES_DATA[currentChallengeIdx + 1].id;
      if (answeredMap[nextId]) {
        setSelectedOption(answeredMap[nextId].selected);
        setIsAnswered(true);
      } else {
        setSelectedOption(null);
        setIsAnswered(false);
      }
    }
  };

  const handlePrevQuestion = () => {
    if (currentChallengeIdx > 0) {
      setCurrentChallengeIdx((prev) => prev - 1);
      const prevId = CHALLENGES_DATA[currentChallengeIdx - 1].id;
      setSelectedOption(answeredMap[prevId]?.selected ?? null);
      setIsAnswered(!!answeredMap[prevId]);
    }
  };

  const handleResetQuiz = () => {
    setCurrentChallengeIdx(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setUserScore(0);
    setAnsweredMap({});
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {cText.title}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {cText.subtitle}
          </p>
        </div>

        {/* Subtab Toggle (Challenges vs Misconceptions) */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab('challenges')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'challenges'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {cText.challengeTab} ({userScore}/{CHALLENGES_DATA.length})
          </button>
          <button
            onClick={() => setActiveSubTab('misconceptions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'misconceptions'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {cText.misconceptionTab}
          </button>
        </div>
      </div>

      {/* SUBTAB 1: CHALLENGES */}
      {activeSubTab === 'challenges' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Question Card (8 Cols) */}
          <div className="lg:col-span-8 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5">
            {/* Top Index & Score tracker */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono">
              <span className="text-purple-400 font-bold">
                CÂU HỎI {currentChallengeIdx + 1} / {CHALLENGES_DATA.length}
              </span>
              <span className="text-slate-400">
                {lang === 'vi' ? challenge.titleVi : challenge.titleEn}
              </span>
            </div>

            {/* Question Text */}
            <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
              {lang === 'vi' ? challenge.questionVi : challenge.questionEn}
            </h3>

            {/* Options List */}
            <div className="space-y-2.5">
              {(lang === 'vi' ? challenge.optionsVi : challenge.optionsEn).map((option, idx) => {
                const isSelected = selectedOption === idx;
                let btnStyle = 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-750';

                if (isAnswered) {
                  if (idx === challenge.correctIndex) {
                    btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold';
                  } else if (isSelected) {
                    btnStyle = 'bg-red-950/80 border-red-500 text-red-200';
                  } else {
                    btnStyle = 'bg-slate-900/50 border-slate-800 text-slate-500 opacity-60';
                  }
                } else if (isSelected) {
                  btnStyle = 'bg-purple-600/30 border-purple-500 text-white font-bold ring-2 ring-purple-500/50';
                }

                return (
                  <button
                    key={idx}
                    id={`opt-${challenge.id}-${idx}`}
                    onClick={() => handleSelectOption(idx)}
                    disabled={isAnswered}
                    className={`w-full text-left p-3.5 rounded-xl border transition flex items-start gap-3 text-sm cursor-pointer ${btnStyle}`}
                  >
                    <span className="w-6 h-6 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center font-mono font-bold text-xs flex-shrink-0 mt-0.5">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1 leading-relaxed">{option}</span>
                    {isAnswered && idx === challenge.correctIndex && (
                      <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    )}
                    {isAnswered && isSelected && idx !== challenge.correctIndex && (
                      <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Action Buttons: Check Answer, Prev, Next */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800">
              <div className="flex gap-2">
                <button
                  onClick={handlePrevQuestion}
                  disabled={currentChallengeIdx === 0}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 text-xs font-semibold cursor-pointer"
                >
                  Câu trước
                </button>
                <button
                  onClick={handleNextQuestion}
                  disabled={isLastQuestion}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 text-xs font-semibold cursor-pointer"
                >
                  Câu tiếp
                </button>
              </div>

              {!isAnswered ? (
                <button
                  id="check-answer-btn"
                  disabled={selectedOption === null}
                  onClick={handleCheckAnswer}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-600/20 active:scale-95 transition disabled:opacity-40 cursor-pointer"
                >
                  {cText.checkAnswer}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
                      selectedOption === challenge.correctIndex
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {selectedOption === challenge.correctIndex ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>{cText.correct}</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        <span>{cText.incorrect}</span>
                      </>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Explanation box when answered */}
            {isAnswered && (
              <div className="mt-4 p-4 bg-purple-950/30 border border-purple-500/30 rounded-xl space-y-2 animate-fadeIn text-xs">
                <div className="font-bold text-purple-300 flex items-center gap-1.5 text-sm">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>{cText.viewExplanation}</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-xs">
                  {lang === 'vi' ? challenge.explanationVi : challenge.explanationEn}
                </p>

                {/* Direct verify link to simulation */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      if (challenge.id === 1 || challenge.id === 2) {
                        onNavigateZone('kinetic');
                      } else if (challenge.id === 3) {
                        onNavigateZone('potential');
                      } else {
                        onNavigateZone('hydro');
                      }
                    }}
                    className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>{cText.tryInSim} →</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: Progress, Score & Quick Navigation (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Score Card */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center">
              <Award className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-400">
                {cText.score}
              </div>
              <div className="text-3xl font-bold font-mono text-white mt-1">
                {userScore} / {CHALLENGES_DATA.length}
              </div>

              {/* Progress dots */}
              <div className="flex justify-center gap-2 mt-3">
                {CHALLENGES_DATA.map((ch, idx) => {
                  const ans = answeredMap[ch.id];
                  let dotColor = 'bg-slate-700';
                  if (ans) {
                    dotColor = ans.isCorrect ? 'bg-emerald-500' : 'bg-red-500';
                  } else if (idx === currentChallengeIdx) {
                    dotColor = 'bg-purple-500 ring-2 ring-purple-400';
                  }
                  return (
                    <button
                      key={ch.id}
                      onClick={() => {
                        setCurrentChallengeIdx(idx);
                        setSelectedOption(answeredMap[ch.id]?.selected ?? null);
                        setIsAnswered(!!answeredMap[ch.id]);
                      }}
                      className={`w-7 h-7 rounded-lg text-xs font-bold font-mono text-white flex items-center justify-center transition cursor-pointer ${dotColor}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800">
                <button
                  onClick={handleResetQuiz}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 mx-auto cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{cText.resetQuiz}</span>
                </button>
              </div>
            </div>

            {/* Hint Box */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold mb-1.5">
                <HelpCircle className="w-4 h-4" />
                <span>Gợi ý sư phạm</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {lang === 'vi' ? challenge.hintVi : challenge.hintEn}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: 4 TARGETED MISCONCEPTIONS (M1 - M4) */}
      {activeSubTab === 'misconceptions' && (
        <div className="space-y-4">
          <div className="p-3 bg-purple-950/20 border border-purple-500/20 rounded-xl text-xs text-purple-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span>
              Tổng hợp 4 ngộ nhận điển hình của học sinh lớp 9 về động năng, thế năng và chuyển hóa năng lượng (Kèm giải thích phản biện khoa học theo chuẩn KHTN 9).
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MISCONCEPTIONS_DATA.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900 p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
              >
                <div>
                  {/* Code badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[11px] font-mono font-bold">
                      Ngộ nhận {item.code}
                    </span>
                    <span className="font-mono text-xs text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {item.formulaHighlight}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-sm font-bold text-white mb-2">
                    {lang === 'vi' ? item.titleVi : item.titleEn}
                  </h4>

                  {/* Misconception statement */}
                  <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-xl mb-3">
                    <span className="text-[11px] font-bold text-red-400 block mb-1">
                      ❌ Ngộ nhận thường gặp:
                    </span>
                    <p className="text-xs text-slate-300 italic">
                      "{lang === 'vi' ? item.misconceptionVi : item.misconceptionEn}"
                    </p>
                  </div>

                  {/* Scientific Feedback */}
                  <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-xl">
                    <span className="text-[11px] font-bold text-emerald-400 block mb-1">
                      ✅ Phản hồi khoa học chuẩn xác:
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {lang === 'vi' ? item.scientificFeedbackVi : item.scientificFeedbackEn}
                    </p>
                  </div>
                </div>

                {/* Direct Action Button to Simulation */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-end">
                  <button
                    onClick={() => {
                      if (item.code === 'M1') onNavigateZone('kinetic');
                      else if (item.code === 'M2' || item.code === 'M4') onNavigateZone('potential');
                      else onNavigateZone('hydro');
                    }}
                    className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Kiểm chứng trực quan</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

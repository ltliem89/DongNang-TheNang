import React from 'react';
import { Language } from '../types';
import { DICTIONARY } from '../locales/i18n';
import { X, BookOpen, Check, Award, AlertCircle } from 'lucide-react';

interface DataSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const DataSummaryModal: React.FC<DataSummaryModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl text-slate-200 p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              LÝ THUYẾT CHUẨN KHTN 9 — KẾT NỐI TRI THỨC VỚI CUỘC SỐNG
            </h2>
            <p className="text-xs text-slate-400">
              Động năng, Thế năng trọng trường và Định luật bảo toàn cơ năng
            </p>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-6 text-sm">
          {/* 1. Động năng */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-amber-400 text-base">
                1. Động năng (Kinetic Energy)
              </h3>
              <span className="font-mono font-bold text-amber-300 text-sm">
                Wđ = ½ · m · v²
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              - Động năng là năng lượng vật có được do chuyển động.
              <br />
              - Phụ thuộc vào khối lượng <strong>m (kg)</strong> và tốc độ <strong>v (m/s)</strong>. Đơn vị: <strong>Joule (J)</strong>.
            </p>
            <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/20 text-xs text-amber-200 font-mono">
              ★ Tốc độ v tăng 2 lần → Động năng Wđ tăng 4 lần (2² = 4).
              <br />
              ★ Tốc độ v tăng 3 lần → Động năng Wđ tăng 9 lần (3² = 9).
            </div>
          </div>

          {/* 2. Thế năng trọng trường */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sky-400 text-base">
                2. Thế năng trọng trường (Gravitational Potential Energy)
              </h3>
              <span className="font-mono font-bold text-sky-300 text-sm">
                Wt = P · h = m · g · h
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              - Thế năng trọng trường là năng lượng của vật khi ở độ cao nhất định so với mặt đất hoặc mốc thế năng được chọn.
              <br />
              - <strong>P = m·g</strong> là trọng lượng (N); <strong>g = 10 N/kg</strong> (chuẩn mô hình giáo dục KHTN 9); <strong>h</strong> là độ cao chênh lệch so với mốc (m).
            </p>
            <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-500/20 text-xs text-red-200">
              ⚠️ <strong>CẢNH BÁO KHOA HỌC:</strong> Độ dốc của thác/núi không xuất hiện trong công thức tính thế năng! Biến số cốt lõi là độ cao thẳng đứng <strong>h</strong>.
            </div>
          </div>

          {/* 3. Cơ năng */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-emerald-400 text-base">
                3. Cơ năng & Sự bảo toàn (Mechanical Energy)
              </h3>
              <span className="font-mono font-bold text-emerald-300 text-sm">
                Wc = Wđ + Wt = const
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              - Cơ năng là tổng động năng và thế năng của vật.
              <br />
              - Trong mô hình lí tưởng (bỏ qua ma sát, sức cản không khí): <strong>Cơ năng được bảo toàn (Wc = hằng số)</strong>.
              <br />
              - Khi nước từ trên cao chảy xuống: Thế năng giảm bao nhiêu thì Động năng tăng bấy nhiêu, làm quay turbine máy phát điện!
            </p>
          </div>

          {/* 4. Từ điển Song ngữ đối chiếu */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-2">
              Bảng từ điển thuật ngữ song ngữ (Bilingual Vocabulary)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
              {[
                { vi: 'Động năng', en: 'Kinetic Energy' },
                { vi: 'Thế năng trọng trường', en: 'Gravitational Potential Energy' },
                { vi: 'Cơ năng', en: 'Mechanical Energy' },
                { vi: 'Khối lượng', en: 'Mass (kg)' },
                { vi: 'Tốc độ', en: 'Speed (m/s)' },
                { vi: 'Độ cao', en: 'Height (m)' },
                { vi: 'Bảo toàn cơ năng', en: 'Conservation of Energy' },
                { vi: 'Chuyển hóa năng lượng', en: 'Energy Transformation' },
                { vi: 'Thử thách', en: 'Challenge' },
              ].map((item, idx) => (
                <div key={idx} className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="text-amber-400 font-sans font-semibold">{item.vi}</div>
                  <div className="text-slate-400 text-[11px]">{item.en}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
};

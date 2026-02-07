import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Prayer } from '../types';
import { Send, Lock, Globe, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface PrayerFormProps {
  onSuccess: () => void;
}

const PrayerForm: React.FC<PrayerFormProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Prayer>({
    name: '',
    phone: '',
    content: '',
    is_public: true,
  });

  // State to handle duplicate conflict
  const [conflictData, setConflictData] = useState<{ existing: Prayer, new: Prayer } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'phone') {
      // 숫자만 추출
      const numbers = value.replace(/\D/g, '');
      let formatted = '';

      // 자동 하이픈 로직 (010-1234-5678)
      if (numbers.length <= 3) {
        formatted = numbers;
      } else if (numbers.length <= 7) {
        formatted = `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
      } else {
        formatted = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
      }

      setFormData(prev => ({ ...prev, [name]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.content) {
      alert("모든 내용을 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      // 1. Check for duplicates
      const { data: existingData, error: searchError } = await supabase
        .from('prayers')
        .select('*')
        .eq('name', formData.name.trim())
        .eq('phone', formData.phone.trim())
        .eq('is_public', formData.is_public);

      if (searchError) throw searchError;

      // If duplicate found
      if (existingData && existingData.length > 0) {
        setConflictData({
          existing: existingData[0] as Prayer,
          new: formData
        });
        setLoading(false);
        return;
      }

      // 2. No duplicate, insert new
      const { error: insertError } = await supabase
        .from('prayers')
        .insert([{
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          content: formData.content,
          is_public: formData.is_public
        }]);

      if (insertError) throw insertError;

      alert("기도 제목이 성공적으로 전달되었습니다.");
      onSuccess();

    } catch (err: any) {
      console.error(err);
      alert(`오류가 발생했습니다: ${err.message || 'Unknown error'}`);
      setLoading(false);
    }
  };

  const handleResolveConflict = async (choice: 'KEEP_OLD' | 'REPLACE_NEW') => {
    if (!conflictData || !conflictData.existing.id) return;

    if (choice === 'KEEP_OLD') {
      alert("기존 기도 제목을 유지합니다.");
      onSuccess();
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('prayers')
        .update({
          content: formData.content,
          is_public: formData.is_public,
          created_at: new Date().toISOString(),
          prayed_count: 0
        })
        .eq('id', conflictData.existing.id);

      if (updateError) throw updateError;

      alert("새로운 기도 제목으로 변경되었습니다.");
      onSuccess();
    } catch (err: any) {
      console.error(err);
      alert("업데이트 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // --- View: Conflict Resolution (Duplicate Found) ---
  if (conflictData) {
    return (
      <div className="animate-fade-in space-y-6 pb-12">
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100/80 text-amber-600 rounded-full mb-3 ring-4 ring-amber-50">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">이미 등록된 기도가 있어요</h2>
          <p className="text-xl text-gray-600 font-medium">
            {conflictData.new.is_public ? "'전체 공개'" : "'교역자만 보기'"}로<br />
            접수된 기도 제목이 있습니다.<br />
            어떤 내용으로 저장할까요?
          </p>
        </div>

        {/* Comparison Card */}
        <div className="grid gap-5">
          {/* Old Data */}
          <button
            onClick={() => handleResolveConflict('KEEP_OLD')}
            className="text-left bg-white p-6 rounded-2xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.99] transition-all shadow-sm group"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-bold">기존 내용</span>
              <span className="text-gray-400 text-sm font-medium">
                {new Date(conflictData.existing.created_at || '').toLocaleDateString()} 작성
              </span>
            </div>
            <p className="text-xl text-gray-700 font-sans font-medium leading-relaxed line-clamp-2 group-hover:text-gray-900 transition-colors">
              "{conflictData.existing.content}"
            </p>
            <div className="mt-4 flex items-center text-gray-400 font-bold group-hover:text-gray-600 transition-colors">
              <CheckCircle2 className="mr-2" size={20} />
              이 내용 유지하기
            </div>
          </button>

          {/* New Data */}
          <button
            onClick={() => handleResolveConflict('REPLACE_NEW')}
            className="text-left bg-indigo-50/50 p-6 rounded-2xl border border-indigo-200 hover:border-indigo-300 active:scale-[0.99] transition-all shadow-md group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/50 rounded-full -mr-16 -mt-16 blur-xl"></div>
            <div className="flex justify-between items-start mb-3 relative">
              <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm">새로운 내용</span>
              <span className="text-indigo-600 text-sm font-bold">지금 작성함</span>
            </div>
            <p className="text-xl text-gray-900 font-sans font-medium leading-relaxed relative">
              "{conflictData.new.content}"
            </p>
            <div className="mt-4 flex items-center text-indigo-600 font-bold relative">
              <CheckCircle2 className="mr-2" size={20} />
              이 내용으로 변경하기
            </div>
          </button>
        </div>

        <button
          onClick={() => setConflictData(null)}
          className="w-full py-4 text-gray-400 hover:text-gray-600 underline font-medium text-lg mt-2 transition-colors"
        >
          돌아가서 다시 수정하기
        </button>
      </div>
    );
  }

  // --- View: Normal Form ---
  return (
    <div className="animate-slide-up pb-20">
      <div className="glass-card p-6 md:p-8 rounded-[2rem] shadow-sm ring-1 ring-white/60">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">기도 제목 작성</h2>
        <p className="text-xl text-gray-500 mb-10 font-medium">성도님들과 함께 나눌 기도를 적어주세요.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-lg font-bold text-gray-700 ml-1">이름</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="홍길동"
              className="w-full px-6 py-5 rounded-[1.5rem] bg-white border border-gray-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all outline-none text-2xl text-gray-900 placeholder-gray-300 shadow-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-lg font-bold text-gray-700 ml-1">
              전화번호
              <span className="ml-2 text-sm font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md align-middle">
                🔒 비공개
              </span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="010-1234-5678"
              maxLength={13}
              className="w-full px-6 py-5 rounded-[1.5rem] bg-white border border-gray-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all outline-none text-2xl text-gray-900 placeholder-gray-300 shadow-sm tracking-wider font-mono"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-lg font-bold text-gray-700 ml-1">기도 제목</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="여기에 기도 제목을 적어주세요..."
              rows={5}
              className="w-full px-6 py-5 rounded-[1.5rem] bg-white border border-gray-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all outline-none text-2xl text-gray-900 placeholder-gray-300 shadow-sm resize-none leading-loose"
            />
          </div>

          {/* Privacy Selection Cards (Side-by-Side) */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            {/* Option 1: Public */}
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, is_public: true }))}
              className={`relative p-4 rounded-3xl border text-left transition-all duration-300 flex flex-col justify-between min-h-[170px] ${formData.is_public
                ? 'border-indigo-500 bg-indigo-50/60 ring-1 ring-indigo-500/20 shadow-md'
                : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-400 grayscale opacity-80'
                }`}
            >
              {formData.is_public && (
                <div className="absolute top-4 right-4 text-indigo-500 animate-fade-in">
                  <CheckCircle2 size={24} className="fill-indigo-100" />
                </div>
              )}

              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-colors ${formData.is_public ? 'bg-indigo-500 text-white shadow-indigo-200 shadow-lg' : 'bg-gray-100 text-gray-400'
                }`}>
                <Globe size={24} strokeWidth={2.5} />
              </div>

              <div>
                <div className={`font-bold text-lg mb-1 ${formData.is_public ? 'text-indigo-900' : 'text-gray-500'}`}>
                  전체 공개
                </div>
                <p className={`text-xs leading-relaxed font-medium ${formData.is_public ? 'text-indigo-700' : 'text-gray-400'}`}>
                  모든 성도님이 함께<br />기도해 드립니다.
                </p>
              </div>
            </button>

            {/* Option 2: Private */}
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, is_public: false }))}
              className={`relative p-4 rounded-3xl border text-left transition-all duration-300 flex flex-col justify-between min-h-[170px] ${!formData.is_public
                ? 'border-rose-400 bg-rose-50/60 ring-1 ring-rose-400/20 shadow-md'
                : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-400 grayscale opacity-80'
                }`}
            >
              {!formData.is_public && (
                <div className="absolute top-4 right-4 text-rose-500 animate-fade-in">
                  <CheckCircle2 size={24} className="fill-rose-100" />
                </div>
              )}

              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-colors ${!formData.is_public ? 'bg-rose-500 text-white shadow-rose-200 shadow-lg' : 'bg-gray-100 text-gray-400'
                }`}>
                <Lock size={24} strokeWidth={2.5} />
              </div>

              <div>
                <div className={`font-bold text-lg mb-1 ${!formData.is_public ? 'text-rose-900' : 'text-gray-500'}`}>
                  교역자만 보기
                </div>
                <p className={`text-xs leading-relaxed font-medium ${!formData.is_public ? 'text-rose-700' : 'text-gray-400'}`}>
                  담당 교역자에게만<br />조용히 전달됩니다.
                </p>
              </div>
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 text-white text-2xl font-bold py-6 rounded-[2.5rem] shadow-xl shadow-indigo-200 active:scale-[0.98] transition-all flex items-center justify-center space-x-3 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                <span>기도제목 올리기</span>
                <Send size={22} strokeWidth={2.5} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PrayerForm;
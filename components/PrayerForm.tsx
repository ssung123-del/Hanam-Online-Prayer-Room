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

  // 중복 기도제목 충돌 처리용 상태
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

    // 전화번호 유효성 검증: 하이픈 제거 후 숫자 10~11자리인지 확인
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      alert("전화번호를 올바르게 입력해주세요.\n예: 010-1234-5678");
      return;
    }

    setLoading(true);

    try {
      // 1. 동일 이름+전화번호로 이미 등록된 기도제목이 있는지 확인
      const { data: existingData, error: searchError } = await supabase
        .from('prayers')
        .select('*')
        .eq('name', formData.name.trim())
        .eq('phone', formData.phone.trim())
        .eq('is_public', formData.is_public);

      if (searchError) throw searchError;

      // 중복 발견 시 충돌 해결 화면으로 전환
      if (existingData && existingData.length > 0) {
        setConflictData({
          existing: existingData[0] as Prayer,
          new: formData
        });
        setLoading(false);
        return;
      }

      // 2. 중복 없음 → 새 기도제목 등록
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

    } catch (err: unknown) {
      // 왜 unknown: any 대신 사용하여 타입 안전성 확보
      console.error(err);
      // 왜 일반 메시지: 기술적 에러(err.message)를 그대로 노출하면 사용자 혼란 유발
      alert("기도제목 전송 중 문제가 발생했습니다.\n잠시 후 다시 시도해주세요.");
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
    } catch (err: unknown) {
      console.error(err);
      alert("업데이트 중 문제가 발생했습니다.\n잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  // --- View: Conflict Resolution (Duplicate Found) ---
  if (conflictData) {
    return (
      <div className="animate-fade-in space-y-6 pb-12">
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center justify-center w-[4.4rem] h-[4.4rem] bg-amber-100 text-amber-700 rounded-full mb-3 ring-4 ring-amber-50 shadow-inner">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-4xl font-bold text-[#263451] tracking-tight">이미 등록된 기도가 있어요</h2>
          <p className="text-xl text-[#616b7f] font-medium leading-relaxed">
            {conflictData.new.is_public ? "'전체 공개'" : "'교역자만 보기'"}로<br />
            접수된 기도 제목이 있습니다.<br />
            어떤 내용으로 저장할까요?
          </p>
        </div>

        <div className="grid gap-5">
          <button
            onClick={() => handleResolveConflict('KEEP_OLD')}
            className="focus-ring tap-target press-feedback interactive-card text-left soft-card p-7 rounded-[1.8rem] border border-[#e5e9f2] hover:border-[#cfd6e6] active:scale-[0.99] transition-all group"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full text-base font-bold">기존 내용</span>
              <span className="text-gray-500 text-base font-medium">
                {new Date(conflictData.existing.created_at || '').toLocaleDateString()} 작성
              </span>
            </div>
            <p className="text-2xl text-[#374255] font-sans font-medium leading-relaxed line-clamp-2 group-hover:text-[#1f2937] transition-colors">
              "{conflictData.existing.content}"
            </p>
            <div className="mt-5 flex items-center text-gray-500 text-lg font-bold group-hover:text-gray-700 transition-colors">
              <CheckCircle2 className="mr-2" size={22} />
              이 내용 유지하기
            </div>
          </button>

          <button
            onClick={() => handleResolveConflict('REPLACE_NEW')}
            className="focus-ring tap-target press-feedback interactive-card text-left bg-indigo-50/70 p-7 rounded-[1.8rem] border border-indigo-200 hover:border-indigo-300 active:scale-[0.99] transition-all shadow-md group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-200/60 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="flex justify-between items-start mb-3 relative">
              <span className="bg-indigo-600 text-white px-3 py-1.5 rounded-full text-base font-bold shadow-sm">새로운 내용</span>
              <span className="text-indigo-700 text-base font-bold">지금 작성함</span>
            </div>
            <p className="text-2xl text-[#1f2d4f] font-sans font-medium leading-relaxed relative">
              "{conflictData.new.content}"
            </p>
            <div className="mt-5 flex items-center text-indigo-700 text-lg font-bold relative">
              <CheckCircle2 className="mr-2" size={22} />
              이 내용으로 변경하기
            </div>
          </button>
        </div>

        <button
          onClick={() => setConflictData(null)}
          className="focus-ring tap-target press-feedback w-full py-4 text-gray-500 hover:text-gray-700 underline font-medium text-xl mt-2 transition-colors"
        >
          돌아가서 다시 수정하기
        </button>
      </div>
    );
  }

  // --- View: Normal Form ---
  return (
    <div className="animate-slide-up pb-20">
      <div className="glass-card p-6 md:p-8 rounded-[2.2rem] shadow-sm ring-1 ring-white/60 relative overflow-hidden">
        <div className="absolute -top-14 -right-10 w-44 h-44 bg-indigo-200/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-10 w-40 h-40 bg-orange-200/45 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <span className="section-kicker">PRAYER REQUEST FORM</span>
          <h2 className="text-4xl font-bold text-[#263451] mt-1 mb-2 tracking-tight">기도 제목 작성</h2>
          <p className="text-xl text-[#616b7f] mb-10 font-medium leading-relaxed">성도님들과 함께 나눌 기도를 적어주세요.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative">
          <div className="space-y-2">
            <label className="block text-xl font-bold text-[#34405b] ml-1">이름</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="홍길동"
              className="input-field focus-ring w-full px-6 py-5 rounded-[1.5rem] transition-all text-2xl text-[#1f2937] placeholder-[#a0a8b8] shadow-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xl font-bold text-[#34405b] ml-1">
              전화번호
              <span className="ml-2 text-base font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md align-middle">
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
              className="input-field focus-ring w-full px-6 py-5 rounded-[1.5rem] transition-all text-2xl text-[#1f2937] placeholder-[#a0a8b8] shadow-sm tracking-wider font-mono"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xl font-bold text-[#34405b] ml-1">기도 제목</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="여기에 기도 제목을 적어주세요..."
              rows={5}
              className="input-field focus-ring w-full px-6 py-5 rounded-[1.5rem] transition-all text-2xl text-[#1f2937] placeholder-[#a0a8b8] shadow-sm resize-none leading-loose"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, is_public: true }))}
              className={`focus-ring tap-target press-feedback interactive-card relative p-4 rounded-3xl border text-left transition-all duration-300 flex flex-col justify-between min-h-[176px] ${formData.is_public
                ? 'border-indigo-500 bg-indigo-50/70 ring-1 ring-indigo-500/20 shadow-md'
                : 'border-gray-200 bg-white/95 hover:bg-gray-50 text-gray-500 opacity-85'
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
                <div className={`font-bold text-xl mb-1 ${formData.is_public ? 'text-indigo-900' : 'text-gray-600'}`}>
                  전체 공개
                </div>
                <p className={`text-sm leading-relaxed font-medium ${formData.is_public ? 'text-indigo-700' : 'text-gray-500'}`}>
                  모든 성도님이 함께<br />기도해 드립니다.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, is_public: false }))}
              className={`focus-ring tap-target press-feedback interactive-card relative p-4 rounded-3xl border text-left transition-all duration-300 flex flex-col justify-between min-h-[176px] ${!formData.is_public
                ? 'border-rose-400 bg-rose-50/70 ring-1 ring-rose-400/20 shadow-md'
                : 'border-gray-200 bg-white/95 hover:bg-gray-50 text-gray-500 opacity-85'
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
                <div className={`font-bold text-xl mb-1 ${!formData.is_public ? 'text-rose-900' : 'text-gray-600'}`}>
                  교역자만 보기
                </div>
                <p className={`text-sm leading-relaxed font-medium ${!formData.is_public ? 'text-rose-700' : 'text-gray-500'}`}>
                  담당 교역자에게만<br />조용히 전달됩니다.
                </p>
              </div>
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="focus-ring tap-target press-feedback w-full mt-8 bg-indigo-600 hover:bg-indigo-700 text-white text-2xl font-bold py-6 rounded-[2.5rem] shadow-xl shadow-indigo-200 active:scale-[0.98] transition-all flex items-center justify-center space-x-3 disabled:opacity-70 disabled:cursor-not-allowed"
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

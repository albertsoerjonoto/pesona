'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/lib/i18n';
import { useDesktopLayout } from '@/hooks/useDesktopLayout';
import { useToast } from '@/components/Toast';
import { cn } from '@/lib/utils';
import type { CoachResponse } from '@/lib/types';

interface ChatMsg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    routine_suggestion?: CoachResponse['routine_suggestion'];
    product_recommendations?: CoachResponse['product_recommendations'];
    daily_tip?: CoachResponse['daily_tip'];
  };
  created_at: string;
}

const QUICK_CHIPS = [
  { key: 'chipRoutine', text: 'Routine pagi' },
  { key: 'chipSerum', text: 'Rekomendasi serum' },
  { key: 'chipPhoto', text: 'Gimana kondisi foto terakhir aku?' },
  { key: 'chipProduct', text: 'Cek produk' },
];

export default function ChatPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useLocale();
  const { isExpanded } = useDesktopLayout();
  const { showToast, ToastContainer } = useToast();

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [savingRoutine, setSavingRoutine] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load message history
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(50);

      if (data) {
        setMessages(data.map(d => ({
          id: d.id,
          role: d.role,
          content: d.content,
          metadata: d.metadata || {},
          created_at: d.created_at,
        })));
      }
      setLoaded(true);
    };
    load();
  }, [user]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (loaded) scrollToBottom();
  }, [messages, loaded, scrollToBottom]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || sending || !user) return;

    const userMsg: ChatMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);

    // Auto-resize textarea back
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim() }),
      });

      if (!res.ok) throw new Error('Failed');

      const data: CoachResponse = await res.json();

      const assistantMsg: ChatMsg = {
        id: `temp-${Date.now()}-resp`,
        role: 'assistant',
        content: data.message || '',
        metadata: {
          routine_suggestion: data.routine_suggestion,
          product_recommendations: data.product_recommendations,
          daily_tip: data.daily_tip,
        },
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatMsg = {
        id: `temp-${Date.now()}-err`,
        role: 'assistant',
        content: t('chat.error'),
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    }

    setSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleAutoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const saveRoutineFromChat = async (routineSuggestion: NonNullable<CoachResponse['routine_suggestion']>) => {
    if (!user || savingRoutine) return;

    const steps = routineSuggestion.steps;
    if (!Array.isArray(steps) || steps.length === 0) {
      showToast('error', 'Routine kosong, tidak bisa disimpan');
      return;
    }

    setSavingRoutine(true);

    try {
      const supabase = createClient();
      const routineType = routineSuggestion.type === 'evening' ? 'evening' : 'morning';

      // Validate steps BEFORE touching the DB — avoid deactivating old
      // routine if the new one would be empty
      const validatedSteps = steps
        .filter(s => s && typeof s === 'object' && s.product_name)
        .map((s, i) => ({
          step_number: typeof s.step_number === 'number' ? s.step_number : i + 1,
          category: typeof s.category === 'string' ? s.category : 'other',
          product_name: String(s.product_name || ''),
          product_brand: String(s.product_brand || ''),
          instruction: String(s.instruction || ''),
        }));

      if (validatedSteps.length === 0) {
        showToast('error', 'Routine kosong, tidak bisa disimpan');
        setSavingRoutine(false);
        return;
      }

      // Insert new routine FIRST — if this fails, old routine stays active
      const { data: newRoutine, error: insertError } = await supabase
        .from('routines')
        .insert({
          user_id: user.id,
          type: routineType,
          steps: validatedSteps,
          generated_by: 'ai',
          active: true,
          ai_reasoning: 'Generated from chat conversation',
        })
        .select('id')
        .single();

      if (insertError || !newRoutine) throw insertError ?? new Error('insert failed');

      // Only after successful insert, deactivate any OTHER active routines
      // of the same type (exclude the one we just created)
      await supabase
        .from('routines')
        .update({ active: false })
        .eq('user_id', user.id)
        .eq('type', routineType)
        .eq('active', true)
        .neq('id', newRoutine.id);

      showToast('success', `Routine ${routineType === 'morning' ? 'pagi' : 'malam'} tersimpan! 🎉`);

      // Redirect to log page after short delay
      setTimeout(() => router.push('/log'), 1000);
    } catch {
      showToast('error', 'Gagal menyimpan routine');
    }
    setSavingRoutine(false);
  };

  return (
    <div className={cn('flex flex-col h-dvh', isExpanded && 'sm:h-screen')}>
      {ToastContainer}
      {/* Header */}
      <div className="sticky top-0 z-20 bg-bg/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center justify-center gap-2">
          <span className="text-lg">✨</span>
          <h1 className="text-lg font-bold text-text-primary">Sona</h1>
          <span className="text-xs text-text-tertiary bg-accent-surface px-2 py-0.5 rounded-full">AI Coach</span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-lg mx-auto space-y-4">
          {/* Welcome message if no history */}
          {loaded && messages.length === 0 && (
            <div className="animate-fade-in">
              <div className="bg-surface rounded-2xl p-5 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">💆‍♀️</span>
                  <p className="font-semibold text-text-primary">Halo, aku Sona!</p>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed mb-3">
                  AI beauty coach kamu dari Pesona.io. Aku bisa bantu:
                </p>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">•</span>
                    Membuat skincare routine pagi & malam
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">•</span>
                    Rekomendasi produk sesuai jenis kulit kamu
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">•</span>
                    Analisis kondisi kulit dari foto
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">•</span>
                    Tips perawatan untuk iklim tropis Indonesia
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'animate-bounce-in',
                msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'
              )}
            >
              <div className={cn(
                'max-w-[85%] rounded-2xl px-4 py-3',
                msg.role === 'user'
                  ? 'bg-accent text-accent-fg rounded-br-md'
                  : 'bg-surface text-text-primary rounded-bl-md'
              )}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                {/* Product recommendations */}
                {msg.metadata?.product_recommendations && msg.metadata.product_recommendations.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {msg.metadata.product_recommendations.map((rec, i) => (
                      <div key={i} className="bg-bg/50 rounded-xl p-3 border border-border">
                        <div className="flex items-start justify-between mb-1 gap-2">
                          <p className="text-sm font-semibold flex-1">{rec.name}</p>
                          <div className="flex gap-1 shrink-0">
                            {rec.bpom_registered && (
                              <span className="text-[9px] bg-positive-surface text-positive-text px-1.5 py-0.5 rounded-full font-medium">BPOM</span>
                            )}
                            {rec.halal_certified && (
                              <span className="text-[9px] bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded-full font-medium">Halal</span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-text-secondary mb-1">{rec.brand}</p>
                        {typeof rec.price_idr === 'number' && (
                          <p className="text-xs font-bold text-accent-text mb-1">
                            Rp {rec.price_idr.toLocaleString('id-ID')}
                          </p>
                        )}
                        <p className="text-xs opacity-80">{rec.reason}</p>
                        {rec.shopee_url && (
                          <a
                            href={rec.shopee_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 mt-2 text-[10px] font-semibold text-orange-500 hover:underline"
                          >
                            🛒 Beli di Shopee
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                            </svg>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Routine suggestion */}
                {msg.metadata?.routine_suggestion && (
                  <div className="mt-3 bg-bg/50 rounded-xl p-3 border border-border">
                    <p className="text-sm font-semibold mb-2">
                      {msg.metadata.routine_suggestion.type === 'morning' ? 'Routine Pagi ☀️' : 'Routine Malam 🌙'}
                    </p>
                    <div className="space-y-1.5">
                      {msg.metadata.routine_suggestion.steps?.map((step, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <span className="font-bold text-accent shrink-0">{step.step_number || i + 1}.</span>
                          <div>
                            <span className="font-medium">{step.product_name}</span>
                            {step.product_brand && <span className="text-text-tertiary"> ({step.product_brand})</span>}
                            {step.instruction && <p className="text-text-secondary mt-0.5">{step.instruction}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        saveRoutineFromChat(msg.metadata!.routine_suggestion!);
                      }}
                      disabled={savingRoutine}
                      className="w-full mt-3 py-2 bg-accent text-accent-fg text-xs font-semibold rounded-lg hover:bg-accent-hover transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {savingRoutine ? 'Menyimpan...' : '✨ Pakai Routine Ini'}
                    </button>
                  </div>
                )}

                {/* Daily tip */}
                {msg.metadata?.daily_tip && (
                  <div className="mt-2 text-xs opacity-70 italic">
                    💡 {msg.metadata.daily_tip}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {sending && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-surface rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-loading-dots rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-loading-dots rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-loading-dots rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                  <span className="text-xs text-text-tertiary ml-2">{t('chat.thinking')}</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick chips */}
      {messages.length === 0 && !sending && (
        <div className="px-4 pb-2">
          <div className="max-w-lg mx-auto flex gap-2 overflow-x-auto scrollbar-hide">
            {QUICK_CHIPS.map(chip => (
              <button
                key={chip.key}
                onClick={() => sendMessage(chip.text)}
                className="shrink-0 px-3 py-1.5 text-xs font-medium bg-accent-surface text-accent-text rounded-full border border-accent-border hover:bg-surface-hover transition-all"
              >
                {t(`chat.${chip.key}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-border bg-bg px-4 py-3 safe-area-bottom">
        <div className="max-w-lg mx-auto flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleAutoResize}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.placeholder')}
            rows={1}
            className="flex-1 resize-none bg-surface rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-input-ring border border-border-strong"
            style={{ maxHeight: '120px' }}
            disabled={sending}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || sending}
            className="shrink-0 w-10 h-10 bg-accent text-accent-fg rounded-xl flex items-center justify-center hover:bg-accent-hover transition-all active:scale-95 disabled:opacity-40"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

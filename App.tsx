
import React, { useState, useCallback, useEffect } from 'react';
import { Prize, WonPrize } from './types';
import { PRIZES, PRIZE_GREETINGS } from './constants';
import ScratchCard from './components/ScratchCard';
import PrizeModal from './components/PrizeModal';
import HistoryList from './components/HistoryList';
import { logPrizeToGSA } from './services/loggingService';

const HISTORY_KEY = 'lucky_scratch_history_v2';
const LAST_PLAYED_KEY = 'lucky_scratch_last_played_timestamp';

const App: React.FC = () => {
  const [history, setHistory] = useState<WonPrize[]>([]);
  const [currentWin, setCurrentWin] = useState<WonPrize | null>(null);
  const [pendingPrize, setPendingPrize] = useState<Prize | null>(null);
  const [pendingGreeting, setPendingGreeting] = useState<string>("");
  const [isReady, setIsReady] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [hasPlayedToday, setHasPlayedToday] = useState(false);

  const checkPlayAvailability = () => {
    const lastPlayed = localStorage.getItem(LAST_PLAYED_KEY);
    if (!lastPlayed) return false;

    const lastTime = parseInt(lastPlayed, 10);
    const now = new Date();
    const today10AM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0).getTime();
    const cutoff = now.getTime() >= today10AM ? today10AM : today10AM - 24 * 60 * 60 * 1000;
    return lastTime > cutoff;
  };

  useEffect(() => {
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (savedHistory) try { setHistory(JSON.parse(savedHistory)); } catch (e) {}
    
    setHasPlayedToday(checkPlayAvailability());

    const timer = setInterval(() => {
      setHasPlayedToday(checkPlayAvailability());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); }, [history]);

  const clearAllData = () => {
    if (window.confirm('確定要清除所有紀錄並重新開始嗎？')) {
      setHistory([]);
      localStorage.removeItem(LAST_PLAYED_KEY);
      setHasPlayedToday(false);
    }
  };

  const startNewGame = () => {
    if (hasPlayedToday || isReady) return;
    
    const random = Math.random();
    let cumulative = 0;
    let selectedPrize = PRIZES[PRIZES.length - 1]; 
    for (const p of PRIZES) {
      cumulative += p.probability;
      if (random <= cumulative) {
        selectedPrize = p;
        break;
      }
    }

    setPendingPrize(selectedPrize);
    setPendingGreeting(PRIZE_GREETINGS[selectedPrize.value] || "馬到成功！祝您好運連連！");
    setIsReady(true);
  };

  // 生成帶有意義的驗證碼：ET-面額-隨機碼
  const generateVoucherCode = (value: number) => {
    const randomStr = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `ET-${value}-${randomStr}`;
  };

  const handleScratchComplete = useCallback(async () => {
    if (!pendingPrize || isRevealing) return;
    setIsRevealing(true);
    
    const newWin: WonPrize = {
      id: generateVoucherCode(pendingPrize.value),
      prizeId: pendingPrize.id,
      label: pendingPrize.label,
      value: pendingPrize.value,
      timestamp: Date.now(),
      aiMessage: pendingGreeting,
      synced: false
    };

    // 先存入本地紀錄
    localStorage.setItem(LAST_PLAYED_KEY, Date.now().toString());
    setHasPlayedToday(true);
    setCurrentWin(newWin);
    setHistory(prev => [newWin, ...prev]);
    
    // 異步同步至 GSA
    logPrizeToGSA(newWin).then(success => {
      if (success) {
        setHistory(currentHistory => 
          currentHistory.map(item => item.id === newWin.id ? { ...item, synced: true } : item)
        );
      }
    });
    
    setTimeout(() => {
      setIsReady(false);
      setPendingPrize(null);
      setIsRevealing(false);
    }, 500);
  }, [pendingPrize, pendingGreeting, isRevealing]);

  const handleViewHistoryItem = (item: WonPrize) => {
    setCurrentWin(item);
  };

  const rules = [
    "活動期間:即日起至2026年2月5日 23:59止，序號領完將提早結束",
    "每日 10:00 自動重置抽獎資格，每人每日限參與乙次。",
    "本活動限東森購好 購幸福 Line OA群組，開通權益之會員遊玩與兌換，且須由本人歸戶，鏈結若經轉發則無效",
    "中獎後請務必「分享至 LINE 群組」以獲取歸戶連結，完成領獎手續。",
    "憑證碼 (Voucher Code) 為獲獎之唯一憑證，具備唯一性，請妥善保存或截圖留存。",
    "所取得之樂透金使用效期為歸戶日＋２天",
    "東森購物網保有活動規則修改與暫停活動等之權利。"
  ];

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-6 overflow-x-hidden relative z-10">
      <header className="text-center mb-8 sm:mb-10">
        <div className="font-calligraphy text-yellow-500 text-lg mb-1 tracking-[0.4em] animate-pulse">馬到成功</div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-700 drop-shadow-2xl leading-none">
          午馬開運刮
        </h1>
      </header>

      <main className="w-full max-w-[340px] flex flex-col items-center">
        <div className="w-full relative flex justify-center mb-10">
          <ScratchCard 
            prize={pendingPrize} 
            isReady={isReady} 
            onComplete={handleScratchComplete} 
          />
        </div>
        
        <div className="flex flex-col items-center gap-4 w-full px-2">
          <button
            onClick={startNewGame}
            disabled={isReady || hasPlayedToday}
            className={`group relative w-full py-5 rounded-2xl font-black text-lg tracking-[0.15em] transition-all transform active:scale-95 shadow-2xl border ${
              hasPlayedToday 
                ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed' 
                : isReady 
                  ? 'bg-yellow-950/20 text-yellow-900/40 border-yellow-950/20 cursor-not-allowed' 
                  : 'bg-[#b91c1c] text-white border-yellow-500/40 hover:border-yellow-300 hover:shadow-yellow-500/30 animate-pulse'
            }`}
          >
            <span className="relative z-10">
              {hasPlayedToday ? '明日 10:00 再試' : isReady ? '請刮開卡片' : '抽取開運刮刮卡'}
            </span>
            {!isReady && !hasPlayedToday && <div className="absolute inset-0 animate-shimmer"></div>}
          </button>
          
          <p className="text-yellow-500/40 text-[9px] font-bold tracking-[0.2em] uppercase">
            {hasPlayedToday ? 'Attempts: 0/1' : 'Attempts: 1/1'}
          </p>
        </div>
      </main>

      <HistoryList history={history} onClear={clearAllData} onViewItem={handleViewHistoryItem} />

      <section className="w-full max-w-[340px] mt-12 mb-12 relative animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="absolute inset-0 bg-gradient-to-b from-[#3a0a0a]/80 to-black/90 rounded-[32px] border border-yellow-600/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-md"></div>
        <div className="relative p-8">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-yellow-600"></div>
            <h2 className="font-calligraphy text-2xl text-yellow-500 tracking-widest drop-shadow-md">活動細則</h2>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-yellow-600"></div>
          </div>
          <div className="space-y-4">
            {rules.map((rule, idx) => (
              <div key={idx} className="relative group">
                <div className="flex gap-4 p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-600/20 border border-yellow-600/40 flex items-center justify-center text-yellow-500 text-[10px] font-black mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-white/70 text-[11px] leading-relaxed font-medium">
                    {rule}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PrizeModal wonPrize={currentWin} onClose={() => setCurrentWin(null)} />

      <footer className="mt-2 mb-6 text-center opacity-30">
        <div className="font-signature text-yellow-700 text-lg italic tracking-widest">Auspicious Year of Horse</div>
      </footer>
    </div>
  );
};

export default App;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Shield, Settings, History, MapPin, Power, MessageSquare, AlertCircle, Smartphone, Bell, Moon, Zap, Target, Navigation, Plus, Trash2, Radio, EyeOff, Volume2, Lock, Unlock, X, PhoneCall, Info, Home, ChevronRight, RefreshCcw, Activity, SlidersHorizontal } from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";
import { AppState, LogEntry, LocationData, SafeZone } from './types.ts';
import { getCurrentLocation, generateMapLinks, calculateDistance, formatGeofenceSmsMessage, getSmsUri, formatSmsMessage } from './services/locationService.ts';
import { getSmartSummary } from './services/geminiService.ts';

const TERMINATION_PASSWORD = "4713339";
const MASTER_KEYWORD_DEFAULT = "청담재활";

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      keyword: '어디야',
      masterKeyword: MASTER_KEYWORD_DEFAULT,
      guardianPhone: '010-1234-5678',
      webhookUrl: '', 
      isMonitoring: false,
      isLowPowerMode: false,
      logs: [],
      lastLocation: null,
      safeZones: [
        { id: '1', name: '우리집', center: null, isEnabled: false, lastAlertDistance: 0 },
        { id: '2', name: '자주 가시는 곳', center: null, isEnabled: false, lastAlertDistance: 0 },
      ],
      normalCheckCount: 0,
      dailyLimit: 3,
      lastResetDate: today
    };
  });
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'settings'>('dashboard');
  const [aiSummary, setAiSummary] = useState<string>('부모님을 안전하게 보호하고 있습니다.');
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [isAppLocked, setIsAppLocked] = useState(true);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [testSmsInput, setTestSmsInput] = useState("");
  
  const wakeLockRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (state.lastResetDate !== today) {
      setState(prev => ({ ...prev, lastResetDate: today, normalCheckCount: 0 }));
    }
  }, [state.lastResetDate]);

  useEffect(() => {
    const preventBack = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.history.pushState(null, "", window.location.href);
    window.addEventListener('popstate', preventBack);
    return () => window.removeEventListener('popstate', preventBack);
  }, []);

  const addLog = useCallback((type: LogEntry['type'], message: string, data?: any) => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      type,
      message,
      data,
    };
    setState(prev => ({ ...prev, logs: [newLog, ...prev.logs].slice(0, 50) }));
  }, []);

  const triggerLocationShare = async (reason: string) => {
    try {
      const loc = await getCurrentLocation();
      const links = generateMapLinks(loc.lat, loc.lng);
      const message = formatSmsMessage(links);
      const smsUri = getSmsUri(state.guardianPhone, `[안심 가디언: ${reason}]\n${message}`);
      
      addLog('TRIGGER', `보안 요청 승인: 위치 전송 완료`);
      window.location.href = smsUri;
    } catch (err: any) {
      addLog('ERROR', `위치 전송 실패: ${err.message}`);
    }
  };

  const processIncomingMessage = useCallback(async (msg: string) => {
    const today = new Date().toISOString().split('T')[0];
    let currentCount = state.normalCheckCount;
    
    if (state.lastResetDate !== today) currentCount = 0;

    if (msg.includes(state.masterKeyword)) {
      addLog('SMS_RECEIVE', '고급 보안 인증 수신 (무제한)');
      await triggerLocationShare('고급 보안 확인');
      return;
    }

    if (msg.includes(state.keyword)) {
      if (currentCount < state.dailyLimit) {
        const newCount = currentCount + 1;
        setState(prev => ({ ...prev, normalCheckCount: newCount, lastResetDate: today }));
        addLog('SMS_RECEIVE', `일반 보안 인증 수신 (${newCount}/${state.dailyLimit})`);
        await triggerLocationShare('일반 보안 확인');
      } else {
        addLog('ALERT', `일일 위치 조회 한도(${state.dailyLimit}회) 초과`);
      }
    }
  }, [state.keyword, state.masterKeyword, state.normalCheckCount, state.dailyLimit, state.lastResetDate, state.guardianPhone]);

  const speakEmergencyAlert = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: (process.env as any).API_KEY });
      const prompt = "도와주세요! 이 분은 치매를 앓고 계신 부모님입니다. 자녀에게 문자를 보내야 하니 빨간 전송 버튼을 대신 눌러주세요!";
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const arrayBuffer = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0)).buffer;
        const dataInt16 = new Int16Array(arrayBuffer);
        const buffer = audioCtx.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.loop = true;
        source.start();
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (state.isMonitoring) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const currentLoc = { lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy, timestamp: position.timestamp };
          state.safeZones.forEach(zone => {
            if (!zone.isEnabled || !zone.center) return;
            const dist = calculateDistance(zone.center.lat, zone.center.lng, currentLoc.lat, currentLoc.lng);
            if (dist >= 50 && zone.lastAlertDistance < 50) {
              setEmergencyActive(true);
              speakEmergencyAlert();
              window.location.href = getSmsUri(state.guardianPhone, formatGeofenceSmsMessage(zone.name, dist, generateMapLinks(currentLoc.lat, currentLoc.lng)));
              setState(prev => ({ ...prev, safeZones: prev.safeZones.map(z => z.id === zone.id ? { ...z, lastAlertDistance: dist } : z) }));
            }
          });
        },
        null,
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
    return () => { if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, [state.isMonitoring, state.safeZones, state.guardianPhone]);

  const toggleMonitoring = useCallback(async () => {
    if (!state.isMonitoring) {
      if ('wakeLock' in navigator) {
        try { wakeLockRef.current = await (navigator as any).wakeLock.request('screen'); } catch (err) {}
      }
      setState(prev => ({ ...prev, isMonitoring: true }));
      addLog('SYSTEM', '전체 보호 모드 활성화');
      const summary = await getSmartSummary(state.logs);
      setAiSummary(summary);
    } else {
      if (wakeLockRef.current) { try { await wakeLockRef.current.release(); } catch (e) {} wakeLockRef.current = null; }
      setState(prev => ({ ...prev, isMonitoring: false }));
      addLog('SYSTEM', '보호 모드 일시 정지');
    }
  }, [state.isMonitoring, state.logs, addLog]);

  const handleUnlock = () => {
    if (passwordInput === TERMINATION_PASSWORD) {
      setIsAppLocked(false);
      setPasswordInput("");
      setPasswordError(false);
      addLog('SYSTEM', '관리자 인증 성공');
    } else {
      setPasswordError(true);
      setPasswordInput("");
    }
  };

  if (emergencyActive) {
    return (
      <div className="min-h-screen bg-red-600 flex flex-col items-center justify-center p-8 text-white text-center">
        <AlertCircle className="w-24 h-24 mb-8 animate-bounce" />
        <h1 className="text-4xl font-black mb-6 tracking-tighter italic uppercase">Emergency</h1>
        <div className="bg-white text-red-600 p-8 rounded-[3rem] shadow-2xl mb-10 w-full">
          <p className="text-xl font-bold leading-relaxed">
            도움이 필요한 부모님입니다.<br/>
            <span className="text-3xl font-black underline">위치 문자 전송</span>을<br/>
            한 번만 대신 눌러주세요.
          </p>
        </div>
        <button onClick={() => window.location.href = getSmsUri(state.guardianPhone, "긴급 상황! 즉시 확인 요망")} className="w-full py-8 bg-white text-red-600 rounded-full font-black text-2xl shadow-2xl active:scale-95">위치 전송</button>
        <button onClick={() => { setEmergencyActive(false); setIsAppLocked(true); }} className="mt-12 opacity-30 text-xs font-bold underline">관리자 모드</button>
      </div>
    );
  }

  if (isAppLocked) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center select-none overflow-hidden">
        <div className="mb-12">
          <div className="w-24 h-24 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-blue-500/50 animate-pulse">
            <Lock className="w-10 h-10 text-blue-500" />
          </div>
          <h2 className="text-white text-3xl font-black mb-2 tracking-tighter italic uppercase">Security Active</h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">가디언 보호 작동 중</p>
        </div>
        <div className="w-full max-w-xs space-y-6">
          <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 backdrop-blur-md">
            <input 
              type="password" 
              inputMode="numeric"
              placeholder="••••••"
              value={passwordInput} 
              onChange={(e) => setPasswordInput(e.target.value)} 
              className={`w-full bg-black/40 border-2 ${passwordError ? 'border-red-500' : 'border-white/10'} rounded-2xl py-5 text-center text-white text-3xl font-black tracking-[0.4em] outline-none focus:border-blue-500 transition-all`} 
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            />
          </div>
          <button onClick={handleUnlock} className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-xl shadow-2xl active:scale-95 transition-all">잠금 해제</button>
        </div>
        <div className="mt-16">
          <button onClick={() => window.location.href = `tel:${state.guardianPhone}`} className="flex items-center gap-4 bg-white/5 px-8 py-4 rounded-full border border-white/10 text-white text-sm font-black italic active:bg-white/10"><PhoneCall className="w-5 h-5 text-blue-400" /> 자녀에게 전화</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-gray-50 pb-32">
      <header className="px-6 pt-14 pb-8 bg-white border-b border-gray-100 rounded-b-[3.5rem] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50" />
        <div className="flex justify-between items-center mb-6 relative z-10">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-black text-gray-900 tracking-tighter italic">청담재활 가디언</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setIsAppLocked(true)} className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all"><Lock className="w-5 h-5" /></button>
            <button onClick={toggleMonitoring} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${state.isMonitoring ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}><Power className="w-6 h-6" /></button>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-[2.5rem] p-6 text-white shadow-xl shadow-blue-200">
          <div className="flex items-center gap-2 mb-3"><Activity className="w-3 h-3 text-white fill-current" /><span className="text-[9px] font-black uppercase tracking-widest opacity-80">System Activity</span></div>
          <p className="text-base font-bold leading-snug">{aiSummary}</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-8 space-y-10">
        {activeTab === 'dashboard' && (
          <>
            <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 space-y-6">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">일반 위치 조회 현황</h3>
                  <p className="text-xl font-black text-gray-900 tracking-tight italic">Daily Usage</p>
                </div>
                <div className="text-right">
                  <span className={`text-4xl font-black italic ${state.normalCheckCount >= state.dailyLimit ? 'text-red-600' : 'text-blue-600'}`}>{state.normalCheckCount}</span>
                  <span className="text-gray-300 font-black text-xl italic mx-1">/</span>
                  <span className="text-gray-300 font-black text-xl italic">{state.dailyLimit}</span>
                </div>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${(state.normalCheckCount / state.dailyLimit) * 100}%` }} />
              </div>
              <p className="text-[9px] text-gray-400 font-bold text-center uppercase tracking-widest">고급 보안 조회(비밀 키워드)는 횟수 제한이 없습니다</p>
              
              <div className="pt-4 border-t border-gray-50">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-2 block">수신 시뮬레이션 (관리자용)</label>
                <div className="flex gap-2">
                  <input value={testSmsInput} onChange={e => setTestSmsInput(e.target.value)} placeholder="테스트할 문자 내용..." className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500" />
                  <button onClick={() => { processIncomingMessage(testSmsInput); setTestSmsInput(""); }} className="bg-slate-900 text-white px-5 rounded-xl font-black text-xs uppercase tracking-widest">실행</button>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Safe Zones</h2>
                <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full"><Target className="w-3 h-3" /> Radius 50m</div>
              </div>
              {state.safeZones.map(zone => (
                <div key={zone.id} className={`p-6 rounded-[2.5rem] border-2 transition-all ${zone.isEnabled ? 'bg-white border-blue-100 shadow-sm' : 'bg-gray-50 border-gray-100'}`}>
                  <div className="flex justify-between items-center mb-5">
                    <span className="font-black text-lg text-gray-900">{zone.name}</span>
                    <button onClick={() => setState(prev => ({ ...prev, safeZones: prev.safeZones.map(z => z.id === zone.id ? { ...z, isEnabled: !z.isEnabled } : z) }))} className={`w-14 h-7 rounded-full relative transition-colors ${zone.isEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}><div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${zone.isEnabled ? 'right-1' : 'left-1'}`} /></button>
                  </div>
                  <button onClick={async () => { const loc = await getCurrentLocation(); setState(prev => ({ ...prev, safeZones: prev.safeZones.map(z => z.id === zone.id ? { ...z, center: loc, isEnabled: true } : z) })); addLog('SYSTEM', `${zone.name} 위치 동기화`); }} className="w-full py-4 bg-gray-100 hover:bg-gray-200 transition-colors rounded-[1.5rem] text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center justify-center gap-2"><RefreshCcw className="w-3 h-3" /> 위치 갱신</button>
                </div>
              ))}
            </section>
          </>
        )}
        
        {activeTab === 'logs' && (
          <div className="space-y-6">
             <div className="flex justify-between items-end px-2">
               <h2 className="text-3xl font-black tracking-tighter italic uppercase">History</h2>
               <button onClick={() => setState(prev => ({ ...prev, logs: [] }))} className="text-[10px] font-black text-gray-400 uppercase border-b border-gray-200">Reset</button>
             </div>
             <div className="space-y-3">
               {state.logs.length === 0 ? (
                 <div className="py-32 text-center opacity-30"><History className="w-12 h-12 mx-auto mb-4" /><p className="text-sm font-bold tracking-widest uppercase">No Records</p></div>
               ) : (
                 state.logs.map(log => (
                  <div key={log.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex gap-5 active:scale-98 transition-transform">
                    <div className={`w-2.5 h-2.5 rounded-full mt-2 shrink-0 ${log.type === 'ALERT' ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]' : log.type === 'SMS_RECEIVE' ? 'bg-green-500' : 'bg-blue-500'}`} />
                    <div className="space-y-1">
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      <p className="text-sm font-bold text-gray-800 leading-tight tracking-tight">{log.message}</p>
                    </div>
                  </div>
                ))
               )}
             </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-10">
            <h2 className="text-3xl font-black px-2 tracking-tighter italic uppercase">Configuration</h2>
            <div className="space-y-8">
              <div className="space-y-3 px-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">보호자 비상 연락처</label>
                <input value={state.guardianPhone} onChange={e => setState(prev => ({ ...prev, guardianPhone: e.target.value }))} className="w-full bg-white px-8 py-6 rounded-[2.5rem] border-2 border-gray-100 font-black outline-none text-2xl text-blue-600 focus:border-blue-600 transition-all shadow-sm" placeholder="010-0000-0000" />
              </div>

              <div className="space-y-3 px-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">조회 키워드 (일반)</label>
                <input value={state.keyword} onChange={e => setState(prev => ({ ...prev, keyword: e.target.value }))} className="w-full bg-white px-8 py-6 rounded-[2.5rem] border-2 border-gray-100 font-black outline-none text-2xl text-gray-800 focus:border-blue-600 transition-all shadow-sm" placeholder="어디야" />
                <p className="text-[9px] text-gray-500 font-bold ml-4">* 문자에 포함될 시 위치를 답장하는 일반 키워드입니다.</p>
              </div>

              <div className="space-y-4 px-2">
                <div className="flex justify-between items-center ml-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">일일 조회 한도 (최대 10회)</label>
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-black">{state.dailyLimit}회</span>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] border-2 border-gray-100 shadow-sm flex items-center gap-4">
                  <SlidersHorizontal className="w-5 h-5 text-gray-400 shrink-0" />
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    step="1" 
                    value={state.dailyLimit} 
                    onChange={e => setState(prev => ({ ...prev, dailyLimit: parseInt(e.target.value) }))}
                    className="flex-1 accent-blue-600 h-2 bg-gray-100 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div className="bg-slate-900 p-8 rounded-[3rem] border border-slate-800 space-y-4">
                 <div className="flex items-center gap-2"><Lock className="w-4 h-4 text-blue-400" /><p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Master Unlock Code</p></div>
                 <p className="text-4xl font-black tracking-[0.4em] italic text-white">{TERMINATION_PASSWORD}</p>
                 <p className="text-[10px] text-slate-500 font-bold leading-relaxed opacity-70 italic">이 코드는 마스터 키워드와 별개로, 앱 잠금 해제에만 사용됩니다.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-10 left-8 right-8 h-24 bg-white/90 backdrop-blur-2xl rounded-[3.5rem] border border-gray-200/50 flex items-center justify-around px-10 shadow-[0_25px_60px_rgba(0,0,0,0.18)] z-40">
        <button onClick={() => setActiveTab('dashboard')} className={`p-4 transition-all rounded-2xl ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-300'}`}><Target className="w-7 h-7" /></button>
        <button onClick={() => setActiveTab('logs')} className={`p-4 transition-all rounded-2xl ${activeTab === 'logs' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-300'}`}><History className="w-7 h-7" /></button>
        <button onClick={() => setActiveTab('settings')} className={`p-4 transition-all rounded-2xl ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-300'}`}><Settings className="w-7 h-7" /></button>
      </nav>
    </div>
  );
};

export default App;
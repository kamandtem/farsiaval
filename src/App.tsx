import React, { useCallback, useEffect, useState } from 'react';
import { HeaderNav } from './components/HeaderNav';
import { HomeScreen } from './components/HomeScreen';
import { MagneticBoard } from './components/MagneticBoard';
import { TracePractice } from './components/TracePractice';
import { WordGames } from './components/WordGames';
import { MathGames } from './components/MathGames';
import { ProgressGarden } from './components/ProgressGarden';
import { SplashScreen } from './components/SplashScreen';
import { SubjectSelect } from './components/SubjectSelect';
import { VillageMap } from './components/VillageMap';
import { RecognitionVillage } from './components/RecognitionVillage';
import { SentenceBuilder } from './components/SentenceBuilder';
import { WordVillage } from './components/WordVillage';
import { MyProgress } from './components/MyProgress';
import { ExitDialog } from './components/ExitDialog';
import { ActiveScreen, UserProgress } from './types';
import { loadProgress, recordActivityCompleted } from './utils/progressStorage';
import { sound } from './utils/audio';
import { initBackNavigation, useBackHandler } from './utils/backNav';
import { initNativeChrome, setStatusBarColor } from './utils/native';

const STATUS_COLORS: Partial<Record<ActiveScreen, string>> = { splash: '#57C3F1', village_map: '#57C3F1', recognition_village: '#57C3F1', word_village: '#6FE3AE', sentence_builder: '#7CCBFF', my_progress: '#8FD3FF' };

/** بخش‌هایی که «ادامه» می‌تواند کودک را به آن‌ها برگرداند */
const RESUME_KEY = 'alefba_last_screen_v1';
const RESUMABLE: Partial<Record<ActiveScreen, string>> = { recognition_village: 'آشنایی با حروف', word_village: 'کلمه‌نویسی', sentence_builder: 'جمله‌سازی', magnetic_board: 'تخته حروف', trace_practice: 'تمرین نوشتن', word_games: 'بازی کلمه‌ها', math_games: 'بازی با عددها' };
const readResume = (): ActiveScreen | null => { try { const v = localStorage.getItem(RESUME_KEY) as ActiveScreen | null; return v && RESUMABLE[v] ? v : null; } catch { return null; } };

export default function App() {
  return <><AppScreens /><ExitDialog /></>;
}

function AppScreens() {
  const [screen, setScreen] = useState<ActiveScreen>('splash');
  const [progress, setProgress] = useState<UserProgress>(loadProgress());
  const [subject, setSubject] = useState<'persian'|'math'>('persian');
  const [skipNativeSplash, setSkipNativeSplash] = useState(false);
  /** اگر «پیشرفت من» از داخل یک بازی باز شد، برگشت به همان بازی */
  const [progressFrom, setProgressFrom] = useState<ActiveScreen | null>(null);
  const complete = useCallback((type:'letter'|'word'|'math', id?:string)=>setProgress(recordActivityCompleted(type,id)),[]);
  const navigate = (next:ActiveScreen) => { sound.playPop(); setScreen(next); };
  useEffect(()=>{ initBackNavigation(); initNativeChrome(); },[]);
  useEffect(()=>{ setStatusBarColor(STATUS_COLORS[screen] || '#FFD25A'); },[screen]);
  useEffect(()=>{ if(RESUMABLE[screen]) { try { localStorage.setItem(RESUME_KEY, screen); } catch { /* ignore */ } } },[screen]);
  const toStart = () => { setSkipNativeSplash(true); navigate('splash'); };
  // دکمهٔ برگشت گوشی برای بخش‌هایی که هدر عمومی دارند
  const legacyBack = () => navigate(screen==='home'||screen==='progress_garden' ? 'village_map' : 'home');
  useBackHandler(legacyBack, !['splash','subject_select','village_map','recognition_village','word_village','sentence_builder','my_progress'].includes(screen));
  useBackHandler(()=>navigate('splash'), screen==='subject_select');
  useEffect(()=>{ if(screen==='splash') document.body.classList.add('app-splash'); else document.body.classList.remove('app-splash'); },[screen]);

  if(screen==='splash') { const resume = readResume(); return <SplashScreen skipNativeSplash={skipNativeSplash} resumeLabel={resume ? RESUMABLE[resume] : null}
    onStart={()=>{setSkipNativeSplash(true);navigate('village_map')}}
    onContinue={()=>{setSkipNativeSplash(true);navigate(readResume() || 'village_map')}}
    onProgress={()=>{setSkipNativeSplash(true);navigate('my_progress')}}/>; }
  if(screen==='my_progress') return <MyProgress progress={progress} onBack={()=>{ if(progressFrom){ const f=progressFrom; setProgressFrom(null); navigate(f); } else toStart(); }}/>;
  if(screen==='subject_select') return <SubjectSelect onSelect={s=>{setSubject(s);navigate(s==='persian'?'village_map':'math_games')}}/>;
  if(screen==='village_map') return <VillageMap onSubject={()=>{setSkipNativeSplash(true);navigate('splash')}} onNavigate={navigate} onVillage={v=>navigate(v==='recognition'?'recognition_village':v==='word'?'word_village':'sentence_builder')}/>;
  if(screen==='recognition_village') return <RecognitionVillage onBack={()=>navigate('village_map')} onHome={()=>{setSkipNativeSplash(true);navigate('splash')}} onComplete={complete}/>;
  if(screen==='word_village') return <WordVillage onBack={()=>navigate('village_map')} onComplete={complete} stars={progress.starsCount} onProgress={()=>{ setProgressFrom('word_village'); navigate('my_progress'); }}/>;
  if(screen==='sentence_builder') return <SentenceBuilder onBack={()=>navigate('village_map')} onComplete={complete}/>;

  return <div id="persian-first-grade-app-root" className="legacy-shell min-h-screen w-full text-slate-800 flex flex-col select-none overflow-x-hidden" dir="rtl">
    <HeaderNav currentScreen={screen} onNavigate={navigate} starsCount={progress.starsCount} onBack={legacyBack}/>
    <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden p-1 sm:p-2">
      {screen==='home' && <HomeScreen onNavigate={navigate} progress={progress}/>} 
      {screen==='magnetic_board' && <MagneticBoard onActivityComplete={complete}/>} 
      {screen==='trace_practice' && <TracePractice onActivityComplete={complete}/>} 
      {screen==='word_games' && <WordGames onActivityComplete={complete}/>} 
      {screen==='math_games' && <MathGames onActivityComplete={complete}/>} 
      {screen==='progress_garden' && <ProgressGarden progress={progress} onBack={()=>navigate('village_map')}/>} 
    </main>
  </div>;
}

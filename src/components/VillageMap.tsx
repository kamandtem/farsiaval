import React, { useState } from 'react';

import { ActiveScreen } from '../types';
import { sound } from '../utils/audio';
import { CURRICULUM, kidDisplay } from '../data/curriculum';
import { LessonSheet } from './shared/LessonPicker';
import { toFa, useCurrentLesson } from '../utils/lessonState';
import { useBackHandler } from '../utils/backNav';
import { MapScreen } from './shared/MapScreen';
import { MapSpot } from './shared/MapSpot';
import { CloseArt, OkArt } from './shared/ArtButtons';

export interface MapProps { onNavigate:(screen:ActiveScreen)=>void; onVillage:(v:'recognition'|'word'|'sentence')=>void; onSubject:()=>void; }
/* چینش از بالا به پایین: دهکدهٔ اول بالای نقشه، دهکدهٔ سوم پایین (هر جزیره با همان نقاشیِ جای خودش) */
const villages = [
  { id:'recognition' as const, title:'آشنایی با حروف', subtitle:'ببین، بشنو و کشف کن', asset:'/assets/map-island-1.webp', tone:'coral', text:'در این دهکده با شکل و صدای حروف فارسی آشنا می‌شوی و تمرین می‌کنی آن‌ها را درست تشخیص بدهی.',
    place:{ left:24.38, top:4.14, w:41.94, ratio:1, bb:[16.2,85.7,11.5,88.8] as [number,number,number,number] } },
  { id:'word' as const, title:'کلمه‌نویسی', subtitle:'با حروف کلمه بساز', asset:'/assets/map-island-2.webp', tone:'green', text:'اینجا حروف را کنار هم می‌گذاری و با آن‌ها کلمه‌های تازه می‌سازی.',
    place:{ left:17.40, top:29.45, w:63.02, ratio:1, bb:[21.3,76.3,18.2,88.5] as [number,number,number,number] } },
  { id:'sentence' as const, title:'جمله‌سازی', subtitle:'با کلمه‌ها جمله بساز', asset:'/assets/map-island-3.webp', tone:'blue', text:'در این دهکده کلمه‌ها را مرتب می‌کنی و جمله‌های کوتاه و درست می‌سازی.',
    place:{ left:29.57, top:61.78, w:73.03, ratio:1, bb:[22.7,73.5,13.3,91.2] as [number,number,number,number] } },
];

export const VillageMap: React.FC<MapProps> = ({onNavigate,onVillage,onSubject}) => {
  const [helpOpen,setHelpOpen] = useState(false);
  const openHelp=()=>{sound.playPop();setHelpOpen(true)};
  const [calOpen,setCalOpen]=useState(false);
  const [lesson]=useCurrentLesson();
  const cur=CURRICULUM[lesson-1];
  useBackHandler(()=>{ if(helpOpen){setHelpOpen(false);return;} onSubject(); });
  return <MapScreen id="islands" map="/assets/island-map.webp" alt="نقشه مسیر دهکده الفبا" overlay={<>
    <header className="map-topbar">
      <button className="map-svg-button" onClick={()=>{sound.playPop();onSubject()}} aria-label="بازگشت به صفحه شروع"><img src="/assets/map-home.svg" alt="خانه" /></button>
      <div className="map-title-ribbon"><small>ماجراجویی من</small><strong>جزیرهٔ الفبا</strong></div>
      <button className="map-svg-button" onClick={openHelp} aria-label="راهنمای نقشه"><img src="/assets/map-help.svg" alt="راهنما" /></button>
    </header>
    <button className="lesson-chip" onClick={()=>{sound.playPop();setCalOpen(true)}}><span>📅 درس من</span><b className="tahriri">{kidDisplay(cur.sign)}</b><small>درس {toFa(lesson)} از {toFa(CURRICULUM.length)}</small></button>
    <LessonSheet open={calOpen} onClose={()=>setCalOpen(false)} />
    {helpOpen && <div className="map-help-backdrop" role="presentation" onClick={()=>setHelpOpen(false)}>
      <section className="map-help-panel" role="dialog" aria-modal="true" aria-labelledby="map-help-title" onClick={e=>e.stopPropagation()}>
        <CloseArt className="map-help-close" onClick={()=>setHelpOpen(false)} />
        <div className="map-help-mark">؟</div>
        <h2 id="map-help-title">راهنمای نقشه</h2>
        <p>در دهکده الفبا، سه مسیر برای یادگیری داری. روی هر دهکده بزن تا وارد مرحله مخصوص آن شوی.</p>
        <div className="map-help-list">{villages.map((v,i)=><button key={v.id} onClick={()=>{setHelpOpen(false);sound.playPop();onVillage(v.id)}}><span>{toFa(i+1)}</span><strong>{v.title}</strong><small>{v.text}</small></button>)}</div>
        <OkArt className="map-help-ok" onClick={()=>setHelpOpen(false)} label="فهمیدم، بریم بازی!" caption="فهمیدم، بریم بازی!" />
      </section>
    </div>}
  </>}>
    {/* از پایین به بالا در DOM تا لایه‌بندیِ هم‌پوشانیِ جزیره‌ها مثل قبل بماند */}
    {villages.map((v,index)=>({v,index})).reverse().map(({v,index})=><MapSpot key={v.id} place={v.place} art={v.asset} index={index} title={v.title} subtitle={v.subtitle} tone={v.tone} hint={index===0}
      onClick={()=>{sound.playPop();onVillage(v.id)}} />)}
  </MapScreen>;
};

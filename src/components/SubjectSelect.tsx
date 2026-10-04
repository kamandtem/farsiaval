import React from 'react';
import { BookOpen, Calculator, ChevronLeft } from 'lucide-react';
import { sound } from '../utils/audio';
export const SubjectSelect: React.FC<{onSelect:(subject:'persian'|'math')=>void}> = ({onSelect}) => <main className="subject-screen" dir="rtl">
  <div className="subject-heading"><span className="eyebrow">امروز کجا بریم؟</span><h1>یک درس را انتخاب کن</h1><p>با بازی جلو برو، هر وقت خواستی می‌توانی مسیرهای دیگر را هم امتحان کنی.</p></div>
  <div className="subject-choice-row">
    <button className="subject-choice persian-choice" onClick={()=>{sound.speakPersian('دهکده فارسی');onSelect('persian')}}><span className="choice-icon">اَ</span><div><b>دهکده فارسی</b><small>حروف، کلمه‌ها و جمله‌ها</small></div><ChevronLeft/></button>
    <button className="subject-choice math-choice" onClick={()=>onSelect('math')}><span className="choice-icon">۱۲</span><div><b>دهکده ریاضی</b><small>شمارش، جمع و تفریق</small></div><ChevronLeft/></button>
  </div>
</main>;

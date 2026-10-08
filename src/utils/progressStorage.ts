import { UserProgress } from '../types';

const STORAGE_KEY = 'alefba_child_progress_v1';

const getTodayString = () => new Date().toISOString().split('T')[0];

const defaultProgress: UserProgress = {
  activitiesDoneToday: 0,
  lettersLearned: ['alef', 'be', 'mim'],
  wordsCompleted: ['ab', 'baba'],
  mathChallengesSolved: 2,
  gardenLeaves: 5,
  starsCount: 8,
  lastActiveDate: getTodayString()
};

export function loadProgress(): UserProgress {
  if (typeof window === 'undefined') return defaultProgress;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress;
    const data: UserProgress = JSON.parse(raw);
    const today = getTodayString();
    if (data.lastActiveDate !== today) {
      data.activitiesDoneToday = 0;
      data.lastActiveDate = today;
    }
    return data;
  } catch {
    return defaultProgress;
  }
}

export function saveProgress(data: UserProgress) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore
  }
}

export function recordActivityCompleted(type: 'letter' | 'word' | 'math', id?: string): UserProgress {
  const current = loadProgress();
  current.activitiesDoneToday += 1;
  current.starsCount += 1;
  if (current.activitiesDoneToday % 2 === 0) {
    current.gardenLeaves += 1;
  }

  if (type === 'letter' && id && !current.lettersLearned.includes(id)) {
    current.lettersLearned.push(id);
  } else if (type === 'word' && id && !current.wordsCompleted.includes(id)) {
    current.wordsCompleted.push(id);
  } else if (type === 'math') {
    current.mathChallengesSolved += 1;
  }

  saveProgress(current);
  return current;
}

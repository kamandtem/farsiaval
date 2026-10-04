import { PERSIAN_LETTERS, HARAKAT_LIST } from '../data/persianAlphabet';
import { PersianLetter, HarakatSymbol, PlacedMagneticPiece, WordItem } from '../types';
import { tashdidProfile } from './pieces';

export interface ClusterInfo {
  id: string;
  pieces: PlacedMagneticPiece[];
  connectedText: string;
  normalizedText: string;
  hasDiacritics: boolean;
  matchedWord?: WordItem;
}

export const SNAP_DISTANCE_X = 82;
export const SNAP_DISTANCE_Y = 54;
export const HARAKAT_SNAP_DIST = 62;
export const TASHDID_SNAP_X = 28;
export const TASHDID_SNAP_Y = 28;
export const CONNECTED_SPACING = 50;
export const NON_CONNECTED_SPACING = 64;

export const getLetterById = (id: string) => PERSIAN_LETTERS.find(l => l.id === id);
export const getHarakatById = (id: string) => HARAKAT_LIST.find(h => h.id === id);

export function normalizePersian(value: string, keepHarakat = false): string {
  let result = value
    .replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/ۀ/g, 'ه')
    .replace(/ـ/g, '').replace(/\u200c|\u200f|\u200e/g, '').trim();
  if (!keepHarakat) result = result.replace(/[\u064B-\u0652\u0670]/g, '');
  return result;
}

export function computePersianForms(letters: PersianLetter[]): ('isolated'|'initial'|'medial'|'final')[] {
  return letters.map((current, i) => {
    const prev = letters[i - 1];
    const next = letters[i + 1];
    const right = Boolean(prev && prev.canConnectAfter && current.canConnectBefore);
    const left = Boolean(next && current.canConnectAfter && next.canConnectBefore);
    if (right && left) return 'medial';
    if (right) return 'final';
    if (left) return 'initial';
    return 'isolated';
  });
}

export function getLetterGlyph(letter: PersianLetter, form: 'isolated'|'initial'|'medial'|'final') {
  return letter[form];
}

export interface SnapTargetResult {
  targetPiece: PlacedMagneticPiece;
  snapType: 'horizontal_letter'|'harakat_attach';
  snapX: number;
  snapY: number;
}

export function findSnapCandidate(dragged: PlacedMagneticPiece, pieces: PlacedMagneticPiece[], ignoreId: string): SnapTargetResult | null {
  const others = pieces.filter(p => p.id !== ignoreId);
  if (dragged.type === 'harakat') {
    const mark = getHarakatById(dragged.harakatId || '');
    if (!mark) return null;
    let best: SnapTargetResult | null = null;
    let distance = Infinity;
    for (const target of others.filter(p => p.type === 'letter')) {
      const isTashdid = mark.id === 'tashdid';
      const expectedY = target.y - 34;
      const dx = dragged.x - target.x;
      const dy = dragged.y - target.y;
      const tashdidDy = dragged.y - expectedY;
      if (isTashdid && (dragged.y >= target.y || Math.abs(dx) > TASHDID_SNAP_X || Math.abs(tashdidDy) > TASHDID_SNAP_Y)) continue;
      const d = isTashdid ? Math.hypot(dx, tashdidDy) : Math.hypot(dx, dy);
      if (d < HARAKAT_SNAP_DIST && d < distance) {
        distance = d;
        best = { targetPiece: target, snapType: 'harakat_attach', snapX: target.x, snapY: target.y + (mark.position === 'above' ? -34 : 34) };
      }
    }
    return best;
  }

  let best: SnapTargetResult | null = null;
  let distance = Infinity;
  for (const target of others.filter(p => p.type === 'letter')) {
    const dx = dragged.x - target.x;
    const dy = Math.abs(dragged.y - target.y);
    if (Math.abs(dx) > SNAP_DISTANCE_X || dy > SNAP_DISTANCE_Y) continue;
    const d = Math.hypot(dx, dy);
    if (d >= distance) continue;
    distance = d;
    const draggedDef = getLetterById(dragged.letterId || '');
    const targetDef = getLetterById(target.letterId || '');
    const isLeft = dx < 0;
    const connects = isLeft
      ? Boolean(targetDef?.canConnectAfter && draggedDef?.canConnectBefore)
      : Boolean(draggedDef?.canConnectAfter && targetDef?.canConnectBefore);
    const gap = connects ? CONNECTED_SPACING : NON_CONNECTED_SPACING;
    best = { targetPiece: target, snapType: 'horizontal_letter', snapX: target.x + (isLeft ? -gap : gap), snapY: target.y };
  }
  return best;
}

export function clusterPieces(pieces: PlacedMagneticPiece[], dictionary: WordItem[] = []): ClusterInfo[] {
  const letters = pieces.filter(p => p.type === 'letter');
  const seen = new Set<string>();
  const result: ClusterInfo[] = [];
  for (const seed of letters) {
    if (seen.has(seed.id)) continue;
    const group: PlacedMagneticPiece[] = [];
    const queue = [seed]; seen.add(seed.id);
    while (queue.length) {
      const current = queue.shift()!; group.push(current);
      for (const other of letters) {
        if (seen.has(other.id)) continue;
        if (Math.abs(current.x - other.x) <= SNAP_DISTANCE_X + 6 && Math.abs(current.y - other.y) <= SNAP_DISTANCE_Y) {
          seen.add(other.id); queue.push(other);
        }
      }
    }
    group.sort((a, b) => b.x - a.x);
    const ids = new Set(group.map(p => p.id));
    const marks = pieces.filter(p => p.type === 'harakat' && p.attachedToLetterId && ids.has(p.attachedToLetterId));
    let text = '';
    for (const letterPiece of group) {
      const letter = getLetterById(letterPiece.letterId || '');
      if (!letter) continue;
      text += letterPiece.customGlyph || letter.isolated;
      marks.filter(m => m.attachedToLetterId === letterPiece.id)
        .sort((a,b) => a.y - b.y)
        .forEach(m => { text += getHarakatById(m.harakatId || '')?.symbol || ''; });
    }
    const normalized = normalizePersian(text);
    const matchedWord = dictionary.find(w => {
      const sameBase = normalizePersian(w.word) === normalized || (w.acceptedForms || []).some(f => normalizePersian(f) === normalized);
      if (!sameBase) return false;
      const expectedTashdid = tashdidProfile(w.word);
      return !expectedTashdid || expectedTashdid === tashdidProfile(text);
    });
    result.push({ id: `cluster_${group.map(p => p.id).join('_')}`, pieces: [...group, ...marks], connectedText: text, normalizedText: normalized, hasDiacritics: marks.length > 0, matchedWord });
  }
  return result;
}

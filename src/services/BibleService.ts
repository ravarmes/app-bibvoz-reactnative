import john1 from '../data/bible/john_1.json';
import john2 from '../data/bible/john_2.json';
import john3 from '../data/bible/john_3.json';
import john4 from '../data/bible/john_4.json';
import john5 from '../data/bible/john_5.json';
import john6 from '../data/bible/john_6.json';
import john7 from '../data/bible/john_7.json';
import john8 from '../data/bible/john_8.json';
import john9 from '../data/bible/john_9.json';
import john10 from '../data/bible/john_10.json';
import psalms1 from '../data/bible/psalms_1.json';
import psalms2 from '../data/bible/psalms_2.json';

export interface Verse {
  verse: number;
  en: string;
  pt: string;
}

export interface Chapter {
  book: string;
  bookPt: string;
  chapter: number;
  translationEn: string;
  translationPt: string;
  verses: Verse[];
}

export interface BookOption {
  id: string;
  name: string;
  namePt: string;
  chapters: number[];
}

const CATALOG: Record<string, Record<number, Chapter>> = {
  john: {
    1: john1 as Chapter,
    2: john2 as Chapter,
    3: john3 as Chapter,
    4: john4 as Chapter,
    5: john5 as Chapter,
    6: john6 as Chapter,
    7: john7 as Chapter,
    8: john8 as Chapter,
    9: john9 as Chapter,
    10: john10 as Chapter,
  },
  psalms: {
    1: psalms1 as Chapter,
    2: psalms2 as Chapter,
  },
};

export const BibleService = {
  listBooks(): BookOption[] {
    return [
      {
        id: 'john',
        name: 'John',
        namePt: 'João',
        chapters: Object.keys(CATALOG.john).map(Number).sort((a, b) => a - b),
      },
      {
        id: 'psalms',
        name: 'Psalm',
        namePt: 'Salmos',
        chapters: Object.keys(CATALOG.psalms).map(Number).sort((a, b) => a - b),
      },
    ];
  },

  getChapter(bookId: string, chapter: number): Chapter | null {
    return CATALOG[bookId]?.[chapter] ?? null;
  },
};

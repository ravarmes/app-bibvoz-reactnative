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
import proverbs1 from '../data/bible/proverbs_1.json';
import proverbs2 from '../data/bible/proverbs_2.json';
import proverbs3 from '../data/bible/proverbs_3.json';
import proverbs4 from '../data/bible/proverbs_4.json';
import proverbs5 from '../data/bible/proverbs_5.json';
import romans1 from '../data/bible/romans_1.json';
import romans2 from '../data/bible/romans_2.json';
import romans3 from '../data/bible/romans_3.json';
import romans4 from '../data/bible/romans_4.json';
import romans5 from '../data/bible/romans_5.json';
import romans6 from '../data/bible/romans_6.json';
import romans7 from '../data/bible/romans_7.json';
import romans8 from '../data/bible/romans_8.json';
import galatians1 from '../data/bible/galatians_1.json';
import galatians2 from '../data/bible/galatians_2.json';
import galatians3 from '../data/bible/galatians_3.json';
import galatians4 from '../data/bible/galatians_4.json';
import galatians5 from '../data/bible/galatians_5.json';
import galatians6 from '../data/bible/galatians_6.json';

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
  proverbs: {
    1: proverbs1 as Chapter,
    2: proverbs2 as Chapter,
    3: proverbs3 as Chapter,
    4: proverbs4 as Chapter,
    5: proverbs5 as Chapter,
  },
  romans: {
    1: romans1 as Chapter,
    2: romans2 as Chapter,
    3: romans3 as Chapter,
    4: romans4 as Chapter,
    5: romans5 as Chapter,
    6: romans6 as Chapter,
    7: romans7 as Chapter,
    8: romans8 as Chapter,
  },
  galatians: {
    1: galatians1 as Chapter,
    2: galatians2 as Chapter,
    3: galatians3 as Chapter,
    4: galatians4 as Chapter,
    5: galatians5 as Chapter,
    6: galatians6 as Chapter,
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
        id: 'proverbs',
        name: 'Proverbs',
        namePt: 'Provérbios',
        chapters: Object.keys(CATALOG.proverbs).map(Number).sort((a, b) => a - b),
      },
      {
        id: 'romans',
        name: 'Romans',
        namePt: 'Romanos',
        chapters: Object.keys(CATALOG.romans).map(Number).sort((a, b) => a - b),
      },
      {
        id: 'galatians',
        name: 'Galatians',
        namePt: 'Gálatas',
        chapters: Object.keys(CATALOG.galatians).map(Number).sort((a, b) => a - b),
      },
    ];
  },

  getChapter(bookId: string, chapter: number): Chapter | null {
    return CATALOG[bookId]?.[chapter] ?? null;
  },
};

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
import john11 from '../data/bible/john_11.json';
import john12 from '../data/bible/john_12.json';
import john13 from '../data/bible/john_13.json';
import john14 from '../data/bible/john_14.json';
import john15 from '../data/bible/john_15.json';
import john16 from '../data/bible/john_16.json';
import john17 from '../data/bible/john_17.json';
import john18 from '../data/bible/john_18.json';
import john19 from '../data/bible/john_19.json';
import john20 from '../data/bible/john_20.json';
import john21 from '../data/bible/john_21.json';
import proverbs1 from '../data/bible/proverbs_1.json';
import proverbs2 from '../data/bible/proverbs_2.json';
import proverbs3 from '../data/bible/proverbs_3.json';
import proverbs4 from '../data/bible/proverbs_4.json';
import proverbs5 from '../data/bible/proverbs_5.json';
import proverbs6 from '../data/bible/proverbs_6.json';
import proverbs7 from '../data/bible/proverbs_7.json';
import proverbs8 from '../data/bible/proverbs_8.json';
import proverbs9 from '../data/bible/proverbs_9.json';
import proverbs10 from '../data/bible/proverbs_10.json';
import proverbs11 from '../data/bible/proverbs_11.json';
import proverbs12 from '../data/bible/proverbs_12.json';
import proverbs13 from '../data/bible/proverbs_13.json';
import proverbs14 from '../data/bible/proverbs_14.json';
import proverbs15 from '../data/bible/proverbs_15.json';
import proverbs16 from '../data/bible/proverbs_16.json';
import proverbs17 from '../data/bible/proverbs_17.json';
import proverbs18 from '../data/bible/proverbs_18.json';
import proverbs19 from '../data/bible/proverbs_19.json';
import proverbs20 from '../data/bible/proverbs_20.json';
import proverbs21 from '../data/bible/proverbs_21.json';
import proverbs22 from '../data/bible/proverbs_22.json';
import proverbs23 from '../data/bible/proverbs_23.json';
import proverbs24 from '../data/bible/proverbs_24.json';
import proverbs25 from '../data/bible/proverbs_25.json';
import proverbs26 from '../data/bible/proverbs_26.json';
import proverbs27 from '../data/bible/proverbs_27.json';
import proverbs28 from '../data/bible/proverbs_28.json';
import proverbs29 from '../data/bible/proverbs_29.json';
import proverbs30 from '../data/bible/proverbs_30.json';
import proverbs31 from '../data/bible/proverbs_31.json';
import romans1 from '../data/bible/romans_1.json';
import romans2 from '../data/bible/romans_2.json';
import romans3 from '../data/bible/romans_3.json';
import romans4 from '../data/bible/romans_4.json';
import romans5 from '../data/bible/romans_5.json';
import romans6 from '../data/bible/romans_6.json';
import romans7 from '../data/bible/romans_7.json';
import romans8 from '../data/bible/romans_8.json';
import romans9 from '../data/bible/romans_9.json';
import romans10 from '../data/bible/romans_10.json';
import romans11 from '../data/bible/romans_11.json';
import romans12 from '../data/bible/romans_12.json';
import romans13 from '../data/bible/romans_13.json';
import romans14 from '../data/bible/romans_14.json';
import romans15 from '../data/bible/romans_15.json';
import romans16 from '../data/bible/romans_16.json';
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
    11: john11 as Chapter,
    12: john12 as Chapter,
    13: john13 as Chapter,
    14: john14 as Chapter,
    15: john15 as Chapter,
    16: john16 as Chapter,
    17: john17 as Chapter,
    18: john18 as Chapter,
    19: john19 as Chapter,
    20: john20 as Chapter,
    21: john21 as Chapter,
  },
  proverbs: {
    1: proverbs1 as Chapter,
    2: proverbs2 as Chapter,
    3: proverbs3 as Chapter,
    4: proverbs4 as Chapter,
    5: proverbs5 as Chapter,
    6: proverbs6 as Chapter,
    7: proverbs7 as Chapter,
    8: proverbs8 as Chapter,
    9: proverbs9 as Chapter,
    10: proverbs10 as Chapter,
    11: proverbs11 as Chapter,
    12: proverbs12 as Chapter,
    13: proverbs13 as Chapter,
    14: proverbs14 as Chapter,
    15: proverbs15 as Chapter,
    16: proverbs16 as Chapter,
    17: proverbs17 as Chapter,
    18: proverbs18 as Chapter,
    19: proverbs19 as Chapter,
    20: proverbs20 as Chapter,
    21: proverbs21 as Chapter,
    22: proverbs22 as Chapter,
    23: proverbs23 as Chapter,
    24: proverbs24 as Chapter,
    25: proverbs25 as Chapter,
    26: proverbs26 as Chapter,
    27: proverbs27 as Chapter,
    28: proverbs28 as Chapter,
    29: proverbs29 as Chapter,
    30: proverbs30 as Chapter,
    31: proverbs31 as Chapter,
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
    9: romans9 as Chapter,
    10: romans10 as Chapter,
    11: romans11 as Chapter,
    12: romans12 as Chapter,
    13: romans13 as Chapter,
    14: romans14 as Chapter,
    15: romans15 as Chapter,
    16: romans16 as Chapter,
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

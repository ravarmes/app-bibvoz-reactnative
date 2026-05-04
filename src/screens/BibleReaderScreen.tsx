import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Surface, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { BibleService, Chapter, Verse } from '../services/BibleService';
import { usePlayerController, Phase } from '../services/PlayerController';
import { AudioService } from '../services/AudioService';
import { useIap } from '../context/IapContext';

const VERSE_ROW_HEIGHT_ESTIMATE = 160;
const SPEED_STEP = 0.25;
const SPEED_MIN = 0.25;
const SPEED_MAX = 1.50;

export default function BibleReaderScreen() {
  const books = useMemo(() => BibleService.listBooks(), []);
  const [selectedBookIdx, setSelectedBookIdx] = useState(0);
  const [selectedChapter, setSelectedChapter] = useState(books[0].chapters[0]);
  const [enSpeed, setEnSpeedState] = useState(0.50);
  const [ptSpeed, setPtSpeedState] = useState(0.75);

  const currentBook = books[selectedBookIdx];
  const chapter = useMemo(
    () => BibleService.getChapter(currentBook.id, selectedChapter)!,
    [currentBook.id, selectedChapter],
  );

  useEffect(() => {
    AudioService.setRate('en-US', 0.50);
    AudioService.setRate('pt-BR', 0.75);
  }, []);

  const handleBookChange = useCallback((idx: number) => {
    setSelectedBookIdx(idx);
    setSelectedChapter(books[idx].chapters[0]);
  }, [books]);

  const handleSetEnSpeed = useCallback((rate: number) => {
    const snapped = Math.round(rate / SPEED_STEP) * SPEED_STEP;
    const bounded = Math.min(SPEED_MAX, Math.max(SPEED_MIN, snapped));
    AudioService.setRate('en-US', bounded);
    setEnSpeedState(bounded);
  }, []);

  const handleSetPtSpeed = useCallback((rate: number) => {
    const snapped = Math.round(rate / SPEED_STEP) * SPEED_STEP;
    const bounded = Math.min(SPEED_MAX, Math.max(SPEED_MIN, snapped));
    AudioService.setRate('pt-BR', bounded);
    setPtSpeedState(bounded);
  }, []);

  return (
    <View style={styles.container}>
      <Surface style={styles.header} elevation={4}>
        <Text style={styles.headerTitle}>BibVoz</Text>
        <Text style={styles.headerSubtitle}>Inglês pela Bíblia</Text>

        <View style={styles.bookTabs}>
          {books.map((book, idx) => (
            <TouchableOpacity
              key={book.id}
              style={[styles.bookTab, selectedBookIdx === idx && styles.bookTabActive]}
              onPress={() => handleBookChange(idx)}
              activeOpacity={0.7}
            >
              <Text style={[styles.bookTabText, selectedBookIdx === idx && styles.bookTabTextActive]}>
                {book.namePt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chapterScroll}
          contentContainerStyle={styles.chapterScrollContent}
        >
          {currentBook.chapters.map(ch => (
            <TouchableOpacity
              key={ch}
              style={[styles.chapterChip, selectedChapter === ch && styles.chapterChipActive]}
              onPress={() => setSelectedChapter(ch)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chapterChipText, selectedChapter === ch && styles.chapterChipTextActive]}>
                {ch}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Surface>

      <ChapterPlayer
        key={`${currentBook.id}-${selectedChapter}`}
        chapter={chapter}
        enSpeed={enSpeed}
        ptSpeed={ptSpeed}
        setEnSpeed={handleSetEnSpeed}
        setPtSpeed={handleSetPtSpeed}
      />
    </View>
  );
}

interface ChapterPlayerProps {
  chapter: Chapter;
  enSpeed: number;
  ptSpeed: number;
  setEnSpeed: (r: number) => void;
  setPtSpeed: (r: number) => void;
}

function ChapterPlayer({ chapter, enSpeed, ptSpeed, setEnSpeed, setPtSpeed }: ChapterPlayerProps) {
  const verses: Verse[] = chapter.verses;
  const player = usePlayerController(verses);
  const { isAdFree, purchaseRemoveAds, isLoading: iapLoading } = useIap();
  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      y: Math.max(0, (player.currentIndex - 1) * VERSE_ROW_HEIGHT_ESTIMATE),
      animated: true,
    });
  }, [player.currentIndex]);

  return (
    <>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {verses.map((v, idx) => (
          <VerseCard
            key={v.verse}
            verse={v}
            active={idx === player.currentIndex && player.isPlaying}
            phase={idx === player.currentIndex ? player.phase : 'idle'}
            onPress={() => player.jumpTo(idx)}
          />
        ))}

        {!isAdFree && (
          <TouchableOpacity
            style={[styles.removeAdsCard, iapLoading && styles.removeAdsDisabled]}
            disabled={iapLoading}
            onPress={purchaseRemoveAds}
          >
            <MaterialCommunityIcons
              name="star-four-points-outline"
              size={28}
              color="#f59e0b"
            />
            <View style={styles.removeAdsTextWrap}>
              <Text style={styles.removeAdsTitle}>Remover anúncios</Text>
              <Text style={styles.removeAdsDesc}>
                {iapLoading
                  ? 'Conectando à loja...'
                  : 'Pagamento único para uma leitura sem propagandas.'}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={{ height: 96 }} />
      </ScrollView>

      <Surface style={styles.controls} elevation={6}>
        <Text style={styles.controlsStatus}>
          Versículo {verses[player.currentIndex]?.verse ?? 1} / {verses.length}
          {player.isPlaying && (player.phase === 'en' ? '  •  EN' : '  •  PT')}
        </Text>
        <View style={styles.controlsButtons}>
          <ControlButton
            icon="skip-previous"
            onPress={() => player.jumpTo(Math.max(0, player.currentIndex - 1))}
          />
          {player.isPlaying ? (
            <ControlButton icon="pause" main onPress={player.pause} />
          ) : (
            <ControlButton icon="play" main onPress={() => player.play()} />
          )}
          <ControlButton
            icon="skip-next"
            onPress={() =>
              player.jumpTo(Math.min(verses.length - 1, player.currentIndex + 1))
            }
          />
        </View>
        <View style={styles.speedControls}>
          <SpeedRow
            label="EN"
            speed={enSpeed}
            onDecrease={() => setEnSpeed(enSpeed - SPEED_STEP)}
            onIncrease={() => setEnSpeed(enSpeed + SPEED_STEP)}
          />
          <SpeedRow
            label="PT"
            speed={ptSpeed}
            onDecrease={() => setPtSpeed(ptSpeed - SPEED_STEP)}
            onIncrease={() => setPtSpeed(ptSpeed + SPEED_STEP)}
          />
        </View>
      </Surface>
    </>
  );
}

interface SpeedRowProps {
  label: string;
  speed: number;
  onDecrease: () => void;
  onIncrease: () => void;
}

const SpeedRow = ({ label, speed, onDecrease, onIncrease }: SpeedRowProps) => (
  <View style={styles.speedRow}>
    <Text style={styles.speedLabel}>{label}</Text>
    <TouchableOpacity
      onPress={onDecrease}
      style={[styles.speedButton, speed <= SPEED_MIN && styles.speedButtonDisabled]}
      disabled={speed <= SPEED_MIN}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons
        name="minus"
        size={16}
        color={speed <= SPEED_MIN ? '#d1d5db' : '#6366f1'}
      />
    </TouchableOpacity>
    <View style={styles.speedValueBox}>
      <Text style={styles.speedValue}>{speed.toFixed(2)}×</Text>
    </View>
    <TouchableOpacity
      onPress={onIncrease}
      style={[styles.speedButton, speed >= SPEED_MAX && styles.speedButtonDisabled]}
      disabled={speed >= SPEED_MAX}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons
        name="plus"
        size={16}
        color={speed >= SPEED_MAX ? '#d1d5db' : '#6366f1'}
      />
    </TouchableOpacity>
  </View>
);

interface VerseCardProps {
  verse: Verse;
  active: boolean;
  phase: Phase;
  onPress: () => void;
}

const VerseCard = ({ verse, active, phase, onPress }: VerseCardProps) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
    <Surface
      style={[styles.verseCard, active && styles.verseCardActive]}
      elevation={active ? 4 : 1}
    >
      <View style={styles.verseHeader}>
        <Text style={[styles.verseNumber, active && styles.verseNumberActive]}>
          {verse.verse}
        </Text>
        {active && (
          <View style={styles.phaseBadge}>
            <MaterialCommunityIcons
              name={phase === 'pt' ? 'translate' : 'volume-high'}
              size={14}
              color="#fff"
            />
            <Text style={styles.phaseBadgeText}>
              {phase === 'pt' ? 'PT-BR' : 'EN-US'}
            </Text>
          </View>
        )}
      </View>
      <Text
        style={[
          styles.verseEn,
          active && phase === 'en' && styles.verseHighlight,
        ]}
      >
        {verse.en}
      </Text>
      <Text
        style={[
          styles.versePt,
          active && phase === 'pt' && styles.verseHighlight,
        ]}
      >
        {verse.pt}
      </Text>
    </Surface>
  </TouchableOpacity>
);

interface ControlButtonProps {
  icon: string;
  onPress: () => void;
  main?: boolean;
}

const ControlButton = ({ icon, onPress, main }: ControlButtonProps) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.controlButton, main && styles.controlButtonMain]}
    activeOpacity={0.7}
  >
    <MaterialCommunityIcons
      name={icon}
      size={main ? 36 : 28}
      color={main ? '#fff' : '#6366f1'}
    />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    paddingTop: 32,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#6366f1',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: 2,
  },
  bookTabs: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  bookTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  bookTabActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderColor: 'rgba(255,255,255,0.7)',
  },
  bookTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.65)',
  },
  bookTabTextActive: {
    color: '#fff',
  },
  chapterScroll: {
    marginTop: 10,
  },
  chapterScrollContent: {
    paddingHorizontal: 2,
    gap: 8,
  },
  chapterChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  chapterChipActive: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderColor: '#fff',
  },
  chapterChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
  },
  chapterChipTextActive: {
    color: '#6366f1',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 0,
  },
  verseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  verseCardActive: {
    borderLeftColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  verseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  verseNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  verseNumberActive: {
    color: '#4338ca',
  },
  phaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  phaseBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  verseEn: {
    fontSize: 17,
    color: '#1f2937',
    fontWeight: '600',
    lineHeight: 24,
  },
  versePt: {
    fontSize: 14,
    color: '#4b5563',
    marginTop: 6,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  verseHighlight: {
    color: '#4338ca',
    fontWeight: '700',
  },
  removeAdsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  removeAdsDisabled: {
    opacity: 0.6,
  },
  removeAdsTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  removeAdsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400e',
  },
  removeAdsDesc: {
    fontSize: 13,
    color: '#78350f',
    marginTop: 2,
  },
  controls: {
    backgroundColor: '#fff',
    paddingTop: 10,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  controlsStatus: {
    textAlign: 'center',
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  controlsButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2ff',
    marginHorizontal: 12,
  },
  controlButtonMain: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#6366f1',
  },
  speedControls: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  speedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  speedLabel: {
    width: 28,
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  speedButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedButtonDisabled: {
    backgroundColor: '#f9fafb',
  },
  speedValueBox: {
    width: 52,
    alignItems: 'center',
  },
  speedValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366f1',
  },
});

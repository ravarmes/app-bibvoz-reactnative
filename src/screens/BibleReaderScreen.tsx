import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Surface, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { BibleService, Chapter, Verse } from '../services/BibleService';
import { usePlayerController, Phase, PlaybackMode, EnVoice } from '../services/PlayerController';
import { AudioService } from '../services/AudioService';
import { useIap } from '../context/IapContext';
import { useSettings } from '../context/SettingsContext';

const SPEED_STEP = 0.25;
const SPEED_MIN = 0.25;
const SPEED_MAX = 1.50;

const INDIGO = '#6366f1';
const INDIGO_DARK = '#4338ca';
const INDIGO_LIGHT = '#818cf8';
const INDIGO_PALE = '#eef2ff';
const INDIGO_HEADER = '#5254CC';

const MODE_LABELS: Record<PlaybackMode, string> = {
  'pt-en': 'PT → EN',
  'en-pt': 'EN → PT',
  'en-only': 'Só EN',
};

export default function BibleReaderScreen() {
  const books = useMemo(() => BibleService.listBooks(), []);
  const {
    enVoice, setEnVoice,
    playbackMode, setPlaybackMode,
    lastPosition, saveLastPosition,
    enSpeed, setEnSpeed: saveEnSpeed,
    ptSpeed, setPtSpeed: savePtSpeed,
  } = useSettings();

  const [selectedBookIdx, setSelectedBookIdx] = useState(() => {
    if (!lastPosition) return 0;
    const idx = books.findIndex(b => b.id === lastPosition.bookId);
    return idx >= 0 ? idx : 0;
  });

  const [selectedChapter, setSelectedChapter] = useState(() => {
    if (!lastPosition) return books[0].chapters[0];
    const idx = books.findIndex(b => b.id === lastPosition.bookId);
    const book = books[idx >= 0 ? idx : 0];
    return book.chapters.includes(lastPosition.chapter) ? lastPosition.chapter : book.chapters[0];
  });

  const [initialVerse, setInitialVerse] = useState(() => lastPosition?.verseIndex ?? 0);
  const [settingsVisible, setSettingsVisible] = useState(false);

  const currentBook = books[selectedBookIdx];
  const chapter = useMemo(
    () => BibleService.getChapter(currentBook.id, selectedChapter)!,
    [currentBook.id, selectedChapter],
  );

  useEffect(() => {
    AudioService.setRate('en-US', enSpeed);
    AudioService.setRate('pt-BR', ptSpeed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBookChange = useCallback((idx: number) => {
    setSelectedBookIdx(idx);
    setSelectedChapter(books[idx].chapters[0]);
    setInitialVerse(0);
  }, [books]);

  const handleChapterChange = useCallback((ch: number) => {
    setSelectedChapter(ch);
    setInitialVerse(0);
  }, []);

  const handleSetEnSpeed = useCallback((rate: number) => {
    const bounded = Math.min(SPEED_MAX, Math.max(SPEED_MIN, Math.round(rate / SPEED_STEP) * SPEED_STEP));
    AudioService.setRate('en-US', bounded);
    saveEnSpeed(bounded);
  }, [saveEnSpeed]);

  const handleSetPtSpeed = useCallback((rate: number) => {
    const bounded = Math.min(SPEED_MAX, Math.max(SPEED_MIN, Math.round(rate / SPEED_STEP) * SPEED_STEP));
    AudioService.setRate('pt-BR', bounded);
    savePtSpeed(bounded);
  }, [savePtSpeed]);

  const handleVerseChange = useCallback((verseIndex: number) => {
    saveLastPosition({ bookId: currentBook.id, chapter: selectedChapter, verseIndex });
  }, [saveLastPosition, currentBook.id, selectedChapter]);

  return (
    <View style={styles.container}>
      {/* ── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        {/* Decorative circles for depth */}
        <View style={styles.headerCircle1} pointerEvents="none" />
        <View style={styles.headerCircle2} pointerEvents="none" />

        <View style={styles.headerTop}>
          <View style={styles.headerTopSpacer} />
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>BibVoz</Text>
            <Text style={styles.headerSubtitle}>Inglês pela Bíblia</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setSettingsVisible(true)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="cog-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.bookTabs}>
          {books.map((book, idx) => (
            <TouchableOpacity
              key={book.id}
              style={[styles.bookTab, selectedBookIdx === idx && styles.bookTabActive]}
              onPress={() => handleBookChange(idx)}
              activeOpacity={0.75}
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
              onPress={() => handleChapterChange(ch)}
              activeOpacity={0.75}
            >
              <Text style={[styles.chapterChipText, selectedChapter === ch && styles.chapterChipTextActive]}>
                {ch}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Chapter content ─────────────────────────────── */}
      <ChapterPlayer
        key={`${currentBook.id}-${selectedChapter}`}
        chapter={chapter}
        enSpeed={enSpeed}
        ptSpeed={ptSpeed}
        setEnSpeed={handleSetEnSpeed}
        setPtSpeed={handleSetPtSpeed}
        playbackMode={playbackMode}
        enVoice={enVoice}
        initialVerseIndex={initialVerse}
        onVerseChange={handleVerseChange}
      />

      {/* ── Settings modal ───────────────────────────────── */}
      <Modal
        visible={settingsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSettingsVisible(false)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Configurações</Text>

          <Text style={styles.modalSection}>Voz em Inglês</Text>
          <View style={styles.modalVoiceRow}>
            <ModeOption
              icon="flag"
              label="Americana"
              sublabel="EN-US"
              selected={enVoice === 'en-US'}
              onPress={() => setEnVoice('en-US')}
              style={styles.modalOptionHalf}
            />
            <ModeOption
              icon="flag-outline"
              label="Britânica"
              sublabel="EN-GB"
              selected={enVoice === 'en-GB'}
              onPress={() => setEnVoice('en-GB')}
              style={styles.modalOptionHalf}
            />
          </View>

          <Text style={styles.modalSection}>Modo de Reprodução</Text>
          <ModeOption
            icon="swap-horizontal"
            label="PT → EN"
            sublabel="Primeiro português, depois inglês (padrão)"
            selected={playbackMode === 'pt-en'}
            onPress={() => setPlaybackMode('pt-en')}
          />
          <ModeOption
            icon="swap-horizontal"
            label="EN → PT"
            sublabel="Primeiro inglês, depois português"
            selected={playbackMode === 'en-pt'}
            onPress={() => setPlaybackMode('en-pt')}
          />
          <ModeOption
            icon="volume-high"
            label="Somente Inglês"
            sublabel="Ideal para alunos avançados"
            selected={playbackMode === 'en-only'}
            onPress={() => setPlaybackMode('en-only')}
          />

          <TouchableOpacity style={styles.modalClose} onPress={() => setSettingsVisible(false)} activeOpacity={0.85}>
            <Text style={styles.modalCloseText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

// ── ModeOption ────────────────────────────────────────────────

interface ModeOptionProps {
  icon: string;
  label: string;
  sublabel?: string;
  selected: boolean;
  onPress: () => void;
  style?: object;
}

const ModeOption = ({ icon, label, sublabel, selected, onPress, style }: ModeOptionProps) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.modalOption, selected && styles.modalOptionSelected, style]}
    activeOpacity={0.7}
  >
    <View style={[styles.modalOptionIcon, selected && styles.modalOptionIconSelected]}>
      <MaterialCommunityIcons name={icon} size={16} color={selected ? '#fff' : INDIGO} />
    </View>
    <View style={styles.modalOptionContent}>
      <Text style={[styles.modalOptionText, selected && styles.modalOptionTextSelected]}>
        {label}
      </Text>
      {sublabel ? (
        <Text style={[styles.modalOptionSublabel, selected && styles.modalOptionSublabelSelected]}>
          {sublabel}
        </Text>
      ) : null}
    </View>
    {selected ? (
      <MaterialCommunityIcons name="check-circle" size={20} color={INDIGO} />
    ) : (
      <View style={styles.modalOptionCheck} />
    )}
  </TouchableOpacity>
);

// ── ChapterPlayer ─────────────────────────────────────────────

interface ChapterPlayerProps {
  chapter: Chapter;
  enSpeed: number;
  ptSpeed: number;
  setEnSpeed: (r: number) => void;
  setPtSpeed: (r: number) => void;
  playbackMode: PlaybackMode;
  enVoice: EnVoice;
  initialVerseIndex: number;
  onVerseChange: (index: number) => void;
}

function ChapterPlayer({
  chapter, enSpeed, ptSpeed, setEnSpeed, setPtSpeed,
  playbackMode, enVoice, initialVerseIndex, onVerseChange,
}: ChapterPlayerProps) {
  const verses: Verse[] = chapter.verses;
  const player = usePlayerController(verses, {
    playbackMode,
    enVoice,
    initialIndex: initialVerseIndex,
    onVerseChange,
  });
  const { isAdFree, purchaseRemoveAds, isLoading: iapLoading } = useIap();
  const scrollRef = useRef<ScrollView | null>(null);
  const verseYPositions = useRef<number[]>([]);
  const enLabel = enVoice === 'en-GB' ? 'EN-GB' : 'EN-US';
  const progressPct = Math.round(((player.currentIndex + 1) / verses.length) * 100);

  useEffect(() => {
    if (!scrollRef.current) return;
    const y = verseYPositions.current[player.currentIndex];
    if (y !== undefined) {
      scrollRef.current.scrollTo({ y: Math.max(0, y - 16), animated: true });
    }
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
            enLabel={enLabel}
            onLayout={(y: number) => { verseYPositions.current[idx] = y; }}
          />
        ))}

        {!isAdFree && (
          <TouchableOpacity
            style={[styles.removeAdsCard, iapLoading && styles.removeAdsDisabled]}
            disabled={iapLoading}
            onPress={purchaseRemoveAds}
            activeOpacity={0.8}
          >
            <View style={styles.removeAdsIconWrap}>
              <MaterialCommunityIcons name="star-four-points" size={22} color="#f59e0b" />
            </View>
            <View style={styles.removeAdsTextWrap}>
              <Text style={styles.removeAdsTitle}>Remover anúncios</Text>
              <Text style={styles.removeAdsDesc}>
                {iapLoading ? 'Conectando à loja...' : 'Pagamento único · sem propagandas'}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#d97706" />
          </TouchableOpacity>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Controls panel ── */}
      <View style={styles.controls}>
        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>

        <View style={styles.controlsBody}>
          {/* Status row */}
          <View style={styles.statusRow}>
            <Text style={styles.controlsStatus}>
              {verses[player.currentIndex]?.verse ?? 1} / {verses.length}
            </Text>
            {player.isPlaying && (
              <View style={styles.langBadge}>
                <MaterialCommunityIcons
                  name={player.phase === 'pt' ? 'translate' : 'volume-high'}
                  size={11}
                  color={INDIGO}
                />
                <Text style={styles.langBadgeText}>
                  {player.phase === 'pt' ? 'PT-BR' : enLabel}
                </Text>
              </View>
            )}
            <View style={styles.modeBadge}>
              <Text style={styles.modeBadgeText}>{MODE_LABELS[playbackMode]}</Text>
            </View>
          </View>

          {/* Play controls */}
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
              onPress={() => player.jumpTo(Math.min(verses.length - 1, player.currentIndex + 1))}
            />
          </View>

          {/* Speed controls */}
          <View style={styles.speedControls}>
            <SpeedRow
              label="EN"
              speed={enSpeed}
              onDecrease={() => setEnSpeed(enSpeed - SPEED_STEP)}
              onIncrease={() => setEnSpeed(enSpeed + SPEED_STEP)}
            />
            {playbackMode !== 'en-only' && (
              <SpeedRow
                label="PT"
                speed={ptSpeed}
                onDecrease={() => setPtSpeed(ptSpeed - SPEED_STEP)}
                onIncrease={() => setPtSpeed(ptSpeed + SPEED_STEP)}
              />
            )}
          </View>
        </View>
      </View>
    </>
  );
}

// ── SpeedRow ──────────────────────────────────────────────────

interface SpeedRowProps {
  label: string;
  speed: number;
  onDecrease: () => void;
  onIncrease: () => void;
}

const SpeedRow = ({ label, speed, onDecrease, onIncrease }: SpeedRowProps) => (
  <View style={styles.speedRow}>
    <Text style={styles.speedLabel}>{label}</Text>
    <View style={styles.speedControl}>
      <TouchableOpacity
        onPress={onDecrease}
        style={[styles.speedBtn, speed <= SPEED_MIN && styles.speedBtnDisabled]}
        disabled={speed <= SPEED_MIN}
        activeOpacity={0.7}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <MaterialCommunityIcons name="minus" size={14} color={speed <= SPEED_MIN ? '#d1d5db' : INDIGO} />
      </TouchableOpacity>
      <Text style={styles.speedValue}>{speed.toFixed(2)}×</Text>
      <TouchableOpacity
        onPress={onIncrease}
        style={[styles.speedBtn, speed >= SPEED_MAX && styles.speedBtnDisabled]}
        disabled={speed >= SPEED_MAX}
        activeOpacity={0.7}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <MaterialCommunityIcons name="plus" size={14} color={speed >= SPEED_MAX ? '#d1d5db' : INDIGO} />
      </TouchableOpacity>
    </View>
  </View>
);

// ── VerseCard ─────────────────────────────────────────────────

interface VerseCardProps {
  verse: Verse;
  active: boolean;
  phase: Phase;
  onPress: () => void;
  enLabel: string;
  onLayout: (y: number) => void;
}

const VerseCard = ({ verse, active, phase, onPress, enLabel, onLayout }: VerseCardProps) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.85} onLayout={e => onLayout(e.nativeEvent.layout.y)}>
    <View style={[styles.verseCard, active && styles.verseCardActive]}>
      <View style={styles.verseHeader}>
        <View style={[styles.verseBadge, active && styles.verseBadgeActive]}>
          <Text style={[styles.verseBadgeText, active && styles.verseBadgeTextActive]}>
            {verse.verse}
          </Text>
        </View>
        {active && (
          <View style={styles.phasePill}>
            <MaterialCommunityIcons
              name={phase === 'pt' ? 'translate' : 'volume-high'}
              size={12}
              color={INDIGO}
            />
            <Text style={styles.phasePillText}>
              {phase === 'pt' ? 'PT-BR' : enLabel}
            </Text>
          </View>
        )}
      </View>

      <Text style={[styles.verseEn, active && phase === 'en' && styles.verseEnActive]}>
        {verse.en}
      </Text>

      <View style={styles.verseDivider} />

      <Text style={[styles.versePt, active && phase === 'pt' && styles.versePtActive]}>
        {verse.pt}
      </Text>
    </View>
  </TouchableOpacity>
);

// ── ControlButton ─────────────────────────────────────────────

interface ControlButtonProps {
  icon: string;
  onPress: () => void;
  main?: boolean;
}

const ControlButton = ({ icon, onPress, main }: ControlButtonProps) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.controlBtn, main && styles.controlBtnMain]}
    activeOpacity={0.8}
  >
    <MaterialCommunityIcons
      name={icon}
      size={main ? 34 : 26}
      color={main ? '#fff' : INDIGO}
    />
  </TouchableOpacity>
);

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECEEF8',
  },

  // Header
  header: {
    paddingTop: 28,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: INDIGO_HEADER,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 8,
    shadowColor: INDIGO_HEADER,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  headerCircle1: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  headerCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  headerTopSpacer: {
    width: 36,
  },
  headerTitles: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 1,
    letterSpacing: 0.3,
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookTabs: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 8,
  },
  bookTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  bookTabActive: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  bookTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
  },
  bookTabTextActive: {
    color: '#fff',
  },
  chapterScroll: {
    marginTop: 10,
  },
  chapterScrollContent: {
    paddingHorizontal: 2,
    gap: 6,
  },
  chapterChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  chapterChipActive: {
    backgroundColor: '#fff',
  },
  chapterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },
  chapterChipTextActive: {
    color: INDIGO_HEADER,
  },

  // Verse list
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 18,
    paddingBottom: 0,
  },

  // Verse card
  verseCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  verseCardActive: {
    backgroundColor: INDIGO_PALE,
    elevation: 3,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: INDIGO,
  },
  verseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  verseBadge: {
    minWidth: 28,
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
  },
  verseBadgeActive: {
    backgroundColor: INDIGO,
  },
  verseBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: INDIGO,
  },
  verseBadgeTextActive: {
    color: '#fff',
  },
  phasePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0E7FF',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  phasePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: INDIGO,
  },
  verseEn: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '600',
    lineHeight: 24,
  },
  verseEnActive: {
    color: INDIGO_DARK,
  },
  verseDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 10,
  },
  versePt: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  versePtActive: {
    color: '#4f46e5',
    fontWeight: '500',
  },

  // Remove ads
  removeAdsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    padding: 14,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  removeAdsDisabled: {
    opacity: 0.6,
  },
  removeAdsIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  removeAdsTextWrap: {
    flex: 1,
  },
  removeAdsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
  },
  removeAdsDesc: {
    fontSize: 12,
    color: '#b45309',
    marginTop: 2,
  },

  // Controls panel
  controls: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#E0E7FF',
  },
  progressFill: {
    height: 3,
    backgroundColor: INDIGO,
    borderRadius: 2,
  },
  controlsBody: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  controlsStatus: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  langBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: INDIGO_PALE,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  langBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: INDIGO,
  },
  modeBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  modeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6b7280',
  },
  controlsButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  controlBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: INDIGO_PALE,
  },
  controlBtnMain: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: INDIGO,
    elevation: 4,
    shadowColor: INDIGO,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  speedControls: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 10,
    gap: 4,
  },
  speedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speedLabel: {
    width: 28,
    fontSize: 11,
    fontWeight: '800',
    color: '#374151',
    letterSpacing: 0.5,
  },
  speedControl: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  speedBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedBtnDisabled: {
    opacity: 0.4,
  },
  speedValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: INDIGO,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  modalSection: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 10,
  },
  modalVoiceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
    gap: 10,
  },
  modalOptionSelected: {
    borderColor: INDIGO_LIGHT,
    backgroundColor: INDIGO_PALE,
  },
  modalOptionHalf: {
    flex: 1,
  },
  modalOptionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: INDIGO_PALE,
  },
  modalOptionIconSelected: {
    backgroundColor: INDIGO,
  },
  modalOptionContent: {
    flex: 1,
  },
  modalOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  modalOptionTextSelected: {
    color: INDIGO_DARK,
  },
  modalOptionSublabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  modalOptionSublabelSelected: {
    color: INDIGO_LIGHT,
  },
  modalOptionCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  modalClose: {
    marginTop: 24,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: INDIGO,
    alignItems: 'center',
    elevation: 2,
    shadowColor: INDIGO,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
});

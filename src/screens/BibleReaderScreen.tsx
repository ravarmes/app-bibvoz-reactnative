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

const VERSE_ROW_HEIGHT_ESTIMATE = 160;
const SPEED_STEP = 0.25;
const SPEED_MIN = 0.25;
const SPEED_MAX = 1.50;

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
    // Runs once on mount to seed AudioService with persisted rates
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
      <Surface style={styles.header} elevation={4}>
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
            <MaterialCommunityIcons name="cog-outline" size={22} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
        </View>

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
              onPress={() => handleChapterChange(ch)}
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
        playbackMode={playbackMode}
        enVoice={enVoice}
        initialVerseIndex={initialVerse}
        onVerseChange={handleVerseChange}
      />

      <Modal
        visible={settingsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSettingsVisible(false)} />
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Configurações</Text>

          <Text style={styles.modalSection}>Voz em Inglês</Text>
          <View style={styles.modalVoiceRow}>
            <ModeOption
              label="Americana"
              sublabel="EN-US"
              selected={enVoice === 'en-US'}
              onPress={() => setEnVoice('en-US')}
              style={styles.modalOptionHalf}
            />
            <ModeOption
              label="Britânica"
              sublabel="EN-GB"
              selected={enVoice === 'en-GB'}
              onPress={() => setEnVoice('en-GB')}
              style={styles.modalOptionHalf}
            />
          </View>

          <Text style={styles.modalSection}>Modo de Reprodução</Text>
          <ModeOption
            label="PT → EN"
            sublabel="Primeiro português, depois inglês (padrão)"
            selected={playbackMode === 'pt-en'}
            onPress={() => setPlaybackMode('pt-en')}
          />
          <ModeOption
            label="EN → PT"
            sublabel="Primeiro inglês, depois português"
            selected={playbackMode === 'en-pt'}
            onPress={() => setPlaybackMode('en-pt')}
          />
          <ModeOption
            label="Somente Inglês"
            sublabel="Ideal para alunos avançados"
            selected={playbackMode === 'en-only'}
            onPress={() => setPlaybackMode('en-only')}
          />

          <TouchableOpacity style={styles.modalClose} onPress={() => setSettingsVisible(false)}>
            <Text style={styles.modalCloseText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

interface ModeOptionProps {
  label: string;
  sublabel?: string;
  selected: boolean;
  onPress: () => void;
  style?: object;
}

const ModeOption = ({ label, sublabel, selected, onPress, style }: ModeOptionProps) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.modalOption, selected && styles.modalOptionSelected, style]}
    activeOpacity={0.7}
  >
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
      <MaterialCommunityIcons name="check-circle" size={18} color="#6366f1" />
    ) : null}
  </TouchableOpacity>
);

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
  const enLabel = enVoice === 'en-GB' ? 'EN-GB' : 'EN-US';

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
            enLabel={enLabel}
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

      <Surface style={styles.controls} elevation={5}>
        <Text style={styles.controlsStatus}>
          Versículo {verses[player.currentIndex]?.verse ?? 1} / {verses.length}
          {player.isPlaying && (player.phase === 'en' ? `  •  ${enLabel}` : '  •  PT-BR')}
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
          {playbackMode !== 'en-only' && (
            <SpeedRow
              label="PT"
              speed={ptSpeed}
              onDecrease={() => setPtSpeed(ptSpeed - SPEED_STEP)}
              onIncrease={() => setPtSpeed(ptSpeed + SPEED_STEP)}
            />
          )}
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
  enLabel: string;
}

const VerseCard = ({ verse, active, phase, onPress, enLabel }: VerseCardProps) => (
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
              {phase === 'pt' ? 'PT-BR' : enLabel}
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerTopSpacer: {
    width: 36,
  },
  headerTitles: {
    flex: 1,
    alignItems: 'center',
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
  settingsButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 36,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
  },
  modalSection: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 16,
  },
  modalVoiceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    marginBottom: 8,
  },
  modalOptionSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  modalOptionHalf: {
    flex: 1,
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
    color: '#4338ca',
  },
  modalOptionSublabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  modalOptionSublabelSelected: {
    color: '#818cf8',
  },
  modalClose: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

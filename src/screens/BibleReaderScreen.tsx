import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { BibleService, Chapter, Verse } from '../services/BibleService';
import { usePlayerController, Phase, PlaybackMode, EnVoice } from '../services/PlayerController';
import { AudioService } from '../services/AudioService';
import { useIap } from '../context/IapContext';
import { useSettings, REPEAT_OPTIONS, RepeatCount, Bookmark } from '../context/SettingsContext';

const SPEED_STEP = 0.25;
const SPEED_MIN = 0.25;
const SPEED_MAX = 1.50;

const BROWN_HEADER = '#2D1B0E';
const BROWN = '#8B5430';
const BROWN_DARK = '#5C3318';
const BROWN_LIGHT = '#BA8A62';
const BROWN_PALE = '#F0E4CC';
const PARCHMENT = '#F4EED8';
const PARCHMENT_CARD = '#FBF8F2';
const INK = '#1A0D07';

const MODE_LABELS: Record<PlaybackMode, string> = {
  'pt-en': 'PT → EN',
  'en-pt': 'EN → PT',
  'en-only': 'Só EN',
};

export default function BibleReaderScreen() {
  const { isAdFree, purchaseRemoveAds, isLoading: iapLoading } = useIap();
  const {
    enVoice, setEnVoice,
    playbackMode, setPlaybackMode,
    lastPosition, saveLastPosition,
    enSpeed, setEnSpeed: saveEnSpeed,
    ptSpeed, setPtSpeed: savePtSpeed,
    enVoiceId, setEnVoiceId,
    repeatCount, setRepeatCount,
    bookmarks, toggleBookmark, isBookmarked,
  } = useSettings();

  const books = useMemo(
    () => {
      const all = BibleService.listBooks();
      return isAdFree ? all : all.filter(b => b.id === 'john');
    },
    [isAdFree],
  );

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
  const [bookmarksVisible, setBookmarksVisible] = useState(false);

  // If the available books list shrinks (e.g. IAP state changes), clamp the index.
  useEffect(() => {
    if (selectedBookIdx >= books.length) {
      setSelectedBookIdx(0);
      setSelectedChapter(books[0].chapters[0]);
      setInitialVerse(0);
    }
  }, [books, selectedBookIdx]);

  const currentBook = books[Math.min(selectedBookIdx, books.length - 1)];
  const chapter = useMemo(
    () => BibleService.getChapter(currentBook.id, selectedChapter)!,
    [currentBook.id, selectedChapter],
  );

  useEffect(() => {
    AudioService.setRate('en-US', enSpeed);
    AudioService.setRate('pt-BR', ptSpeed);
    AudioService.setVoice(enVoiceId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    AudioService.setVoice(enVoiceId);
  }, [enVoiceId]);

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

  const handleJumpToBookmark = useCallback((bm: Bookmark) => {
    const bookIdx = books.findIndex(b => b.id === bm.bookId);
    if (bookIdx < 0) return;
    const chapterData = BibleService.getChapter(bm.bookId, bm.chapter);
    if (!chapterData) return;
    const verseIdx = chapterData.verses.findIndex(v => v.verse === bm.verseNumber);
    setSelectedBookIdx(bookIdx);
    setSelectedChapter(bm.chapter);
    setInitialVerse(verseIdx >= 0 ? verseIdx : 0);
    setBookmarksVisible(false);
  }, [books]);

  const availableBookmarks = useMemo(
    () => bookmarks
      .filter(b => books.some(book => book.id === b.bookId))
      .sort((a, b) => b.addedAt - a.addedAt),
    [bookmarks, books],
  );

  return (
    <View style={styles.container}>
      {/* ── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        {/* Decorative circles for depth */}
        <View style={styles.headerCircle1} pointerEvents="none" />
        <View style={styles.headerCircle2} pointerEvents="none" />

        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setBookmarksVisible(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons
              name={availableBookmarks.length > 0 ? 'bookmark-multiple' : 'bookmark-multiple-outline'}
              size={20}
              color="#fff"
            />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>BibVoz</Text>
            <Text style={styles.headerSubtitle}>Inglês pela Bíblia</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setSettingsVisible(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
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
        repeatCount={repeatCount}
        initialVerseIndex={initialVerse}
        onVerseChange={handleVerseChange}
        bookId={currentBook.id}
        isBookmarked={isBookmarked}
        toggleBookmark={toggleBookmark}
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

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.modalSection}>Sotaque em Inglês</Text>
            <View style={styles.modalVoiceRow}>
              <ModeOption
                icon="flag"
                label="Americana"
                sublabel="EN-US"
                selected={enVoice === 'en-US'}
                onPress={() => { setEnVoice('en-US'); setEnVoiceId(null); }}
                style={styles.modalOptionHalf}
              />
              <ModeOption
                icon="flag-outline"
                label="Britânica"
                sublabel="EN-GB"
                selected={enVoice === 'en-GB'}
                onPress={() => { setEnVoice('en-GB'); setEnVoiceId(null); }}
                style={styles.modalOptionHalf}
              />
            </View>

            <Text style={styles.modalSection}>Voz de Leitura</Text>
            <VoicePickerSection
              lang={enVoice}
              selectedVoiceId={enVoiceId}
              onSelect={setEnVoiceId}
            />

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

            <Text style={styles.modalSection}>Repetições por versículo</Text>
            <View style={styles.repeatRow}>
              {REPEAT_OPTIONS.map(n => (
                <TouchableOpacity
                  key={n}
                  style={[styles.repeatChip, repeatCount === n && styles.repeatChipActive]}
                  onPress={() => setRepeatCount(n)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name="repeat"
                    size={13}
                    color={repeatCount === n ? '#fff' : BROWN}
                    style={{ marginRight: 3 }}
                  />
                  <Text style={[styles.repeatChipText, repeatCount === n && styles.repeatChipTextActive]}>
                    {n}×
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {!isAdFree && (
              <>
                <Text style={styles.modalSection}>Premium</Text>
                <TouchableOpacity
                  style={[styles.premiumCard, iapLoading && styles.removeAdsDisabled]}
                  onPress={purchaseRemoveAds}
                  disabled={iapLoading}
                  activeOpacity={0.85}
                >
                  <View style={styles.removeAdsIconWrap}>
                    <MaterialCommunityIcons name="star-four-points" size={22} color="#f59e0b" />
                  </View>
                  <View style={styles.removeAdsTextWrap}>
                    <Text style={styles.removeAdsTitle}>Remover anúncios</Text>
                    <Text style={styles.removeAdsDesc}>
                      {iapLoading ? 'Conectando...' : 'Pagamento único · sem propagandas'}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#d97706" />
                </TouchableOpacity>
              </>
            )}
          </ScrollView>

          <View style={styles.modalCloseWrapper}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setSettingsVisible(false)} activeOpacity={0.85}>
              <Text style={styles.modalCloseText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Bookmarks modal ──────────────────────────────── */}
      <Modal
        visible={bookmarksVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBookmarksVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setBookmarksVisible(false)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Favoritos</Text>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {availableBookmarks.length === 0 ? (
              <View style={styles.bookmarksEmpty}>
                <MaterialCommunityIcons name="bookmark-outline" size={40} color={BROWN_LIGHT} />
                <Text style={styles.bookmarksEmptyTitle}>Nenhum favorito ainda</Text>
                <Text style={styles.bookmarksEmptyDesc}>
                  Toque na estrela ao lado de um versículo para salvá-lo aqui.
                </Text>
              </View>
            ) : (
              availableBookmarks.map(bm => {
                const ch = BibleService.getChapter(bm.bookId, bm.chapter);
                const verse = ch?.verses.find(v => v.verse === bm.verseNumber);
                const bookMeta = books.find(b => b.id === bm.bookId);
                if (!ch || !verse || !bookMeta) return null;
                return (
                  <View key={`${bm.bookId}-${bm.chapter}-${bm.verseNumber}`} style={styles.bookmarkRow}>
                    <TouchableOpacity
                      style={styles.bookmarkRowMain}
                      onPress={() => handleJumpToBookmark(bm)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.bookmarkRef}>
                        <Text style={styles.bookmarkRefText}>
                          {bookMeta.namePt} {bm.chapter}:{bm.verseNumber}
                        </Text>
                      </View>
                      <Text style={styles.bookmarkPreview} numberOfLines={2}>
                        {verse.en}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => toggleBookmark(bm.bookId, bm.chapter, bm.verseNumber)}
                      style={styles.bookmarkRemoveBtn}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      activeOpacity={0.6}
                    >
                      <MaterialCommunityIcons name="bookmark-remove" size={22} color={BROWN} />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </ScrollView>

          <View style={styles.modalCloseWrapper}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setBookmarksVisible(false)} activeOpacity={0.85}>
              <Text style={styles.modalCloseText}>Fechar</Text>
            </TouchableOpacity>
          </View>
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
      <MaterialCommunityIcons name={icon} size={16} color={selected ? '#fff' : BROWN} />
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
      <MaterialCommunityIcons name="check-circle" size={20} color={BROWN} />
    ) : (
      <View style={styles.modalOptionCheck} />
    )}
  </TouchableOpacity>
);

// ── VoicePickerSection ────────────────────────────────────────
// Shows only two fixed voices: Female (system default) and Male (voice index 8).

interface VoicePickerSectionProps {
  lang: EnVoice;
  selectedVoiceId: string | null;
  onSelect: (id: string | null) => void;
}

const VoicePickerSection = ({ lang, selectedVoiceId, onSelect }: VoicePickerSectionProps) => {
  const [maleVoiceId, setMaleVoiceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    AudioService.getVoices(lang)
      .then(voices => {
        // Voice 8 = index 7 (voices are sorted by quality desc)
        setMaleVoiceId(voices[7]?.id ?? null);
      })
      .finally(() => setLoading(false));
  }, [lang]);

  if (loading) {
    return <ActivityIndicator size="small" color={BROWN} style={{ marginVertical: 12 }} />;
  }

  return (
    <>
      <VoiceOptionRow
        label="Feminina"
        sublabel="Voz padrão do sistema"
        voiceId={null}
        selected={selectedVoiceId === null}
        onSelect={onSelect}
        lang={lang}
      />
      {maleVoiceId !== null && (
        <VoiceOptionRow
          label="Masculina"
          sublabel="Voz alternativa"
          voiceId={maleVoiceId}
          selected={selectedVoiceId === maleVoiceId}
          onSelect={onSelect}
          lang={lang}
        />
      )}
    </>
  );
};

// ── VoiceOptionRow ────────────────────────────────────────────

interface VoiceOptionRowProps {
  label: string;
  sublabel?: string;
  voiceId: string | null;
  selected: boolean;
  onSelect: (id: string | null) => void;
  lang: EnVoice;
}

const VoiceOptionRow = ({ label, sublabel, voiceId, selected, onSelect, lang }: VoiceOptionRowProps) => (
  <View style={styles.voiceOptionRow}>
    <TouchableOpacity
      onPress={() => onSelect(voiceId)}
      style={[styles.modalOption, selected && styles.modalOptionSelected, styles.voiceOptionBtn]}
      activeOpacity={0.7}
    >
      <View style={[styles.modalOptionIcon, selected && styles.modalOptionIconSelected]}>
        <MaterialCommunityIcons name="account-voice" size={16} color={selected ? '#fff' : BROWN} />
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
        <MaterialCommunityIcons name="check-circle" size={20} color={BROWN} />
      ) : (
        <View style={styles.modalOptionCheck} />
      )}
    </TouchableOpacity>
    <TouchableOpacity
      onPress={() => AudioService.previewVoice(voiceId, lang)}
      style={styles.voiceTestBtn}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <MaterialCommunityIcons name="play-circle-outline" size={26} color={BROWN_LIGHT} />
    </TouchableOpacity>
  </View>
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
  repeatCount: RepeatCount;
  initialVerseIndex: number;
  onVerseChange: (index: number) => void;
  bookId: string;
  isBookmarked: (bookId: string, chapter: number, verseNumber: number) => boolean;
  toggleBookmark: (bookId: string, chapter: number, verseNumber: number) => void;
}

function ChapterPlayer({
  chapter, enSpeed, ptSpeed, setEnSpeed, setPtSpeed,
  playbackMode, enVoice, repeatCount, initialVerseIndex, onVerseChange,
  bookId, isBookmarked, toggleBookmark,
}: ChapterPlayerProps) {
  const verses: Verse[] = chapter.verses;
  const player = usePlayerController(verses, {
    playbackMode,
    enVoice,
    repeatCount,
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
            bookmarked={isBookmarked(bookId, chapter.chapter, v.verse)}
            onToggleBookmark={() => toggleBookmark(bookId, chapter.chapter, v.verse)}
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
                  color={BROWN}
                />
                <Text style={styles.langBadgeText}>
                  {player.phase === 'pt' ? 'PT-BR' : enLabel}
                </Text>
              </View>
            )}
            <View style={styles.modeBadge}>
              <Text style={styles.modeBadgeText}>{MODE_LABELS[playbackMode]}</Text>
            </View>
            {repeatCount > 1 && (
              <View style={styles.repeatBadge}>
                <MaterialCommunityIcons name="repeat" size={11} color="#9ca3af" />
                <Text style={styles.repeatBadgeText}>{repeatCount}×</Text>
              </View>
            )}
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
        hitSlop={{ top: 14, bottom: 14, left: 12, right: 12 }}
      >
        <MaterialCommunityIcons name="minus" size={14} color={speed <= SPEED_MIN ? '#C9B594' : BROWN} />
      </TouchableOpacity>
      <Text style={styles.speedValue}>{speed.toFixed(2)}×</Text>
      <TouchableOpacity
        onPress={onIncrease}
        style={[styles.speedBtn, speed >= SPEED_MAX && styles.speedBtnDisabled]}
        disabled={speed >= SPEED_MAX}
        activeOpacity={0.7}
        hitSlop={{ top: 14, bottom: 14, left: 12, right: 12 }}
      >
        <MaterialCommunityIcons name="plus" size={14} color={speed >= SPEED_MAX ? '#C9B594' : BROWN} />
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
  bookmarked: boolean;
  onToggleBookmark: () => void;
}

const VerseCard = ({ verse, active, phase, onPress, enLabel, onLayout, bookmarked, onToggleBookmark }: VerseCardProps) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.85} onLayout={e => onLayout(e.nativeEvent.layout.y)}>
    <View style={[styles.verseCard, active && styles.verseCardActive]}>
      <View style={styles.verseHeader}>
        <View style={[styles.verseBadge, active && styles.verseBadgeActive]}>
          <Text style={[styles.verseBadgeText, active && styles.verseBadgeTextActive]}>
            {verse.verse}
          </Text>
        </View>
        <View style={{ flex: 1 }} />
        {active && (
          <View style={styles.phasePill}>
            <MaterialCommunityIcons
              name={phase === 'pt' ? 'translate' : 'volume-high'}
              size={12}
              color={BROWN}
            />
            <Text style={styles.phasePillText}>
              {phase === 'pt' ? 'PT-BR' : enLabel}
            </Text>
          </View>
        )}
        <TouchableOpacity
          onPress={onToggleBookmark}
          style={styles.bookmarkBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.6}
        >
          <MaterialCommunityIcons
            name={bookmarked ? 'star' : 'star-outline'}
            size={20}
            color={bookmarked ? '#D4A04A' : BROWN_LIGHT}
          />
        </TouchableOpacity>
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
      color={main ? '#fff' : BROWN}
    />
  </TouchableOpacity>
);

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PARCHMENT,
  },

  // Header
  header: {
    paddingTop: 28,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: BROWN_HEADER,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 8,
    shadowColor: BROWN_HEADER,
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
    color: BROWN_HEADER,
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
    backgroundColor: PARCHMENT_CARD,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    elevation: 1,
    shadowColor: BROWN_HEADER,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  verseCardActive: {
    backgroundColor: BROWN_PALE,
    elevation: 3,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: BROWN,
  },
  verseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  bookmarkBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verseBadge: {
    minWidth: 28,
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BROWN_PALE,
  },
  verseBadgeActive: {
    backgroundColor: BROWN,
  },
  verseBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: BROWN,
  },
  verseBadgeTextActive: {
    color: '#fff',
  },
  phasePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BROWN_PALE,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  phasePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: BROWN,
  },
  verseEn: {
    fontSize: 16,
    color: INK,
    fontWeight: '600',
    lineHeight: 24,
  },
  verseEnActive: {
    color: BROWN_DARK,
  },
  verseDivider: {
    height: 1,
    backgroundColor: '#E2D5BC',
    marginVertical: 10,
  },
  versePt: {
    fontSize: 13,
    color: '#7A5C3E',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  versePtActive: {
    color: BROWN_DARK,
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
    backgroundColor: PARCHMENT_CARD,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 12,
    shadowColor: BROWN_HEADER,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#E2D5BC',
  },
  progressFill: {
    height: 3,
    backgroundColor: BROWN,
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
    color: '#7A5C3E',
    fontWeight: '500',
  },
  langBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: BROWN_PALE,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  langBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: BROWN,
  },
  modeBadge: {
    backgroundColor: BROWN_PALE,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  modeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7A5C3E',
  },
  repeatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  repeatBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9ca3af',
  },
  repeatRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  repeatChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  repeatChipActive: {
    backgroundColor: BROWN,
    borderColor: BROWN,
  },
  repeatChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: BROWN,
  },
  repeatChipTextActive: {
    color: '#fff',
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
    backgroundColor: BROWN_PALE,
  },
  controlBtnMain: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: BROWN,
    elevation: 4,
    shadowColor: BROWN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  speedControls: {
    borderTopWidth: 1,
    borderTopColor: '#E2D5BC',
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
    color: '#3D2A1A',
    letterSpacing: 0.5,
  },
  speedControl: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BROWN_PALE,
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
    color: BROWN,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: PARCHMENT_CARD,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 16,
    maxHeight: '88%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D4C4A0',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: INK,
    marginBottom: 4,
    paddingHorizontal: 24,
  },
  modalScroll: {
    flexGrow: 0,
  },
  modalScrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  modalSection: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9B7B5E',
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
    borderColor: '#D4C4A0',
    backgroundColor: PARCHMENT,
    marginBottom: 8,
    gap: 10,
  },
  modalOptionSelected: {
    borderColor: BROWN_LIGHT,
    backgroundColor: BROWN_PALE,
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
    backgroundColor: BROWN_PALE,
  },
  modalOptionIconSelected: {
    backgroundColor: BROWN,
  },
  modalOptionContent: {
    flex: 1,
  },
  modalOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3D2A1A',
  },
  modalOptionTextSelected: {
    color: BROWN_DARK,
  },
  modalOptionSublabel: {
    fontSize: 11,
    color: '#9B7B5E',
    marginTop: 2,
  },
  modalOptionSublabelSelected: {
    color: BROWN_LIGHT,
  },
  modalOptionCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#C9B594',
  },
  // Voice picker
  voiceOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  voiceOptionBtn: {
    flex: 1,
    marginBottom: 0,
  },
  voiceTestBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BROWN_PALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceEmptyText: {
    fontSize: 12,
    color: '#9B7B5E',
    marginBottom: 8,
  },
  // Premium card
  premiumCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 8,
  },
  // Modal footer
  modalCloseWrapper: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 36,
  },
  modalClose: {
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: BROWN,
    alignItems: 'center',
    elevation: 2,
    shadowColor: BROWN,
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

  // Bookmarks modal
  bookmarksEmpty: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  bookmarksEmptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BROWN_DARK,
    marginTop: 12,
  },
  bookmarksEmptyDesc: {
    fontSize: 12,
    color: '#9B7B5E',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
  bookmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PARCHMENT,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#D4C4A0',
    marginBottom: 8,
    paddingRight: 8,
  },
  bookmarkRowMain: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  bookmarkRef: {
    marginBottom: 4,
  },
  bookmarkRefText: {
    fontSize: 13,
    fontWeight: '800',
    color: BROWN_DARK,
    letterSpacing: 0.3,
  },
  bookmarkPreview: {
    fontSize: 12,
    color: '#7A5C3E',
    lineHeight: 18,
  },
  bookmarkRemoveBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

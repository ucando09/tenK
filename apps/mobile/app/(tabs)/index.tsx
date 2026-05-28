/**
 * Timer tab — composes the swipeable skill carousel, the active-session view,
 * and the post-session evidence modal.
 *
 * Sub-components live in `components/Timer/`; data loading lives in
 * `hooks/useActiveSkills`.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, Dimensions, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useTimerStore } from '../../store/timerStore';
import { useActiveSkills } from '../../hooks/useActiveSkills';
import { SkillTimerCard } from '../../components/Timer/SkillTimerCard';
import { PomodoroActiveView } from '../../components/Timer/PomodoroActiveView';
import { EvidenceModalMobile } from '../../components/Timer/EvidenceModalMobile';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface EvidenceState {
  sessionId:       string;
  durationSeconds: number;
}

export default function TimerTab() {
  const { skills, loading } = useActiveSkills();
  const [currentIndex,   setCurrentIndex]   = useState(0);
  const [evidenceModal,  setEvidenceModal]  = useState<EvidenceState | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const {
    timer, activeSkill, startTimer, pauseTimer, resumeTimer,
    tick, nextPhase, stopTimer, setActiveSkill,
  } = useTimerStore();

  /* Seed activeSkill once skills have loaded */
  useEffect(() => {
    if (skills.length > 0 && !activeSkill) setActiveSkill(skills[0]);
  }, [skills, activeSkill, setActiveSkill]);

  /* Timer tick */
  useEffect(() => {
    if (!timer.isRunning || timer.isPaused) return;
    const id = setInterval(() => tick(), 1000);
    return () => clearInterval(id);
  }, [timer.isRunning, timer.isPaused, tick]);

  /* End session — defined BEFORE handlePhaseTransition so that
   * useCallback's deps array doesn't hit a TDZ on first render. */
  const handleEndSession = useCallback(async () => {
    if (!timer.sessionId) {
      stopTimer();
      return;
    }
    const sessionId = timer.sessionId;
    const elapsed   = timer.startedAt
      ? Math.floor((Date.now() - timer.startedAt) / 1000)
      : 0;

    await supabase
      .from('sessions')
      .update({ ended_at: new Date().toISOString(), duration_seconds: elapsed })
      .eq('id', sessionId);

    stopTimer();
    setEvidenceModal({ sessionId, durationSeconds: elapsed });
  }, [timer.sessionId, timer.startedAt, stopTimer]);

  /* Phase transitions */
  const handlePhaseTransition = useCallback(() => {
    if (!activeSkill) return;
    if (timer.phase === 'work') {
      if (timer.currentPomodoroSession >= activeSkill.pomodoro_sessions) {
        handleEndSession();
      } else {
        nextPhase();
      }
    } else {
      nextPhase();
    }
  }, [activeSkill, timer.phase, timer.currentPomodoroSession, handleEndSession, nextPhase]);

  useEffect(() => {
    if (timer.secondsRemaining !== 0 || !timer.isRunning) return;
    handlePhaseTransition();
  }, [timer.secondsRemaining, timer.isRunning, handlePhaseTransition]);

  /* Start a new session for the currently visible card */
  const handleStart = async () => {
    const skill = skills[currentIndex];
    if (!skill) return;

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        skill_id:   skill.id,
        user_id:    user.id,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !session) {
      Alert.alert('Error', 'Failed to start session');
      return;
    }

    startTimer(skill, session.id);
  };

  /* Carousel scroll tracking */
  const handleScroll = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentIndex(idx);
    if (skills[idx]) setActiveSkill(skills[idx]);
  };

  /* ── Render ── */
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-bg-deep items-center justify-center">
        <ActivityIndicator color="#7c6cf0" />
      </SafeAreaView>
    );
  }

  if (skills.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-bg-deep items-center justify-center px-8">
        <Text className="text-5xl mb-4">🎯</Text>
        <Text className="text-white text-xl font-bold mb-2">No Active Skills</Text>
        <Text className="text-text-muted text-center text-sm">
          Go to the Skills tab to create your first skill.
        </Text>
      </SafeAreaView>
    );
  }

  const isTimerActive = timer.isRunning || timer.isPaused;

  return (
    <SafeAreaView className="flex-1 bg-bg-deep">
      {isTimerActive ? (
        <PomodoroActiveView
          skill={activeSkill || skills[currentIndex]}
          onEnd={handleEndSession}
          onPause={pauseTimer}
          onResume={resumeTimer}
          onSkip={nextPhase}
        />
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={skills}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            renderItem={({ item }) => (
              <SkillTimerCard skill={item} onStart={handleStart} />
            )}
          />

          {/* Navigation dots */}
          <View className="flex-row justify-center pb-4 gap-1.5">
            {skills.map((_, i) => (
              <View
                key={i}
                className="rounded-full"
                style={{
                  width:           i === currentIndex ? 16 : 6,
                  height:          6,
                  backgroundColor: i === currentIndex ? '#7c6cf0' : '#1e1e3a',
                }}
              />
            ))}
          </View>
        </>
      )}

      {evidenceModal && activeSkill && (
        <EvidenceModalMobile
          sessionId={evidenceModal.sessionId}
          durationSeconds={evidenceModal.durationSeconds}
          skill={activeSkill}
          onClose={() => setEvidenceModal(null)}
        />
      )}
    </SafeAreaView>
  );
}

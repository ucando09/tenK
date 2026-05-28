/**
 * CreateSkillModal — bottom-sheet wizard for adding a new skill.
 * Step 1 names it, Step 2 picks domain + color (with inline domain creation).
 */
import { useState } from 'react';
import {
  View, Modal, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import { POMODORO_DEFAULTS } from '../../../lib/constants';
import type { Domain } from '@tenk/shared';
import { SKILL_COLORS } from '../types';
import { Step1Name } from './Step1Name';
import { Step2Domain } from './Step2Domain';

interface CreateSkillModalProps {
  availableDomains: Domain[];
  initialDomain:    Domain | null;
  onClose:          () => void;
  onCreated:        () => void;
}

export function CreateSkillModal({
  availableDomains, initialDomain, onClose, onCreated,
}: CreateSkillModalProps) {
  const [step,       setStep]       = useState<1 | 2>(1);
  const [name,       setName]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [localDomains,     setLocalDomains]     = useState<Domain[]>(availableDomains);
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(
    initialDomain?.id ?? availableDomains[0]?.id ?? null,
  );
  const [color, setColor] = useState(
    initialDomain?.color ?? availableDomains[0]?.color ?? SKILL_COLORS[0],
  );

  const selectDomain = (d: Domain) => {
    setSelectedDomainId(d.id);
    setColor(d.color);
  };

  const addDomain = (d: Domain) => {
    setLocalDomains((prev) => [...prev, d]);
    selectDomain(d);
  };

  const handleCreate = async () => {
    if (!name.trim() || !selectedDomainId) return;
    setSubmitting(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('skills').insert({
        domain_id:              selectedDomainId,
        user_id:                user.id,
        name:                   name.trim(),
        color,
        status:                 'active',
        goal_hours:             10_000,
        timer_mode:             'pomodoro',
        pomodoro_work_minutes:  POMODORO_DEFAULTS.workMinutes,
        pomodoro_break_minutes: POMODORO_DEFAULTS.breakMinutes,
        pomodoro_sessions:      POMODORO_DEFAULTS.sessions,
      });
      if (error) throw new Error(error.message);
      onCreated();
      onClose();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create skill');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}
      >
        <View
          className="bg-bg-card rounded-t-2xl border-t border-border"
          style={{ maxHeight: '85%' }}
        >
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24 }}>
            {step === 1 && (
              <Step1Name
                name={name}
                onName={setName}
                onNext={() => setStep(2)}
                onClose={onClose}
              />
            )}
            {step === 2 && (
              <Step2Domain
                name={name}
                domains={localDomains}
                selectedDomainId={selectedDomainId}
                color={color}
                submitting={submitting}
                onBack={() => setStep(1)}
                onSelectDomain={selectDomain}
                onAddDomain={addDomain}
                onSelectColor={setColor}
                onSubmit={handleCreate}
                onClose={onClose}
              />
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

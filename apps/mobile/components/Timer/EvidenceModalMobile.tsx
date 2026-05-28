/**
 * EvidenceModalMobile — bottom-sheet that pops up after a session ends.
 * User can leave session notes, then submit (marks session verified) or skip.
 */
import { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, Modal,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import type { SkillWithDomain } from './SkillTimerCard';

interface EvidenceModalMobileProps {
  sessionId:       string;
  durationSeconds: number;
  skill:           SkillWithDomain;
  onClose:         () => void;
}

function formatDuration(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function EvidenceModalMobile({
  sessionId, durationSeconds, skill, onClose,
}: EvidenceModalMobileProps) {
  const [notes,      setNotes]      = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      if (notes.trim()) {
        await supabase.from('memos').insert({
          skill_id:   skill.id,
          session_id: sessionId,
          user_id:    user.id,
          content:    notes.trim(),
          date:       today,
        });
      }

      await supabase.from('sessions').update({ verified: true }).eq('id', sessionId);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    await supabase.from('sessions').update({ verified: false }).eq('id', sessionId);
    onClose();
  };

  return (
    <Modal visible animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <View className="bg-bg-card rounded-t-2xl p-6 border-t border-border">
            <Text className="text-white font-bold text-lg mb-1">Session Complete!</Text>
            <Text className="text-text-muted text-sm mb-5">
              {skill.name} · {formatDuration(durationSeconds)}
            </Text>

            <Text className="text-text-secondary text-sm font-medium mb-1.5">Session Notes</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="What did you work on?"
              placeholderTextColor="#555555"
              multiline
              numberOfLines={4}
              className="bg-bg-elevated border border-border rounded-xl px-3 py-2 text-sm mb-4"
              style={{ color: '#fff', minHeight: 80, textAlignVertical: 'top' }}
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleSkip}
                className="flex-1 py-3 rounded-xl bg-bg-elevated border border-border items-center"
              >
                <Text className="text-text-secondary font-medium">Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl bg-accent items-center flex-row justify-center gap-2"
              >
                {submitting && <ActivityIndicator color="white" size="small" />}
                <Text className="text-white font-semibold">Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

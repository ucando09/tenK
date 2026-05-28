import { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert,
} from 'react-native';
import { X } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

const UNIQUE_VIOLATION = '23505';

interface CreateJoinModalProps {
  mode:      'create' | 'join';
  onClose:   () => void;
  onSuccess: () => void;
}

export function CreateJoinModal({ mode, onClose, onSuccess }: CreateJoinModalProps) {
  const [name,        setName]        = useState('');
  const [description, setDescription] = useState('');
  const [inviteCode,  setInviteCode]  = useState('');
  const [loading,     setLoading]     = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');

      if (mode === 'create') {
        if (!name.trim()) throw new Error('Enter a group name');
        const { data: group, error } = await supabase
          .from('groups')
          .insert({
            name:        name.trim(),
            description: description.trim(),
            created_by:  user.id,
          })
          .select()
          .single();
        if (error) throw error;
        await supabase
          .from('group_members')
          .insert({ group_id: group.id, user_id: user.id, role: 'admin' });
      } else {
        if (!inviteCode.trim()) throw new Error('Enter an invite code');
        const { data: group, error } = await supabase
          .from('groups')
          .select('*')
          .eq('invite_code', inviteCode.trim())
          .single();
        if (error) throw new Error('Invalid invite code');
        const { error: joinErr } = await supabase
          .from('group_members')
          .insert({ group_id: group.id, user_id: user.id, role: 'member' });
        if (joinErr && joinErr.code !== UNIQUE_VIOLATION) throw joinErr;
      }

      onSuccess();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible animationType="slide" transparent>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <View className="bg-bg-card rounded-t-2xl p-6 border-t border-border">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white font-bold text-lg">
              {mode === 'create' ? 'Create Group' : 'Join Group'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color="#555555" />
            </TouchableOpacity>
          </View>

          {mode === 'create' ? (
            <>
              <Text className="text-text-secondary text-sm mb-1.5">Group Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Music Crew"
                placeholderTextColor="#555555"
                autoFocus
                className="bg-bg-elevated border border-border rounded-xl px-4 py-3 text-sm mb-3"
                style={{ color: '#fff' }}
              />
              <Text className="text-text-secondary text-sm mb-1.5">Description (optional)</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="What's this group about?"
                placeholderTextColor="#555555"
                multiline
                numberOfLines={2}
                className="bg-bg-elevated border border-border rounded-xl px-4 py-3 text-sm mb-4"
                style={{ color: '#fff' }}
              />
            </>
          ) : (
            <>
              <Text className="text-text-secondary text-sm mb-1.5">Invite Code</Text>
              <TextInput
                value={inviteCode}
                onChangeText={setInviteCode}
                placeholder="Enter the invite code"
                placeholderTextColor="#555555"
                autoFocus
                autoCapitalize="none"
                className="bg-bg-elevated border border-border rounded-xl px-4 py-3 text-sm mb-4 font-mono"
                style={{ color: '#fff' }}
              />
            </>
          )}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className="bg-accent py-3 rounded-xl items-center flex-row justify-center gap-2"
          >
            {loading && <ActivityIndicator color="white" size="small" />}
            <Text className="text-white font-semibold">
              {mode === 'create' ? 'Create' : 'Join'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

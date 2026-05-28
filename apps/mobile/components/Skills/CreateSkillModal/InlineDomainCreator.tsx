import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import type { Domain } from '@tenk/shared';
import { SKILL_COLORS } from '../types';

interface InlineDomainCreatorProps {
  canCancel: boolean;
  onCreated: (domain: Domain) => void;
  onCancel:  () => void;
}

/** Inline form for creating a new domain inside the skill wizard. */
export function InlineDomainCreator({ canCancel, onCreated, onCancel }: InlineDomainCreatorProps) {
  const [name,     setName]     = useState('');
  const [color,    setColor]    = useState(SKILL_COLORS[0]);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('domains')
        .insert({ user_id: user.id, name: name.trim(), color })
        .select()
        .single();
      if (error) throw new Error(error.message);
      onCreated(data as Domain);
      setName('');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create domain');
    } finally {
      setCreating(false);
    }
  };

  return (
    <View className="bg-bg-elevated rounded-xl p-4 border border-border mb-3">
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Domain name (e.g. Music, Coding)"
        placeholderTextColor="#555555"
        autoFocus
        className="bg-bg-card border border-border rounded-xl px-3 py-2.5 text-sm mb-3"
        style={{ color: '#fff' }}
      />
      <View className="flex-row items-center justify-between">
        <View className="flex-row gap-2">
          {SKILL_COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setColor(c)}
              style={{
                width:           26,
                height:          26,
                borderRadius:    13,
                backgroundColor: c,
                borderWidth:     2,
                borderColor:     color === c ? 'white' : 'transparent',
              }}
            />
          ))}
        </View>
        <View className="flex-row gap-2 items-center">
          {canCancel && (
            <TouchableOpacity onPress={onCancel}>
              <Text className="text-text-muted text-xs">Cancel</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleCreate}
            disabled={creating || !name.trim()}
            className="bg-accent px-3 py-1.5 rounded-lg flex-row items-center gap-1.5"
            style={{ opacity: name.trim() ? 1 : 0.5 }}
          >
            {creating && <ActivityIndicator size="small" color="white" />}
            <Text className="text-white text-xs font-semibold">Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

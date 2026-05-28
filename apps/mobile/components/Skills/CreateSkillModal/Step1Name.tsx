import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';

interface Step1NameProps {
  name:    string;
  onName:  (next: string) => void;
  onNext:  () => void;
  onClose: () => void;
}

/** Wizard step 1 — just name the skill. */
export function Step1Name({ name, onName, onNext, onClose }: Step1NameProps) {
  return (
    <>
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-text-muted text-xs uppercase tracking-widest">
          Step 1 of 2
        </Text>
        <TouchableOpacity onPress={onClose}>
          <X size={20} color="#555555" />
        </TouchableOpacity>
      </View>

      <Text className="text-white text-2xl font-bold mb-1">What will you master?</Text>
      <Text className="text-text-muted text-sm mb-6">
        Name the skill you want to track.
      </Text>

      <TextInput
        value={name}
        onChangeText={onName}
        placeholder="e.g. Guitar, TypeScript, Oil Painting"
        placeholderTextColor="#555555"
        autoFocus
        returnKeyType="next"
        onSubmitEditing={() => { if (name.trim()) onNext(); }}
        className="bg-bg-elevated border border-border rounded-xl px-4 py-3.5 text-base mb-6"
        style={{ color: '#fff' }}
      />

      <TouchableOpacity
        onPress={onNext}
        disabled={!name.trim()}
        className="bg-accent py-3.5 rounded-xl items-center"
        style={{ opacity: name.trim() ? 1 : 0.4 }}
      >
        <Text className="text-white font-semibold text-base">Next →</Text>
      </TouchableOpacity>
    </>
  );
}

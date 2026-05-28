import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ArrowLeft, X, Plus, Check } from 'lucide-react-native';
import type { Domain } from '@tenk/shared';
import { SKILL_COLORS } from '../types';
import { InlineDomainCreator } from './InlineDomainCreator';

interface Step2DomainProps {
  name:              string;
  domains:           Domain[];
  selectedDomainId:  string | null;
  color:             string;
  submitting:        boolean;
  onBack:            () => void;
  onSelectDomain:    (d: Domain) => void;
  onAddDomain:       (d: Domain) => void;
  onSelectColor:     (c: string) => void;
  onSubmit:          () => void;
  onClose:           () => void;
}

export function Step2Domain({
  name, domains, selectedDomainId, color, submitting,
  onBack, onSelectDomain, onAddDomain, onSelectColor, onSubmit, onClose,
}: Step2DomainProps) {
  const [showNewDomain, setShowNewDomain] = useState(domains.length === 0);

  const handleCreated = (d: Domain) => {
    onAddDomain(d);
    setShowNewDomain(false);
  };

  return (
    <>
      <View className="flex-row items-center gap-3 mb-6">
        <TouchableOpacity onPress={onBack}>
          <ArrowLeft size={20} color="#7c6cf0" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-text-muted text-xs uppercase tracking-widest">
            Step 2 of 2
          </Text>
          <Text className="text-white font-bold text-lg" numberOfLines={1}>"{name}"</Text>
        </View>
        <TouchableOpacity onPress={onClose}>
          <X size={20} color="#555555" />
        </TouchableOpacity>
      </View>

      {/* Domain picker */}
      <Text className="text-text-secondary text-sm font-medium mb-2">Domain</Text>
      <View className="flex-row flex-wrap gap-2 mb-3">
        {domains.map((d) => {
          const isSelected = selectedDomainId === d.id;
          return (
            <TouchableOpacity
              key={d.id}
              onPress={() => { onSelectDomain(d); setShowNewDomain(false); }}
              className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border"
              style={
                isSelected
                  ? { backgroundColor: d.color, borderColor: d.color }
                  : { backgroundColor: d.color + '20', borderColor: d.color + '60' }
              }
            >
              {isSelected && <Check size={12} color="white" />}
              <Text
                style={{
                  color:      isSelected ? 'white' : d.color,
                  fontSize:   13,
                  fontWeight: '500',
                }}
              >
                {d.name}
              </Text>
            </TouchableOpacity>
          );
        })}

        {!showNewDomain && (
          <TouchableOpacity
            onPress={() => setShowNewDomain(true)}
            className="flex-row items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-border"
          >
            <Plus size={12} color="#555555" />
            <Text className="text-text-muted text-xs">New domain</Text>
          </TouchableOpacity>
        )}
      </View>

      {showNewDomain && (
        <InlineDomainCreator
          canCancel={domains.length > 0}
          onCreated={handleCreated}
          onCancel={() => setShowNewDomain(false)}
        />
      )}

      {/* Color picker */}
      <Text className="text-text-secondary text-sm font-medium mb-2 mt-1">Color</Text>
      <View className="flex-row gap-3 mb-6">
        {SKILL_COLORS.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => onSelectColor(c)}
            style={{
              width:           32,
              height:          32,
              borderRadius:    16,
              backgroundColor: c,
              borderWidth:     2,
              borderColor:     color === c ? 'white' : 'transparent',
              transform:       [{ scale: color === c ? 1.1 : 1 }],
            }}
          />
        ))}
      </View>

      <TouchableOpacity
        onPress={onSubmit}
        disabled={submitting || !selectedDomainId || !name.trim()}
        className="bg-accent py-3.5 rounded-xl items-center flex-row justify-center gap-2"
        style={{ opacity: selectedDomainId && name.trim() ? 1 : 0.4 }}
      >
        {submitting && <ActivityIndicator size="small" color="white" />}
        <Text className="text-white font-semibold text-base">Create Skill</Text>
      </TouchableOpacity>
    </>
  );
}

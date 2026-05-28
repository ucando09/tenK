/**
 * Skills tab — composes the domain-grouped skill list, the create-skill
 * wizard, and the skill-detail modal.
 *
 * Sub-components live in `components/Skills/`; data loading lives in
 * `hooks/useSkillsData`.
 */
import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { useSkillsData } from '../../hooks/useSkillsData';
import { DomainGroup } from '../../components/Skills/DomainGroup';
import { SkillDetailModal } from '../../components/Skills/SkillDetailModal';
import { CreateSkillModal } from '../../components/Skills/CreateSkillModal';
import type { Domain } from '@tenk/shared';
import type { SkillWithDomain } from '../../components/Skills/types';

export default function SkillsTab() {
  const { domains, skills, loading, refreshing, refresh } = useSkillsData();

  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
  const [selectedSkill,   setSelectedSkill]   = useState<SkillWithDomain | null>(null);
  const [showCreateSkill, setShowCreateSkill] = useState(false);
  const [initialDomain,   setInitialDomain]   = useState<Domain | null>(null);

  /* Auto-expand all domains once they've loaded. */
  useEffect(() => {
    if (domains.length > 0) {
      setExpandedDomains(new Set(domains.map((d) => d.id)));
    }
  }, [domains]);

  const openNewSkill = (domain?: Domain) => {
    setInitialDomain(domain ?? null);
    setShowCreateSkill(true);
  };

  const toggleDomain = (id: string) => {
    setExpandedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else              next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-bg-deep items-center justify-center">
        <ActivityIndicator color="#7c6cf0" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-deep">
      <ScrollView
        className="flex-1 px-4 py-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#7c6cf0" />
        }
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white text-xl font-bold">My Skills</Text>
          <TouchableOpacity
            onPress={() => openNewSkill()}
            className="flex-row items-center gap-1.5 bg-accent px-3 py-1.5 rounded-lg"
          >
            <Plus size={14} color="white" />
            <Text className="text-white text-xs font-semibold">New Skill</Text>
          </TouchableOpacity>
        </View>

        {/* Empty state or domain groups */}
        {skills.length === 0 ? (
          <View className="items-center py-16">
            <Text className="text-5xl mb-3">🎯</Text>
            <Text className="text-white font-semibold text-lg mb-2">No skills yet</Text>
            <Text className="text-text-muted text-sm text-center mb-6">
              Tap "New Skill" to start tracking your first mastery goal.
            </Text>
            <TouchableOpacity
              onPress={() => openNewSkill()}
              className="bg-accent px-5 py-2.5 rounded-xl"
            >
              <Text className="text-white font-semibold">New Skill</Text>
            </TouchableOpacity>
          </View>
        ) : (
          domains.map((domain) => (
            <DomainGroup
              key={domain.id}
              domain={domain}
              skills={skills.filter((s) => s.domain_id === domain.id)}
              expanded={expandedDomains.has(domain.id)}
              onToggle={() => toggleDomain(domain.id)}
              onSelectSkill={setSelectedSkill}
              onAddSkill={() => openNewSkill(domain)}
            />
          ))
        )}

        <View className="h-8" />
      </ScrollView>

      {selectedSkill && (
        <SkillDetailModal
          skill={selectedSkill}
          onClose={() => setSelectedSkill(null)}
          onRefresh={refresh}
        />
      )}

      {showCreateSkill && (
        <CreateSkillModal
          availableDomains={domains}
          initialDomain={initialDomain}
          onClose={() => setShowCreateSkill(false)}
          onCreated={refresh}
        />
      )}
    </SafeAreaView>
  );
}

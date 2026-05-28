import { useState } from 'react';
import { Plus } from 'lucide-react';
import { DomainCard } from '../components/Skills/DomainCard';
import { CreateSkillModal } from '../components/Skills/CreateSkillModal';
import { SkillDetail } from '../components/Skills/SkillDetail';
import { useSkills } from '../lib/hooks/useSkills';
import type { Domain, Skill } from '@tenk/shared';

export function SkillsPage() {
  const {
    domains, skills,
    createDomain, deleteDomain,
    createSkill, updateSkill, deleteSkill,
  } = useSkills();
  const [showCreateSkill, setShowCreateSkill] = useState(false);
  const [initialDomainId, setInitialDomainId] = useState<string | undefined>();
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  const openNewSkill = (domainId?: string) => {
    setInitialDomainId(domainId);
    setShowCreateSkill(true);
  };

  const closeNewSkill = () => {
    setShowCreateSkill(false);
    setInitialDomainId(undefined);
  };

  const handleUpdateSkill = async (id: string, updates: Partial<Skill>) => {
    await updateSkill(id, updates);
    setSelectedSkill((prev) => (prev?.id === id ? { ...prev, ...updates } : prev));
  };

  const handleDeleteSkill = async (id: string) => {
    await deleteSkill(id);
    setSelectedSkill(null);
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-3xl mx-auto px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-text-primary font-bold text-2xl">My Mastery</h1>
          <button
            onClick={() => openNewSkill()}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus size={15} />
            New Mastery
          </button>
        </div>

        {/* Show the empty state only when there's truly nothing — no
            domains AND no skills. With domains seeded by default, this
            branch is rare, but if a user deletes everything they can
            re-enter via "New Mastery" (the wizard creates a domain inline). */}
        {domains.length === 0 && skills.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🎯</div>
            <h2 className="text-text-primary font-semibold text-lg mb-2">Nothing tracked yet</h2>
            <p className="text-text-muted text-sm mb-6 max-w-sm mx-auto">
              Add your first mastery — you'll set a goal and pick a domain to organize it under.
            </p>
            <button onClick={() => openNewSkill()} className="btn-primary">
              New Mastery
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {domains.map((domain) => (
              <DomainCard
                key={domain.id}
                domain={domain}
                skills={skills.filter((s) => s.domain_id === domain.id)}
                onSkillClick={setSelectedSkill}
                onAddSkill={(d: Domain) => openNewSkill(d.id)}
                onDeleteDomain={async (d) => { await deleteDomain(d.id); }}
              />
            ))}
          </div>
        )}
      </div>

      {/* New skill modal — self-contained: handles domain creation internally */}
      {showCreateSkill && (
        <CreateSkillModal
          domains={domains}
          initialDomainId={initialDomainId}
          onConfirm={createSkill}
          onCreateDomain={createDomain}
          onClose={closeNewSkill}
        />
      )}

      {/* Skill detail / edit */}
      {selectedSkill && (
        <SkillDetail
          skill={selectedSkill}
          onUpdate={handleUpdateSkill}
          onDelete={handleDeleteSkill}
          onClose={() => setSelectedSkill(null)}
        />
      )}
    </div>
  );
}

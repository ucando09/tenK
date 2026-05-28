import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { computeSkillGoal } from '../../lib/skillGoal';
import { extractErrorMessage } from '../../lib/utils';
import { getDomainIcon } from '../../lib/domainIcons';
import type { Domain, Skill } from '@tenk/shared';

interface DomainCardProps {
  domain:       Domain;
  skills:       Skill[];
  onSkillClick: (skill: Skill) => void;
  onAddSkill:   (domain: Domain) => void;
  onDeleteDomain: (domain: Domain) => Promise<void>;
}

export function DomainCard({
  domain, skills, onSkillClick, onAddSkill, onDeleteDomain,
}: DomainCardProps) {
  const [expanded, setExpanded]             = useState(true);
  const [confirmDelete, setConfirmDelete]   = useState(false);
  const [deleting, setDeleting]             = useState(false);
  const [deleteError, setDeleteError]       = useState<string | null>(null);

  const activeSkills  = skills.filter((s) => s.status === 'active');
  const shelvedSkills = skills.filter((s) => s.status === 'shelved');
  const Icon          = getDomainIcon(domain.icon);

  const cancelDelete = () => {
    setConfirmDelete(false);
    setDeleteError(null);
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDeleteDomain(domain);
      /* fetchAll re-runs in the store, this card will unmount */
    } catch (err) {
      setDeleteError(extractErrorMessage(err));
      setDeleting(false);
    }
  };

  return (
    <div
      className="card overflow-hidden"
      style={{ borderLeftColor: domain.color, borderLeftWidth: '3px' }}
    >
      {/* Header — clickable area + delete button as siblings (not nested
          buttons, which would be invalid HTML). */}
      <div className="flex items-center hover:bg-bg-elevated transition-colors group">
        <button
          className="flex items-center gap-3 flex-1 px-5 py-4 text-left"
          onClick={() => setExpanded((v) => !v)}
        >
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: domain.color + '20',
              color:           domain.color,
            }}
          >
            <Icon size={14} />
          </span>
          <span className="text-text-primary font-semibold text-sm flex-1">
            {domain.name}
          </span>
          <span className="text-text-muted text-xs mr-2">
            {skills.length} {skills.length === 1 ? 'mastery' : 'masteries'}
          </span>
          {expanded
            ? <ChevronDown  size={16} className="text-text-muted" />
            : <ChevronRight size={16} className="text-text-muted" />}
        </button>

        {/* Delete affordance — fades in on hover for cleanliness */}
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            title={
              skills.length > 0
                ? `Has ${skills.length} ${skills.length === 1 ? 'mastery' : 'masteries'} — delete those first`
                : 'Delete domain'
            }
            className="mr-3 p-2 rounded-lg text-text-dim hover:text-error hover:bg-error/10 transition-all
                       opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            <Trash2 size={14} />
          </button>
        ) : (
          <div className="mr-3 flex items-center gap-2 px-2 py-1 rounded-lg bg-error/10 border border-error/20">
            <span className="text-xs text-error">Delete?</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs font-semibold text-error hover:text-error/80 transition-colors"
            >
              {deleting ? '…' : 'Yes'}
            </button>
            <button
              onClick={cancelDelete}
              className="text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              No
            </button>
          </div>
        )}
      </div>

      {/* Inline error (e.g. "Has X skills, delete those first") */}
      {deleteError && (
        <div className="px-5 py-2 text-xs text-error bg-error/5 border-t border-error/20">
          {deleteError}
        </div>
      )}

      {/* Skills list */}
      {expanded && (
        <div className="border-t border-border">
          {activeSkills.map((skill) => (
            <SkillRow
              key={skill.id}
              skill={skill}
              domainColor={domain.color}
              onClick={() => onSkillClick(skill)}
            />
          ))}

          {shelvedSkills.length > 0 && (
            <>
              <div className="px-5 py-2 text-xs text-text-dim uppercase tracking-wider">
                Shelved
              </div>
              {shelvedSkills.map((skill) => (
                <SkillRow
                  key={skill.id}
                  skill={skill}
                  domainColor={domain.color}
                  onClick={() => onSkillClick(skill)}
                  faded
                />
              ))}
            </>
          )}

          <button
            onClick={() => onAddSkill(domain)}
            className="w-full flex items-center gap-2 px-5 py-3 text-text-muted hover:text-accent hover:bg-accent/5 transition-colors text-sm border-t border-border"
          >
            <Plus size={14} />
            Add mastery
          </button>
        </div>
      )}
    </div>
  );
}

interface SkillRowProps {
  skill:       Skill;
  domainColor: string;
  onClick:     () => void;
  faded?:      boolean;
}

function SkillRow({ skill, onClick, faded }: SkillRowProps) {
  const loggedHours = skill.logged_hours ?? 0;
  const progressPct = computeSkillGoal(skill).progress * 100;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-5 py-3 hover:bg-bg-elevated transition-colors border-t border-border ${
        faded ? 'opacity-50' : ''
      }`}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: skill.color }}
      />
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-primary truncate">{skill.name}</span>
          {faded && (
            <span className="text-xs text-text-dim px-1.5 py-0.5 rounded bg-bg-elevated border border-border">
              Shelved
            </span>
          )}
        </div>
        <div className="mt-1.5 flex items-center gap-3">
          <div className="flex-1 h-1 bg-bg-elevated rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%`, backgroundColor: skill.color }}
            />
          </div>
          <span className="text-xs text-text-muted flex-shrink-0">
            {loggedHours.toFixed(1)}h
          </span>
        </div>
      </div>
    </button>
  );
}

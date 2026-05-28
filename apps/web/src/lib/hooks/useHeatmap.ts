import { useState, useEffect, useCallback } from 'react';
import { subDays, format, parseISO, startOfDay } from 'date-fns';
import { supabase } from '../supabase';
import type { HeatmapDay, HeatmapMode } from '@tenk/shared';

interface UseHeatmapOptions {
  mode: HeatmapMode;
  skillId?: string;
  domainId?: string;
  userId?: string;
}

function hoursToOpacity(hours: number): number {
  if (hours <= 0) return 0;
  if (hours < 0.5) return 0.1;
  if (hours < 1) return 0.25;
  if (hours < 2) return 0.4;
  if (hours < 3) return 0.55;
  if (hours < 5) return 0.7;
  return 1.0;
}

function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

export function useHeatmap({ mode, skillId, domainId, userId }: UseHeatmapOptions) {
  const [heatmapData, setHeatmapData] = useState<Map<string, HeatmapDay>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHeatmap = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const since = format(subDays(new Date(), 365), 'yyyy-MM-dd');

      let query = supabase
        .from('sessions')
        .select('skill_id, started_at, duration_seconds, skill:skills(id, name, color, domain_id, domain:domains(id, name, color))')
        .gte('started_at', since)
        .not('duration_seconds', 'is', null);

      if (userId) {
        query = query.eq('user_id', userId);
      }
      if (mode === 'skill' && skillId) {
        query = query.eq('skill_id', skillId);
      }

      const { data, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;

      const map = new Map<string, HeatmapDay>();

      for (const session of data || []) {
        const dateStr = format(startOfDay(parseISO(session.started_at)), 'yyyy-MM-dd');
        const hours = (session.duration_seconds || 0) / 3600;
        const skill = (session.skill as unknown) as {
          id: string;
          name: string;
          color: string;
          domain_id: string;
          domain: { id: string; name: string; color: string } | null;
        } | null;
        if (!skill) continue;

        // Filter by domain if requested
        if (mode === 'domain' && domainId && skill.domain_id !== domainId) continue;

        const existing = map.get(dateStr);
        const skillColor = skill.color || skill.domain?.color || '#7c6cf0';

        if (existing) {
          existing.hours += hours;
          const existingSkill = existing.skills.find((s) => s.name === skill.name);
          if (existingSkill) {
            existingSkill.hours += hours;
          } else {
            existing.skills.push({ name: skill.name, hours, color: skillColor });
          }
          // Dominant color = skill with most hours
          const dominant = existing.skills.reduce((a, b) => (a.hours > b.hours ? a : b));
          existing.color = hexToRgba(dominant.color, hoursToOpacity(existing.hours));
        } else {
          map.set(dateStr, {
            date: dateStr,
            hours,
            color: hexToRgba(skillColor, hoursToOpacity(hours)),
            skills: [{ name: skill.name, hours, color: skillColor }],
          });
        }
      }

      setHeatmapData(map);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load heatmap');
    } finally {
      setLoading(false);
    }
  }, [mode, skillId, domainId, userId]);

  useEffect(() => {
    fetchHeatmap();
  }, [fetchHeatmap]);

  return { heatmapData, loading, error, refetch: fetchHeatmap };
}

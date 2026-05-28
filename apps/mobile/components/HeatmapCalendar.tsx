import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { format, subDays, startOfWeek, addDays } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useEffect } from 'react';

interface HeatmapDay {
  date: string;
  hours: number;
  color: string;
}

interface HeatmapCalendarProps {
  skillId?: string;
  userId?: string;
  accentColor?: string;
}

function hoursToOpacity(hours: number): number {
  if (hours <= 0) return 0;
  if (hours < 0.5) return 0.15;
  if (hours < 1) return 0.3;
  if (hours < 2) return 0.5;
  if (hours < 3) return 0.65;
  if (hours < 5) return 0.8;
  return 1.0;
}

export function HeatmapCalendar({ skillId, userId, accentColor = '#7c6cf0' }: HeatmapCalendarProps) {
  const [heatmapData, setHeatmapData] = useState<Map<string, HeatmapDay>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const since = format(subDays(new Date(), 365), 'yyyy-MM-dd');

        let query = supabase
          .from('sessions')
          .select('started_at, duration_seconds, skill:skills(color)')
          .gte('started_at', since)
          .not('duration_seconds', 'is', null);

        if (skillId) query = query.eq('skill_id', skillId);
        if (userId) query = query.eq('user_id', userId);

        const { data } = await query;
        const map = new Map<string, HeatmapDay>();

        for (const session of data || []) {
          const dateStr = format(new Date(session.started_at), 'yyyy-MM-dd');
          const hours = (session.duration_seconds || 0) / 3600;
          // Supabase types the joined `skill` as `unknown` (sometimes an array,
          // sometimes a single row). Cast through unknown to bypass the false
          // type mismatch — we only read `.color` and tolerate it being absent.
          const skillColor = (session.skill as unknown as { color?: string } | null)?.color ?? accentColor;

          const existing = map.get(dateStr);
          if (existing) {
            existing.hours += hours;
          } else {
            map.set(dateStr, { date: dateStr, hours, color: skillColor });
          }
        }

        setHeatmapData(map);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [skillId, userId, accentColor]);

  const weeks = useMemo(() => {
    const today = new Date();
    const startDate = startOfWeek(subDays(today, 364), { weekStartsOn: 1 });
    const weeks: Date[][] = [];
    let current = startDate;

    while (current <= today) {
      const week: Date[] = [];
      for (let d = 0; d < 7; d++) {
        week.push(addDays(current, d));
      }
      weeks.push(week);
      current = addDays(current, 7);
    }
    return weeks.slice(-26); // Show last 26 weeks
  }, []);

  const cellSize = 10;
  const cellGap = 2;

  if (loading) {
    return (
      <View className="h-16 items-center justify-center">
        <View className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent" />
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', gap: cellGap }}>
        {weeks.map((week, wi) => (
          <View key={wi} style={{ flexDirection: 'column', gap: cellGap }}>
            {week.map((day, di) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayData = heatmapData.get(dateStr);
              const opacity = dayData ? hoursToOpacity(dayData.hours) : 0;
              const bg = dayData
                ? `${dayData.color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`
                : '#1e1e3a';

              return (
                <View
                  key={di}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    borderRadius: 2,
                    backgroundColor: day > new Date() ? 'transparent' : (opacity > 0 ? undefined : '#1e1e3a'),
                    ...(opacity > 0 && dayData
                      ? { backgroundColor: dayData.color, opacity }
                      : {}),
                  }}
                />
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

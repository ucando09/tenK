import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'lucide-react-native';
import { HeatmapCalendar } from '../../components/HeatmapCalendar';
import { supabase } from '../../lib/supabase';

type CalView = 'heatmap' | 'google';

export default function CalendarTab() {
  const [view, setView] = useState<CalView>('heatmap');

  return (
    <SafeAreaView className="flex-1 bg-bg-deep">
      <ScrollView className="flex-1 px-4 py-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white text-xl font-bold">Calendar</Text>

          {/* Toggle */}
          <View className="flex-row bg-bg-elevated rounded-lg p-1 border border-border">
            <TouchableOpacity
              onPress={() => setView('heatmap')}
              className={`px-3 py-1.5 rounded-md ${view === 'heatmap' ? 'bg-bg-card' : ''}`}
            >
              <Text className={`text-xs font-medium ${view === 'heatmap' ? 'text-white' : 'text-text-muted'}`}>
                Heatmap
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setView('google')}
              className={`px-3 py-1.5 rounded-md ${view === 'google' ? 'bg-bg-card' : ''}`}
            >
              <Text className={`text-xs font-medium ${view === 'google' ? 'text-white' : 'text-text-muted'}`}>
                Google Cal
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {view === 'heatmap' ? (
          <View className="bg-bg-card rounded-xl border border-border p-4">
            <Text className="text-text-secondary text-sm font-medium mb-4">
              Activity — Last 26 Weeks
            </Text>
            <HeatmapCalendar />
          </View>
        ) : (
          <View className="bg-bg-card rounded-xl border border-border p-8 items-center">
            <Calendar size={40} color="#555555" />
            <Text className="text-white font-semibold text-lg mt-4 mb-2">
              Google Calendar
            </Text>
            <Text className="text-text-muted text-sm text-center mb-6">
              Connect your Google Calendar to see events alongside your practice schedule.
            </Text>
            <Text className="text-text-dim text-xs text-center">
              Google Calendar integration is available in the web app. Open 10K Hours on your laptop to connect.
            </Text>
          </View>
        )}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

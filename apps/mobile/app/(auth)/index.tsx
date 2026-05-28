import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../lib/supabase';

type Mode = 'signin' | 'signup';

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess('Check your email to confirm your account!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#08081a' }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 items-center justify-center px-6 py-12">
          {/* Logo */}
          <View className="items-center mb-10">
            <View className="w-16 h-16 rounded-2xl bg-accent items-center justify-center mb-4">
              <Text className="text-white text-2xl font-bold">10K</Text>
            </View>
            <Text className="text-white text-2xl font-bold">Mastery Tracker</Text>
            <Text className="text-text-muted text-sm mt-1.5">
              Track your journey to 10,000 hours
            </Text>
          </View>

          {/* Mode toggle */}
          <View className="w-full flex-row bg-bg-elevated rounded-xl p-1 mb-6 border border-border">
            <TouchableOpacity
              onPress={() => setMode('signin')}
              className={`flex-1 py-2.5 rounded-lg items-center ${mode === 'signin' ? 'bg-bg-card' : ''}`}
            >
              <Text className={`text-sm font-medium ${mode === 'signin' ? 'text-white' : 'text-text-muted'}`}>
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMode('signup')}
              className={`flex-1 py-2.5 rounded-lg items-center ${mode === 'signup' ? 'bg-bg-card' : ''}`}
            >
              <Text className={`text-sm font-medium ${mode === 'signup' ? 'text-white' : 'text-text-muted'}`}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View className="w-full space-y-4">
            <View>
              <Text className="text-text-secondary text-sm font-medium mb-1.5">Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#555555"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                className="bg-bg-elevated border border-border text-white rounded-xl px-4 py-3 text-sm"
                style={{ color: '#fff' }}
              />
            </View>

            <View>
              <Text className="text-text-secondary text-sm font-medium mb-1.5">Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#555555"
                secureTextEntry
                autoComplete="password"
                className="bg-bg-elevated border border-border text-white rounded-xl px-4 py-3 text-sm"
                style={{ color: '#fff' }}
              />
            </View>

            {error && (
              <View className="bg-error/10 border border-error/20 rounded-xl p-3">
                <Text className="text-error text-sm">{error}</Text>
              </View>
            )}
            {success && (
              <View className="bg-success/10 border border-success/20 rounded-xl p-3">
                <Text className="text-success text-sm">{success}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              className="bg-accent rounded-xl py-3.5 items-center flex-row justify-center gap-2 mt-2"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading && <ActivityIndicator color="white" size="small" />}
              <Text className="text-white font-semibold text-sm">
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="text-text-dim text-xs mt-8 text-center">
            Your data is private and secure. Self-hosted on Supabase.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

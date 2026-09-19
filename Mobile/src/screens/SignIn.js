import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/api';
import { COLORS } from '../utils/theme';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = '<your_expo_google_client_id>';

export default function SignIn({ navigation }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleToken(response.authentication.accessToken);
    }
  }, [response]);

  const handleGoogleToken = async (accessToken) => {
    setGLoading(true); setError('');
    try {
      const profile = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then(r => r.json());
      const res = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, profile }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Google sign-in failed'); return; }
      await login(data.user, data.token);
    } catch {
      setError('Google sign-in failed. Try again.');
    } finally {
      setGLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Sign in failed'); return; }
      await login(data.user, data.token);
    } catch {
      setError('Server error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>💰</Text>
        <Text style={styles.title}>MoneyTrack</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input} placeholder="Email"
          placeholderTextColor={COLORS.textMuted}
          value={form.email} onChangeText={v => setForm(f => ({ ...f, email: v }))}
          keyboardType="email-address" autoCapitalize="none"
        />
        <TextInput
          style={styles.input} placeholder="Password"
          placeholderTextColor={COLORS.textMuted}
          value={form.password} onChangeText={v => setForm(f => ({ ...f, password: v }))}
          secureTextEntry
        />

        <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign In</Text>}
        </TouchableOpacity>

        <View style={styles.divider}><View style={styles.dividerLine} /><Text style={styles.dividerText}>or</Text><View style={styles.dividerLine} /></View>

        <TouchableOpacity style={styles.googleBtn} onPress={() => promptAsync()} disabled={!request || gLoading}>
          <Text style={styles.googleIcon}>G</Text>
          {gLoading ? <ActivityIndicator color={COLORS.text} size="small" /> : <Text style={styles.googleText}>Continue with Google</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.link}>Don't have an account? <Text style={{ color: COLORS.primary }}>Sign Up</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo: { fontSize: 56, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center', color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 15, textAlign: 'center', color: COLORS.textMuted, marginBottom: 28 },
  error: { backgroundColor: COLORS.dangerLight, color: COLORS.danger, padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 14 },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 15,
    color: COLORS.text, backgroundColor: COLORS.white, marginBottom: 12,
  },
  btn: {
    backgroundColor: COLORS.primary, borderRadius: 10,
    paddingVertical: 14, alignItems: 'center', marginTop: 4, marginBottom: 16,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { color: COLORS.textMuted, fontSize: 13 },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10,
    paddingVertical: 13, backgroundColor: COLORS.white, marginBottom: 20,
  },
  googleIcon: { fontSize: 16, fontWeight: '800', color: '#4285F4' },
  googleText: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  link: { textAlign: 'center', color: COLORS.textMuted, fontSize: 14 },
});

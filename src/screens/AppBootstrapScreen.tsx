import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Clipboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/PreferencesContext';
import type { AppNav } from '../navigation/types';
import { fetchProfile } from '../services/profileService';
import {
  checkDatabaseSchema,
  type SchemaStatus,
} from '../services/schemaService';
import { loadRemoteExercises } from '../services/remoteExerciseService';
import { loadRemoteContent } from '../services/remoteContentService';

const SETUP_INSTRUCTIONS = `-- Run this in Supabase Dashboard → SQL Editor → New query

-- paste the full contents of:
--   supabase/setup_all.sql
-- then click Run.`;

function SetupScreen({
  status,
  onRetry,
}: {
  status: SchemaStatus;
  onRetry: () => void;
}) {
  const theme = useAppTheme();
  const c = theme.colors;
  const [copied, setCopied] = useState(false);

  const problems: string[] = [];
  if (!status.profilesOk) problems.push('• profiles table is missing');
  if (!status.otherCoursesOk)
    problems.push('• profiles.other_courses column is missing — run setup_all.sql');
  if (!status.userVocabularyOk)
    problems.push('• user_vocabulary table is missing');

  function copy() {
    Clipboard.setString(SETUP_INSTRUCTIONS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={styles.setupContent}
      testID="setup_scroll"
    >
      <Text style={[styles.setupTitle, { color: c.text }]} testID="setup_text_title">
        Database setup required
      </Text>
      <Text style={[styles.setupBody, { color: c.textSecondary }]} testID="setup_text_body">
        Some database tables or columns are missing. Run{' '}
        <Text style={{ fontFamily: 'monospace', color: c.primary }}>
          supabase/setup_all.sql
        </Text>{' '}
        in your Supabase SQL Editor to fix this.
      </Text>

      <View style={[styles.problemBox, { borderColor: c.danger, backgroundColor: theme.isDark ? 'rgba(248,113,113,0.08)' : 'rgba(254,242,242,1)' }]} testID="setup_box_problems">
        {problems.map((p) => (
          <Text key={p} style={[styles.problemItem, { color: c.danger }]}>
            {p}
          </Text>
        ))}
      </View>

      <Text style={[styles.setupStep, { color: c.textSecondary }]} testID="setup_text_steps">
        Steps:{'\n'}
        1. Open your Supabase project dashboard{'\n'}
        2. Go to SQL Editor → New query{'\n'}
        3. Paste the contents of{' '}
        <Text style={{ color: c.primary }}>supabase/setup_all.sql</Text>
        {'\n'}
        4. Click Run{'\n'}
        5. Press Retry below
      </Text>

      <Pressable
        style={[styles.btn, { backgroundColor: c.primary }]}
        onPress={onRetry}
        testID="setup_btn_retry"
      >
        <Text style={[styles.btnLabel, { color: c.onPrimary }]}>
          Retry
        </Text>
      </Pressable>

      <Pressable
        style={[styles.btnSecondary, { borderColor: c.border }]}
        onPress={copy}
        testID="setup_btn_copy"
      >
        <Text style={[styles.btnSecondaryLabel, { color: c.primary }]}>
          {copied ? 'Copied!' : 'Copy instructions'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

export function AppBootstrapScreen() {
  const navigation = useNavigation<AppNav>();
  const { user } = useAuth();
  const ran = useRef(false);
  const theme = useAppTheme();

  const [schemaStatus, setSchemaStatus] = useState<SchemaStatus | null>(null);

  async function boot() {
    ran.current = false;
    setSchemaStatus(null);
    run();
  }

  async function run() {
    if (!user?.id || ran.current) return;
    ran.current = true;

    try {
      // 1. Validate schema first
      const status = await checkDatabaseSchema();
      if (!status.allOk) {
        setSchemaStatus(status);
        return;
      }

      // 2. Load remote exercises + DB content (non-blocking, run in parallel)
      void Promise.all([loadRemoteExercises(), loadRemoteContent()]);

      // 3. Schema is good — load profile and route
      const profile = await fetchProfile(user.id);
      const level = profile?.current_level ?? 0;
      let target: 'Welcome' | 'Onboarding' | 'PlacementTest';
      if (level !== 0) {
        target = 'Welcome';
      } else {
        const hasLanguages = Boolean(
          profile?.native_language?.trim() && profile?.target_language?.trim(),
        );
        target = hasLanguages ? 'PlacementTest' : 'Onboarding';
      }
      navigation.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: target }] }),
      );
    } catch {
      navigation.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: 'Welcome' }] }),
      );
    }
  }

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (schemaStatus && !schemaStatus.allOk) {
    return <SetupScreen status={schemaStatus} onRetry={boot} />;
  }

  return (
    <View style={[styles.fill, { backgroundColor: theme.colors.background }]} testID="bootstrap_root">
      <ActivityIndicator size="large" color={theme.colors.primary} testID="bootstrap_spinner" />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setupContent: {
    padding: 24,
    paddingTop: 60,
    gap: 16,
  },
  setupTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  setupBody: {
    fontSize: 15,
    lineHeight: 22,
  },
  problemBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    gap: 6,
  },
  problemItem: {
    fontSize: 14,
    fontWeight: '600',
  },
  setupStep: {
    fontSize: 14,
    lineHeight: 22,
  },
  btn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  btnSecondary: {
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  btnSecondaryLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});

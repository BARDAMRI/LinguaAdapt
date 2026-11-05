/**
 * Mirrors local progress to Supabase while the learner is signed in.
 * Guest mode and builds without Supabase keys skip all of this.
 */
import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { mergeProgress } from './merge';
import { useProgress, type ProgressState } from './ProgressContext';

const PUSH_DELAY_MS = 4000;

export function ProgressSync() {
  const { user } = useAuth();
  const { loaded, state, replaceState } = useProgress();
  const pulledFor = useRef<string | null>(null);
  const lastPushed = useRef(0);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Pull once per sign-in and merge with what is on the device.
  useEffect(() => {
    const client = supabase;
    if (!client || !user || !loaded || pulledFor.current === user.id) return;
    pulledFor.current = user.id;
    void (async () => {
      try {
        const { data, error } = await client.from('user_progress').select('data').eq('user_id', user.id).maybeSingle();
        if (error) return;
        const remote = data?.data as ProgressState | undefined;
        if (remote && remote.version === 2) {
          const merged = mergeProgress(stateRef.current, remote);
          replaceState(merged);
        }
      } catch {
        // Offline: try again on the next sign-in.
        pulledFor.current = null;
      }
    })();
  }, [user, loaded, replaceState]);

  // Push changes a few seconds after they happen.
  useEffect(() => {
    const client = supabase;
    if (!client || !user || !loaded || pulledFor.current !== user.id) return;
    if (state.updatedAt <= lastPushed.current) return;
    const timer = setTimeout(() => {
      const snapshot = stateRef.current;
      void client
        .from('user_progress')
        .upsert({ user_id: user.id, data: snapshot, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
        .then(({ error }) => {
          if (!error) lastPushed.current = snapshot.updatedAt;
        });
    }, PUSH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [state.updatedAt, user, loaded]);

  return null;
}

import { useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const getSessionId = (): string => {
  const key = 'innovation_message_session_id';
  let sessionId = localStorage.getItem(key);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(key, sessionId);
  }
  return sessionId;
};

export const useMessageClickTracker = (innovationId: string) => {
  const sessionId = getSessionId();

  const supabaseWithSession = useMemo(
    () =>
      createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          storage: localStorage,
          persistSession: true,
          autoRefreshToken: true,
        },
      }),
    []
  );

  const trackMessageClick = useCallback(async () => {
    if (!innovationId) return;

    try {
      const { data: { user } } = await supabaseWithSession.auth.getUser();
      
      await supabaseWithSession.from('innovation_message_clicks').insert({
        innovation_id: innovationId,
        session_id: sessionId,
        user_id: user?.id || null,
      });
    } catch (error) {
      console.error('Error tracking message click:', error);
    }
  }, [innovationId, sessionId, supabaseWithSession]);

  return { trackMessageClick };
};

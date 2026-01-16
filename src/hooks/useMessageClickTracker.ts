import { useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

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

  const trackMessageClick = useCallback(async () => {
    if (!innovationId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from('innovation_message_clicks').insert({
        innovation_id: innovationId,
        session_id: sessionId,
        user_id: user?.id || null,
      });
    } catch (error) {
      console.error('Error tracking message click:', error);
    }
  }, [innovationId, sessionId]);

  return { trackMessageClick };
};

import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Track which videos have already been played this session to avoid duplicate increments
const playedVideos = new Set<string>();

export const useDemoPlayTracker = (innovationId: string) => {
  const hasTracked = useRef(false);

  const trackDemoPlay = useCallback(async () => {
    // Only track once per video per session
    if (hasTracked.current || playedVideos.has(innovationId)) {
      return;
    }

    hasTracked.current = true;
    playedVideos.add(innovationId);

    try {
      // Use the RPC function to increment view count
      const { error } = await supabase.rpc('increment_innovation_view_count', {
        _innovation_id: innovationId,
      });

      if (error) {
        console.error('Error tracking demo play:', error);
        // Revert tracking state on error
        hasTracked.current = false;
        playedVideos.delete(innovationId);
      }
    } catch (error) {
      console.error('Error tracking demo play:', error);
      hasTracked.current = false;
      playedVideos.delete(innovationId);
    }
  }, [innovationId]);

  return { trackDemoPlay };
};

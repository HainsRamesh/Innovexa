import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useDemoPlayTracker = (innovationId: string) => {
  const trackDemoPlay = useCallback(async () => {
    if (!innovationId) return;

    try {
      // Use the RPC function to increment view count
      const { error } = await supabase.rpc('increment_innovation_view_count', {
        _innovation_id: innovationId,
      });

      if (error) {
        console.error('Error tracking demo play:', error);
      }
    } catch (error) {
      console.error('Error tracking demo play:', error);
    }
  }, [innovationId]);

  return { trackDemoPlay };
};

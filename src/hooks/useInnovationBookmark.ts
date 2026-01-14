import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useInnovationBookmark = (innovationId: string) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const checkBookmark = async () => {
      if (!user || !innovationId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('bookmarks')
          .select('id')
          .eq('user_id', user.id)
          .eq('innovation_id', innovationId)
          .maybeSingle();

        if (error) throw error;
        setIsBookmarked(!!data);
      } catch (error) {
        console.error('Error checking bookmark:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkBookmark();
  }, [innovationId, user]);

  const toggleBookmark = useCallback(async () => {
    if (!user) {
      toast.error('Please sign in to save innovations');
      return;
    }

    const wasBookmarked = isBookmarked;
    setIsBookmarked(!isBookmarked);

    try {
      if (wasBookmarked) {
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('innovation_id', innovationId);

        if (error) throw error;
        toast.success('Innovation removed from saved');
      } else {
        const { error } = await supabase
          .from('bookmarks')
          .insert({
            user_id: user.id,
            innovation_id: innovationId,
          });

        if (error) throw error;
        toast.success('Innovation saved!');
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      setIsBookmarked(wasBookmarked);
      toast.error('Failed to update bookmark');
    }
  }, [innovationId, user, isBookmarked]);

  return { isBookmarked, isLoading, toggleBookmark };
};

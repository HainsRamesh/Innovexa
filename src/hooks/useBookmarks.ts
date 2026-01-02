import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Bookmark } from '@/types';

export const useBookmarks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBookmarks = useCallback(async () => {
    if (!user) {
      setBookmarks([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setBookmarks((data as Bookmark[]) || []);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const isBookmarked = useCallback(
    (problemId?: string, solutionId?: string) => {
      return bookmarks.some(
        (b) =>
          (problemId && b.problem_id === problemId) ||
          (solutionId && b.solution_id === solutionId)
      );
    },
    [bookmarks]
  );

  const toggleBookmark = useCallback(
    async (problemId?: string, solutionId?: string) => {
      if (!user) {
        toast({
          title: 'Sign in required',
          description: 'Please sign in to bookmark items',
          variant: 'destructive',
        });
        return;
      }

      const existingBookmark = bookmarks.find(
        (b) =>
          (problemId && b.problem_id === problemId) ||
          (solutionId && b.solution_id === solutionId)
      );

      try {
        if (existingBookmark) {
          // Remove bookmark
          const { error } = await supabase
            .from('bookmarks')
            .delete()
            .eq('id', existingBookmark.id);

          if (error) throw error;
          setBookmarks((prev) => prev.filter((b) => b.id !== existingBookmark.id));
          toast({
            title: 'Bookmark removed',
            description: 'Item removed from your bookmarks',
          });
        } else {
          // Add bookmark
          const { data, error } = await supabase
            .from('bookmarks')
            .insert({
              user_id: user.id,
              problem_id: problemId || null,
              solution_id: solutionId || null,
            })
            .select()
            .single();

          if (error) throw error;
          setBookmarks((prev) => [...prev, data as Bookmark]);
          toast({
            title: 'Bookmarked',
            description: 'Item added to your bookmarks',
          });
        }
      } catch (error) {
        console.error('Error toggling bookmark:', error);
        toast({
          title: 'Error',
          description: 'Failed to update bookmark',
          variant: 'destructive',
        });
      }
    },
    [user, bookmarks, toast]
  );

  return {
    bookmarks,
    isLoading,
    isBookmarked,
    toggleBookmark,
    refetch: fetchBookmarks,
  };
};

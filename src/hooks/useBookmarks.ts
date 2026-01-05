import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Bookmark } from '@/types';

export const useBookmarks = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
        toast.error('Sign in required', {
          description: 'Please sign in to bookmark items',
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
          toast.success('Bookmark removed', {
            description: 'Item removed from your bookmarks',
            duration: 3000,
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
          toast.success('Bookmarked', {
            description: 'Item added to your bookmarks',
            duration: 4000,
            action: {
              label: 'View Bookmarks',
              onClick: () => navigate('/dashboard/bookmarks'),
            },
          });
        }
      } catch (error) {
        console.error('Error toggling bookmark:', error);
        toast.error('Error', {
          description: 'Failed to update bookmark',
        });
      }
    },
    [user, bookmarks, navigate]
  );

  return {
    bookmarks,
    isLoading,
    isBookmarked,
    toggleBookmark,
    refetch: fetchBookmarks,
  };
};

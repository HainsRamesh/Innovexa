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
    (problemId?: string, solutionId?: string, innovationId?: string) => {
      return bookmarks.some(
        (b) =>
          (problemId && b.problem_id === problemId) ||
          (solutionId && b.solution_id === solutionId) ||
          (innovationId && b.innovation_id === innovationId)
      );
    },
    [bookmarks]
  );

  const toggleBookmark = useCallback(
    async (problemId?: string, solutionId?: string, innovationId?: string) => {
      if (!user) {
        toast.error('Sign in required', {
          description: 'Please sign in to bookmark items',
        });
        return;
      }

      // Validate that at least one entity ID is provided
      if (!problemId && !solutionId && !innovationId) {
        console.error('toggleBookmark called without any entity ID');
        toast.error('Error', {
          description: 'No item specified to bookmark',
        });
        return;
      }

      const existingBookmark = bookmarks.find(
        (b) =>
          (problemId && b.problem_id === problemId) ||
          (solutionId && b.solution_id === solutionId) ||
          (innovationId && b.innovation_id === innovationId)
      );

      try {
        if (existingBookmark) {
          // Remove bookmark (DELETE)
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
          // Add bookmark (INSERT) - only set the specific entity ID, others remain null
          const insertData: {
            user_id: string;
            problem_id?: string | null;
            solution_id?: string | null;
            innovation_id?: string | null;
          } = {
            user_id: user.id,
          };

          // Only set the relevant entity ID
          if (problemId) {
            insertData.problem_id = problemId;
          }
          if (solutionId) {
            insertData.solution_id = solutionId;
          }
          if (innovationId) {
            insertData.innovation_id = innovationId;
          }

          const { data, error } = await supabase
            .from('bookmarks')
            .insert(insertData)
            .select()
            .single();

          if (error) {
            // Handle duplicate constraint error gracefully
            if (error.code === '23505') {
              toast.info('Already bookmarked', {
                description: 'This item is already in your bookmarks',
              });
              // Refetch to sync state
              fetchBookmarks();
              return;
            }
            throw error;
          }
          
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
      } catch (error: any) {
        console.error('Error toggling bookmark:', error);
        // Show detailed error message for debugging
        const errorMessage = error?.message || 'Failed to update bookmark';
        toast.error('Bookmark Error', {
          description: errorMessage,
        });
      }
    },
    [user, bookmarks, navigate, fetchBookmarks]
  );

  return {
    bookmarks,
    isLoading,
    isBookmarked,
    toggleBookmark,
    refetch: fetchBookmarks,
  };
};

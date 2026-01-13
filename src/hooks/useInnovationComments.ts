import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface InnovationComment {
  id: string;
  innovation_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export const useInnovationComments = (innovationId: string) => {
  const [comments, setComments] = useState<InnovationComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const fetchComments = useCallback(async () => {
    if (!innovationId) return;

    try {
      const { data, error } = await supabase
        .from('innovation_comments')
        .select(`
          *,
          profiles:public_profiles!user_id(full_name, avatar_url)
        `)
        .eq('innovation_id', innovationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setComments((data as unknown as InnovationComment[]) || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [innovationId]);

  useEffect(() => {
    fetchComments();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`innovation-comments-${innovationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'innovation_comments',
          filter: `innovation_id=eq.${innovationId}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [innovationId, fetchComments]);

  const addComment = useCallback(
    async (content: string) => {
      if (!user || !content.trim()) return null;

      setIsSubmitting(true);
      try {
        const { data, error } = await supabase
          .from('innovation_comments')
          .insert({
            innovation_id: innovationId,
            user_id: user.id,
            content: content.trim(),
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error adding comment:', error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [innovationId, user]
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      try {
        const { error } = await supabase
          .from('innovation_comments')
          .delete()
          .eq('id', commentId)
          .eq('user_id', user?.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error deleting comment:', error);
        throw error;
      }
    },
    [user]
  );

  return {
    comments,
    isLoading,
    isSubmitting,
    addComment,
    deleteComment,
    refetch: fetchComments,
    count: comments.length,
  };
};

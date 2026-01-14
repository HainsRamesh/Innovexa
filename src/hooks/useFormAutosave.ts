import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UseFormAutosaveOptions {
  formType: string;
  entityId?: string;
  debounceMs?: number;
}

export const useFormAutosave = <T extends Record<string, unknown>>({
  formType,
  entityId,
  debounceMs = 2000,
}: UseFormAutosaveOptions) => {
  const { user } = useAuth();
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [draftData, setDraftData] = useState<T | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load draft on mount
  useEffect(() => {
    const loadDraft = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        let query = supabase
          .from('form_drafts')
          .select('*')
          .eq('user_id', user.id)
          .eq('form_type', formType);

        if (entityId) {
          query = query.eq('entity_id', entityId);
        } else {
          query = query.is('entity_id', null);
        }

        const { data, error } = await query.maybeSingle();

        if (error) throw error;

        if (data) {
          setDraftData(data.form_data as T);
          setLastSavedAt(new Date(data.last_saved_at));
        }
      } catch (error) {
        console.error('Error loading draft:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDraft();
  }, [user, formType, entityId]);

  const saveDraft = useCallback(
    async (data: T) => {
      if (!user) return;

      setIsSaving(true);
      try {
        // Check if draft exists first
        let query = supabase
          .from('form_drafts')
          .select('id')
          .eq('user_id', user.id)
          .eq('form_type', formType);

        if (entityId) {
          query = query.eq('entity_id', entityId);
        } else {
          query = query.is('entity_id', null);
        }

        const { data: existing } = await query.maybeSingle();

        if (existing) {
          // Update existing draft
          await supabase
            .from('form_drafts')
            .update({
              form_data: data as any,
              last_saved_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
        } else {
          // Insert new draft
          await supabase.from('form_drafts').insert({
            user_id: user.id,
            form_type: formType,
            entity_id: entityId || null,
            form_data: data as any,
            last_saved_at: new Date().toISOString(),
          } as any);
        }

        setLastSavedAt(new Date());
      } catch (error) {
        console.error('Error saving draft:', error);
      } finally {
        setIsSaving(false);
      }
    },
    [user, formType, entityId]
  );

  const debouncedSave = useCallback(
    (data: T) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        saveDraft(data);
      }, debounceMs);
    },
    [saveDraft, debounceMs]
  );

  const clearDraft = useCallback(async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('form_drafts')
        .delete()
        .eq('user_id', user.id)
        .eq('form_type', formType);

      if (entityId) {
        query = query.eq('entity_id', entityId);
      } else {
        query = query.is('entity_id', null);
      }

      await query;
      setDraftData(null);
      setLastSavedAt(null);
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  }, [user, formType, entityId]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    draftData,
    lastSavedAt,
    isSaving,
    isLoading,
    saveDraft: debouncedSave,
    clearDraft,
    saveImmediately: saveDraft,
  };
};

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole, Profile } from '@/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string, role: AppRole) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // Return a safe default for components that may render before provider is ready
    return {
      user: null,
      session: null,
      profile: null,
      role: null,
      isLoading: true,
      signUp: async () => ({ error: new Error('AuthProvider not ready') }),
      signIn: async () => ({ error: new Error('AuthProvider not ready') }),
      signOut: async () => {},
      updateProfile: async () => ({ error: new Error('AuthProvider not ready') }),
    } as AuthContextType;
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    console.log("[AuthContext] Fetching profile for user:", userId);
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error("[AuthContext] Error fetching profile:", error);
    } else if (profileData) {
      console.log("[AuthContext] Profile loaded:", profileData.id);
      setProfile(profileData as Profile);
    }
  };

  const fetchRole = async (userId: string, userMetadata?: Record<string, any>) => {
    console.log("[AuthContext] Fetching role for user:", userId);
    const { data: roleData, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error("[AuthContext] Error fetching role:", error);
    }

    if (roleData) {
      console.log("[AuthContext] Role loaded:", roleData.role);
      setRole(roleData.role as AppRole);
      return;
    }
    
    // If no role found in DB, try to create from pending_role in metadata
    if (!roleData && userMetadata?.pending_role) {
      console.log("[AuthContext] No role found, creating from metadata:", userMetadata.pending_role);
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: userMetadata.pending_role });
      
      if (!insertError) {
        console.log("[AuthContext] Role created successfully:", userMetadata.pending_role);
        setRole(userMetadata.pending_role as AppRole);
      } else {
        console.error("[AuthContext] Failed to create role:", insertError);
      }
    }
  };

  useEffect(() => {
    console.log("[AuthContext] Setting up auth state listener");
    
    // Set up auth state listener BEFORE checking initial session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[AuthContext] Auth state change:", {
        event,
        hasSession: !!session,
        userId: session?.user?.id ?? null,
      });
      
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Use setTimeout to prevent potential deadlocks with Supabase client
        setTimeout(() => {
          fetchProfile(session.user.id);
          fetchRole(session.user.id, session.user.user_metadata);
        }, 0);
      } else {
        // Clear all state when no session
        console.log("[AuthContext] No session, clearing state");
        setProfile(null);
        setRole(null);
      }
    });

    // Check initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("[AuthContext] Error getting initial session:", error);
      }
      
      console.log("[AuthContext] Initial session check:", {
        hasSession: !!session,
        userId: session?.user?.id ?? null,
      });
      
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id);
        fetchRole(session.user.id, session.user.user_metadata);
      }
      setIsLoading(false);
    });

    return () => {
      console.log("[AuthContext] Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string, selectedRole: AppRole) => {
    console.log("[AuthContext] signUp called for:", email);
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      console.error("[AuthContext] signUp error:", error);
      return { error };
    }

    if (data.user) {
      console.log("[AuthContext] User created, inserting role:", selectedRole);
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: data.user.id, role: selectedRole });

      if (roleError) {
        console.error("[AuthContext] Error inserting role:", roleError);
        return { error: roleError };
      }
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    console.log("[AuthContext] signIn called for:", email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log("[AuthContext] signInWithPassword result:", {
      hasSession: !!data?.session,
      hasUser: !!data?.user,
      error: error?.message ?? null,
    });

    return { error };
  };

  const signOut = async () => {
    console.log("[AuthContext] signOut called, clearing all state");
    
    // Clear local state first
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
    
    // Then sign out from Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error("[AuthContext] signOut error:", error);
    } else {
      console.log("[AuthContext] signOut completed successfully");
    }
    
    // Verify session is cleared
    const { data: sessionCheck } = await supabase.auth.getSession();
    console.log("[AuthContext] Post-signOut session check:", {
      hasSession: !!sessionCheck.session,
    });
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      console.error("[AuthContext] updateProfile called without user");
      return { error: new Error('No user logged in') };
    }

    console.log("[AuthContext] updateProfile called for:", user.id);
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (!error) {
      setProfile((prev) => prev ? { ...prev, ...updates } : null);
      console.log("[AuthContext] Profile updated successfully");
    } else {
      console.error("[AuthContext] updateProfile error:", error);
    }

    return { error };
  };

  // Log current auth state for debugging
  useEffect(() => {
    console.log("[AuthContext] Current auth state:", {
      hasUser: !!user,
      userId: user?.id ?? null,
      hasSession: !!session,
      hasProfile: !!profile,
      role,
      isLoading,
    });
  }, [user, session, profile, role, isLoading]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        isLoading,
        signUp,
        signIn,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

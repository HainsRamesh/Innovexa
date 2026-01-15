import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // User client to get the authenticated user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the user from the JWT
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      console.error('User authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log(`Starting account deletion for user: ${userId}`);

    // Admin client for privileged operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Step 1: Anonymize public content (problems, innovations, solutions)
    // This keeps content but removes personal identification
    console.log('Anonymizing public content...');

    // Anonymize problems
    const { error: problemsError } = await adminClient
      .from('problems')
      .update({ 
        owner_id: userId // Keep reference but profile will be deleted
      })
      .eq('owner_id', userId);
    
    if (problemsError) {
      console.error('Error updating problems:', problemsError);
    }

    // Anonymize innovations
    const { error: innovationsError } = await adminClient
      .from('innovations')
      .update({ 
        innovator_id: userId // Keep reference but profile will be deleted
      })
      .eq('innovator_id', userId);
    
    if (innovationsError) {
      console.error('Error updating innovations:', innovationsError);
    }

    // Anonymize solutions
    const { error: solutionsError } = await adminClient
      .from('solutions')
      .update({ 
        innovator_id: userId // Keep reference but profile will be deleted
      })
      .eq('innovator_id', userId);
    
    if (solutionsError) {
      console.error('Error updating solutions:', solutionsError);
    }

    // Step 2: Delete private data completely
    console.log('Deleting private data...');

    // Delete messages
    const { error: messagesError } = await adminClient
      .from('messages')
      .delete()
      .eq('sender_id', userId);
    
    if (messagesError) {
      console.error('Error deleting messages:', messagesError);
    }

    // Delete conversations where user is participant
    const { error: conversationsError } = await adminClient
      .from('conversations')
      .delete()
      .or(`participant_one.eq.${userId},participant_two.eq.${userId}`);
    
    if (conversationsError) {
      console.error('Error deleting conversations:', conversationsError);
    }

    // Delete notifications
    const { error: notificationsError } = await adminClient
      .from('notifications')
      .delete()
      .eq('user_id', userId);
    
    if (notificationsError) {
      console.error('Error deleting notifications:', notificationsError);
    }

    // Delete bookmarks
    const { error: bookmarksError } = await adminClient
      .from('bookmarks')
      .delete()
      .eq('user_id', userId);
    
    if (bookmarksError) {
      console.error('Error deleting bookmarks:', bookmarksError);
    }

    // Delete innovation likes
    const { error: innovationLikesError } = await adminClient
      .from('innovation_likes')
      .delete()
      .eq('user_id', userId);
    
    if (innovationLikesError) {
      console.error('Error deleting innovation likes:', innovationLikesError);
    }

    // Delete problem likes
    const { error: problemLikesError } = await adminClient
      .from('problem_likes')
      .delete()
      .eq('user_id', userId);
    
    if (problemLikesError) {
      console.error('Error deleting problem likes:', problemLikesError);
    }

    // Delete innovation comments
    const { error: commentsError } = await adminClient
      .from('innovation_comments')
      .delete()
      .eq('user_id', userId);
    
    if (commentsError) {
      console.error('Error deleting innovation comments:', commentsError);
    }

    // Delete solution replies
    const { error: repliesError } = await adminClient
      .from('solution_replies')
      .delete()
      .eq('user_id', userId);
    
    if (repliesError) {
      console.error('Error deleting solution replies:', repliesError);
    }

    // Delete user blocks (both directions)
    const { error: blocksError } = await adminClient
      .from('user_blocks')
      .delete()
      .or(`blocker_id.eq.${userId},blocked_user_id.eq.${userId}`);
    
    if (blocksError) {
      console.error('Error deleting user blocks:', blocksError);
    }

    // Delete user restrictions
    const { error: restrictionsError } = await adminClient
      .from('user_restrictions')
      .delete()
      .or(`restrictor_id.eq.${userId},restricted_user_id.eq.${userId}`);
    
    if (restrictionsError) {
      console.error('Error deleting user restrictions:', restrictionsError);
    }

    // Delete connections
    const { error: connectionsError } = await adminClient
      .from('connections')
      .delete()
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`);
    
    if (connectionsError) {
      console.error('Error deleting connections:', connectionsError);
    }

    // Delete investor interests
    const { error: interestsError } = await adminClient
      .from('investor_interests')
      .delete()
      .eq('investor_id', userId);
    
    if (interestsError) {
      console.error('Error deleting investor interests:', interestsError);
    }

    // Delete investments
    const { error: investmentsError } = await adminClient
      .from('investments')
      .delete()
      .eq('investor_id', userId);
    
    if (investmentsError) {
      console.error('Error deleting investments:', investmentsError);
    }

    // Delete form drafts
    const { error: draftsError } = await adminClient
      .from('form_drafts')
      .delete()
      .eq('user_id', userId);
    
    if (draftsError) {
      console.error('Error deleting form drafts:', draftsError);
    }

    // Delete notification preferences
    const { error: notifPrefsError } = await adminClient
      .from('notification_preferences')
      .delete()
      .eq('user_id', userId);
    
    if (notifPrefsError) {
      console.error('Error deleting notification preferences:', notifPrefsError);
    }

    // Delete messaging preferences
    const { error: msgPrefsError } = await adminClient
      .from('messaging_preferences')
      .delete()
      .eq('user_id', userId);
    
    if (msgPrefsError) {
      console.error('Error deleting messaging preferences:', msgPrefsError);
    }

    // Delete privacy settings
    const { error: privacyError } = await adminClient
      .from('privacy_settings')
      .delete()
      .eq('user_id', userId);
    
    if (privacyError) {
      console.error('Error deleting privacy settings:', privacyError);
    }

    // Delete user role
    const { error: roleError } = await adminClient
      .from('user_roles')
      .delete()
      .eq('user_id', userId);
    
    if (roleError) {
      console.error('Error deleting user role:', roleError);
    }

    // Delete public profile
    const { error: publicProfileError } = await adminClient
      .from('public_profiles')
      .delete()
      .eq('id', userId);
    
    if (publicProfileError) {
      console.error('Error deleting public profile:', publicProfileError);
    }

    // Delete profile (this should cascade from auth.users deletion, but do it explicitly)
    const { error: profileError } = await adminClient
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (profileError) {
      console.error('Error deleting profile:', profileError);
    }

    // Step 3: Delete the auth user
    console.log('Deleting auth user...');
    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      console.error('Error deleting auth user:', deleteUserError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete account. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully deleted account for user: ${userId}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Account deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error during account deletion:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

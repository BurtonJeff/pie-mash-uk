import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Permanently deletes the authenticated user's account.
// The JWT in the Authorization header identifies which user to delete.
// Foreign key CASCADE on profiles ensures related data is cleaned up automatically.
Deno.serve(async (req) => {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Verify the caller's identity using their JWT.
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Delete from auth.users — FK cascade removes profiles and related rows.
  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return new Response('ok');
});

/**
 * seed-test-users.js
 *
 * Creates a set of test user accounts in Supabase Auth and populates
 * their profiles with realistic data for testing the admin Users screen.
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=xxx node docs/seed-test-users.js
 *
 * All accounts are created with password: Test1234!
 * Accounts are email-confirmed immediately so they can sign in straight away.
 *
 * Re-running the script is safe — existing emails are skipped.
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const PASSWORD = 'Test1234!';

const TEST_USERS = [
  {
    email: 'alice.baker@test.pml',
    username: 'alice_b',
    display_name: 'Alice Baker',
    bio: 'Born and raised in Bermondsey. Manze\'s is my local.',
    total_points: 420,
    total_visits: 34,
    unique_shops_visited: 8,
  },
  {
    email: 'bob.kelly@test.pml',
    username: 'bob_kelly',
    display_name: 'Bob Kelly',
    bio: 'East End through and through. G. Kelly is my spiritual home.',
    total_points: 310,
    total_visits: 25,
    unique_shops_visited: 6,
  },
  {
    email: 'carol.mash@test.pml',
    username: 'carol_mash',
    display_name: 'Carol Mash',
    bio: 'On a mission to visit every pie shop in London.',
    total_points: 880,
    total_visits: 71,
    unique_shops_visited: 15,
  },
  {
    email: 'dave.liquor@test.pml',
    username: 'dave_l',
    display_name: 'Dave Liquor',
    bio: null,
    total_points: 90,
    total_visits: 7,
    unique_shops_visited: 3,
  },
  {
    email: 'eve.parsley@test.pml',
    username: 'eve_parsley',
    display_name: 'Eve Parsley',
    bio: 'Prefer the liquor to the eels, if I\'m honest.',
    total_points: 200,
    total_visits: 16,
    unique_shops_visited: 5,
  },
  {
    email: 'frank.pie@test.pml',
    username: 'frank_pie',
    display_name: 'Frank Pie',
    bio: null,
    total_points: 50,
    total_visits: 4,
    unique_shops_visited: 2,
  },
  {
    email: 'grace.stewed@test.pml',
    username: 'grace_s',
    display_name: 'Grace Stewed',
    bio: 'Stewed eels every Saturday without fail.',
    total_points: 560,
    total_visits: 45,
    unique_shops_visited: 11,
  },
  {
    email: 'harry.manze@test.pml',
    username: 'harry_m',
    display_name: 'Harry Manze',
    bio: 'No relation, just a fan.',
    total_points: 130,
    total_visits: 10,
    unique_shops_visited: 4,
  },
];

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'apikey': SUPABASE_KEY,
};

async function createAuthUser(user) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email: user.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: {
        username: user.username,
        display_name: user.display_name,
      },
    }),
  });

  const body = await res.json();

  if (!res.ok) {
    // 422 with "User already registered" means we can skip
    if (body.msg?.includes('already') || body.message?.includes('already')) {
      return null; // skip
    }
    throw new Error(`Auth error for ${user.email}: ${JSON.stringify(body)}`);
  }

  return body.id; // auth user UUID
}

async function updateProfile(userId, user) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
    {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        display_name: user.display_name,
        username: user.username,
        bio: user.bio,
        total_points: user.total_points,
        total_visits: user.total_visits,
        unique_shops_visited: user.unique_shops_visited,
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Profile update error for ${user.email}: ${text}`);
  }
}

async function main() {
  console.log(`Seeding ${TEST_USERS.length} test users…\n`);

  for (const user of TEST_USERS) {
    process.stdout.write(`  ${user.display_name} (${user.email}) … `);

    const userId = await createAuthUser(user);

    if (!userId) {
      console.log('skipped (already exists)');
      continue;
    }

    // Brief pause to let the handle_new_user trigger create the profile row
    await new Promise((r) => setTimeout(r, 400));

    await updateProfile(userId, user);
    console.log(`created (id: ${userId})`);
  }

  console.log(`\nDone. Sign in with any of the emails above using password: ${PASSWORD}`);
}

main().catch((err) => { console.error(err); process.exit(1); });

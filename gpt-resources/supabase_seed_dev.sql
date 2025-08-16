
-- supabase_seed_dev.sql
-- Dev seeding for vibebeat.io (runs AFTER supabase_schema_v1_1.sql).
-- This script:
--  - Picks the first existing auth user (or aborts if none)
--  - Creates a sample project, share slug, example asset row, and AI log
-- NOTE: You generally cannot create users from SQL in Supabase without admin context.
--       Create at least one user via the app (Auth) first, then run this.

do $$
declare
  uid uuid;
  proj_id uuid;
  share_slug text;
begin
  -- Grab any existing user (or abort if none exist)
  select id into uid from auth.users order by created_at asc limit 1;
  if uid is null then
    raise exception 'No users found in auth.users. Create a user via your app and rerun.';
  end if;

  -- Create a simple demo project payload
  insert into public.projects (owner, title, data)
  values (
    uid,
    'VibeBeat Demo Project',
    jsonb_build_object(
      'version','1.1.0',
      'projectId', gen_random_uuid()::text,
      'title','VibeBeat Demo Project',
      'tempoBpm', 92,
      'timeSig','4/4',
      'bars', 8,
      'swingPercent', 54,
      'tracks', jsonb_build_array(
        jsonb_build_object(
          'id','t1','type','DRUM','name','Drums','kitId','factory-kit-01',
          'pattern', jsonb_build_object(
            'grid','1/16','steps',128,
            'pads', jsonb_build_array(
              jsonb_build_object('pad','KICK','hits', jsonb_build_array(
                jsonb_build_object('step',0,'vel',118),
                jsonb_build_object('step',8,'vel',96),
                jsonb_build_object('step',12,'vel',100)
              )),
              jsonb_build_object('pad','SNARE','hits', jsonb_build_array(
                jsonb_build_object('step',8,'vel',112),
                jsonb_build_object('step',24,'vel',110)
              ))
            )
          ),
          'mixer', jsonb_build_object('vol',0.8,'pan',0.0,'sendA',0.1,'sendB',0.0)
        ),
        jsonb_build_object(
          'id','t2','type','KEYS','name','Keys','key','A','scale','natural_minor',
          'notes', jsonb_build_array(
            jsonb_build_object('step',0,'pitch','A3','durSteps',2,'vel',96),
            jsonb_build_object('step',2,'pitch','C4','durSteps',2,'vel',92)
          ),
          'mixer', jsonb_build_object('vol',0.8,'pan',-0.1,'sendA',0.12,'sendB',0.0)
        )
      ),
      'arrangement', jsonb_build_array('A','A','B','B'),
      'createdAt', extract(epoch from now())::bigint,
      'updatedAt', extract(epoch from now())::bigint
    )
  )
  returning id into proj_id;

  -- Create or reuse a share slug for the project
  begin
    insert into public.shares (project, slug)
    values (proj_id, public.gen_share_slug());
  exception when unique_violation then
    -- extremely unlikely; ignore
    null;
  end;

  -- Add a sample asset metadata row (file not uploaded yet)
  insert into public.assets (owner, kind, path)
  values (uid, 'audio', 'user-assets/' || uid || '/demos/voice-demo.wav')
  on conflict (path) do nothing;

  -- Log one AI event (for telemetry testing)
  insert into public.ai_logs (owner, tool, meta)
  values (uid, 'drum', jsonb_build_object('seed','demo','bars',16,'style',jsonb_build_array('lofi','boom-bap')));

  raise notice 'Seed complete. Project id: %, Share slug: %',
    proj_id,
    (select slug from public.shares where project = proj_id limit 1);
end $$;

-- Show results
table public.projects;
table public.shares;
table public.assets;
table public.ai_logs;

drop extension if exists "pg_net";

alter table "public"."audio_assets" drop constraint "audio_assets_task_id_fkey";

alter table "public"."tasks" drop constraint "tasks_day_plan_id_fkey";


  create table "public"."task_shards" (
    "id" uuid not null default gen_random_uuid(),
    "name" character varying(100) not null,
    "display_name" character varying(200) not null,
    "modality" character varying(50) not null,
    "description" text,
    "typical_duration_minutes" integer default 5,
    "energy_level" character varying(20) default 'medium'::character varying,
    "difficulty_base" integer default 3,
    "xp_reward" integer default 20,
    "skill_targets" jsonb default '[]'::jsonb,
    "ai_prompt_template" jsonb default '{}'::jsonb,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."task_templates" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "description" text not null,
    "type" text not null,
    "default_duration" integer default 15,
    "default_xp" integer default 10,
    "prompt_instructions" text,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."adaptation_logs" add column "action_taken" text;

alter table "public"."adaptation_logs" add column "rule_triggered" text;

alter table "public"."ai_generation_logs" drop column "latency_ms";

alter table "public"."ai_generation_logs" drop column "provider";

alter table "public"."ai_generation_logs" drop column "tokens_used";

alter table "public"."ai_generation_logs" add column "error_message" text;

alter table "public"."ai_generation_logs" add column "latency" integer;

alter table "public"."ai_generation_logs" add column "status" text not null;

alter table "public"."ai_generation_logs" add column "token_count" integer;

alter table "public"."ai_generation_logs" add column "type" text not null;

alter table "public"."ai_generation_logs" alter column "model" set not null;

alter table "public"."api_cost_logs" drop column "cost_usd";

alter table "public"."api_cost_logs" drop column "model";

alter table "public"."api_cost_logs" drop column "provider";

alter table "public"."api_cost_logs" drop column "tokens_input";

alter table "public"."api_cost_logs" drop column "tokens_output";

alter table "public"."api_cost_logs" add column "cost" numeric(10,4) not null;

alter table "public"."api_cost_logs" add column "currency" text default 'USD'::text;

alter table "public"."api_cost_logs" add column "metadata" jsonb default '{}'::jsonb;

alter table "public"."api_cost_logs" add column "service" text not null;

alter table "public"."check_ins" add column "date" date default CURRENT_DATE;

alter table "public"."check_ins" add column "updated_at" timestamp without time zone default now();

alter table "public"."goal_categories" enable row level security;

alter table "public"."goal_templates" enable row level security;

alter table "public"."goals" add column "category" text;

alter table "public"."goals" add column "target_date" date;

alter table "public"."program_ratings" drop column "feedback";

alter table "public"."program_ratings" add column "comment" text;

alter table "public"."progress" add column "checkin_date" date default CURRENT_DATE;

alter table "public"."progress" add column "metrics" jsonb default '{}'::jsonb;

alter table "public"."progress" add column "mood" text;

alter table "public"."progress" add column "notes" text;

alter table "public"."quiz_attempts" add column "updated_at" timestamp without time zone default now();

alter table "public"."reward_events" add column "description" text;

alter table "public"."reward_events" add column "event_type" text;

alter table "public"."reward_events" add column "points" integer default 0;

alter table "public"."reward_events" add column "updated_at" timestamp without time zone default now();

alter table "public"."ritual_tracks" add column "date" text;

alter table "public"."ritual_tracks" add column "ritualType" text;

alter table "public"."ritual_tracks" add column "ritual_type" text;

alter table "public"."ritual_tracks" add column "user_id" uuid;

alter table "public"."tasks" add column "metadata" jsonb default '{}'::jsonb;

alter table "public"."tasks" alter column "day_plan_id" set not null;

alter table "public"."tasks" disable row level security;

alter table "public"."users" add column "level" integer default 1;

alter table "public"."users" add column "streak" integer default 0;

alter table "public"."users" add column "xp" integer default 0;

alter table "public"."videos" drop column "duration";

alter table "public"."videos" drop column "metadata";

alter table "public"."videos" add column "approved" boolean default false;

alter table "public"."videos" add column "category" text not null;

CREATE UNIQUE INDEX task_shards_name_key ON public.task_shards USING btree (name);

CREATE UNIQUE INDEX task_shards_pkey ON public.task_shards USING btree (id);

CREATE UNIQUE INDEX task_templates_pkey ON public.task_templates USING btree (id);

alter table "public"."task_shards" add constraint "task_shards_pkey" PRIMARY KEY using index "task_shards_pkey";

alter table "public"."task_templates" add constraint "task_templates_pkey" PRIMARY KEY using index "task_templates_pkey";

alter table "public"."task_shards" add constraint "task_shards_name_key" UNIQUE using index "task_shards_name_key";

grant delete on table "public"."task_shards" to "anon";

grant insert on table "public"."task_shards" to "anon";

grant references on table "public"."task_shards" to "anon";

grant select on table "public"."task_shards" to "anon";

grant trigger on table "public"."task_shards" to "anon";

grant truncate on table "public"."task_shards" to "anon";

grant update on table "public"."task_shards" to "anon";

grant delete on table "public"."task_shards" to "authenticated";

grant insert on table "public"."task_shards" to "authenticated";

grant references on table "public"."task_shards" to "authenticated";

grant select on table "public"."task_shards" to "authenticated";

grant trigger on table "public"."task_shards" to "authenticated";

grant truncate on table "public"."task_shards" to "authenticated";

grant update on table "public"."task_shards" to "authenticated";

grant delete on table "public"."task_shards" to "service_role";

grant insert on table "public"."task_shards" to "service_role";

grant references on table "public"."task_shards" to "service_role";

grant select on table "public"."task_shards" to "service_role";

grant trigger on table "public"."task_shards" to "service_role";

grant truncate on table "public"."task_shards" to "service_role";

grant update on table "public"."task_shards" to "service_role";

grant delete on table "public"."task_templates" to "anon";

grant insert on table "public"."task_templates" to "anon";

grant references on table "public"."task_templates" to "anon";

grant select on table "public"."task_templates" to "anon";

grant trigger on table "public"."task_templates" to "anon";

grant truncate on table "public"."task_templates" to "anon";

grant update on table "public"."task_templates" to "anon";

grant delete on table "public"."task_templates" to "authenticated";

grant insert on table "public"."task_templates" to "authenticated";

grant references on table "public"."task_templates" to "authenticated";

grant select on table "public"."task_templates" to "authenticated";

grant trigger on table "public"."task_templates" to "authenticated";

grant truncate on table "public"."task_templates" to "authenticated";

grant update on table "public"."task_templates" to "authenticated";

grant delete on table "public"."task_templates" to "service_role";

grant insert on table "public"."task_templates" to "service_role";

grant references on table "public"."task_templates" to "service_role";

grant select on table "public"."task_templates" to "service_role";

grant trigger on table "public"."task_templates" to "service_role";

grant truncate on table "public"."task_templates" to "service_role";

grant update on table "public"."task_templates" to "service_role";


  create policy "Public categories are viewable by everyone"
  on "public"."goal_categories"
  as permissive
  for select
  to public
using (true);




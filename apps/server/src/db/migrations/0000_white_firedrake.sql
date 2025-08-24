CREATE TABLE "attributes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "attributes_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "brand_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt_id" uuid NOT NULL,
	"engine_id" uuid,
	"persona_id" uuid,
	"metric_date" text NOT NULL,
	"brand_id" uuid NOT NULL,
	"response_id" uuid NOT NULL,
	"mention_count" integer,
	"mention_score" real,
	"position_score" real,
	"sentiment_score" real,
	"competitive_score" real,
	"overall_score" real,
	"visibility_score" real,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"industry" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "engines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"provider" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insight_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metric_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"payload" json NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"facts" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_tags" (
	"prompt_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "response_attributes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"response_id" uuid NOT NULL,
	"attribute_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"confidence" real,
	"context_snippet" text,
	"detected_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "response_brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"response_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"confidence" real,
	"context_snippet" text,
	"position" text NOT NULL,
	"detected_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"sentiment" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "response_sources" (
	"response_id" uuid NOT NULL,
	"url" text NOT NULL,
	"title" text,
	"description" text DEFAULT '',
	"website_domain" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt_id" uuid NOT NULL,
	"engine_id" uuid NOT NULL,
	"persona_id" uuid,
	"text" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brand_metrics" ADD CONSTRAINT "brand_metrics_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_metrics" ADD CONSTRAINT "brand_metrics_engine_id_engines_id_fk" FOREIGN KEY ("engine_id") REFERENCES "public"."engines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_metrics" ADD CONSTRAINT "brand_metrics_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."personas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_metrics" ADD CONSTRAINT "brand_metrics_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_metrics" ADD CONSTRAINT "brand_metrics_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insight_events" ADD CONSTRAINT "insight_events_metric_id_brand_metrics_id_fk" FOREIGN KEY ("metric_id") REFERENCES "public"."brand_metrics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_tags" ADD CONSTRAINT "prompt_tags_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_tags" ADD CONSTRAINT "prompt_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_attributes" ADD CONSTRAINT "response_attributes_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_attributes" ADD CONSTRAINT "response_attributes_attribute_id_attributes_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."attributes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_attributes" ADD CONSTRAINT "response_attributes_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_brands" ADD CONSTRAINT "response_brands_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_brands" ADD CONSTRAINT "response_brands_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_sources" ADD CONSTRAINT "response_sources_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_engine_id_engines_id_fk" FOREIGN KEY ("engine_id") REFERENCES "public"."engines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."personas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_attributes_name" ON "attributes" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "prompt_metrics_unique" ON "brand_metrics" USING btree ("prompt_id","engine_id","persona_id","metric_date","brand_id","response_id");--> statement-breakpoint
CREATE INDEX "idx_pm_brand_date" ON "brand_metrics" USING btree ("brand_id","metric_date");--> statement-breakpoint
CREATE INDEX "idx_pm_prompt_date" ON "brand_metrics" USING btree ("prompt_id","metric_date");--> statement-breakpoint
CREATE INDEX "idx_pm_engine_date" ON "brand_metrics" USING btree ("engine_id","metric_date");--> statement-breakpoint
CREATE INDEX "idx_pm_persona_date" ON "brand_metrics" USING btree ("persona_id","metric_date");--> statement-breakpoint
CREATE INDEX "idx_pm_response_date" ON "brand_metrics" USING btree ("response_id","metric_date");--> statement-breakpoint
CREATE UNIQUE INDEX "brands_name_unique" ON "brands" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "prompt_tags_pk" ON "prompt_tags" USING btree ("prompt_id","tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_response_sources_url_id" ON "response_sources" USING btree ("url","response_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_name_unique" ON "tags" USING btree ("name");
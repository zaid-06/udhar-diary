ALTER TABLE "customers" DROP CONSTRAINT "customers_shopkeeper_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "shopkeeper_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_shopkeeper_id_user_id_fk" FOREIGN KEY ("shopkeeper_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
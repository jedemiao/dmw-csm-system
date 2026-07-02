ALTER TABLE "AdminUser" RENAME COLUMN "email" TO "username";
ALTER INDEX "AdminUser_email_key" RENAME TO "AdminUser_username_key";

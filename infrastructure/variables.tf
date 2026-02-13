# variables.tf — Input variables for SAIL infrastructure
#
# These variables are used by main.tf to configure the Vercel project
# and inject environment values. Set them via terraform.tfvars or
# TF_VAR_ environment variables.
#
# Sensitive values (API tokens, keys) are marked as sensitive = true
# so Terraform redacts them from plan output and state display.

# Vercel API token for authenticating Terraform with Vercel
variable "vercel_api_token" {
  type        = string
  sensitive   = true
  description = "Vercel API token for managing the SAIL project"
}

# The public Supabase project URL (e.g. https://xxxx.supabase.co)
variable "supabase_url" {
  type        = string
  description = "Supabase project URL (NEXT_PUBLIC_SUPABASE_URL)"
}

# The Supabase anonymous/public key for client-side auth
variable "supabase_anon_key" {
  type        = string
  sensitive   = true
  description = "Supabase anonymous key (NEXT_PUBLIC_SUPABASE_ANON_KEY)"
}

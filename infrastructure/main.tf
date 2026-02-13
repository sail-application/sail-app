# main.tf — SAIL infrastructure
#
# Manages Vercel project settings and Supabase configuration using Terraform.
# This is a skeleton that can be extended as the infrastructure grows.
#
# Usage:
#   terraform init    — Download provider plugins
#   terraform plan    — Preview changes
#   terraform apply   — Apply changes to real infrastructure
#
# Required variables (set via terraform.tfvars or TF_VAR_ env vars):
#   - vercel_api_token
#   - supabase_url
#   - supabase_anon_key

terraform {
  required_version = ">= 1.5"

  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
  }
}

# Configure the Vercel provider with an API token
provider "vercel" {
  api_token = var.vercel_api_token
}

# The main SAIL Vercel project — auto-deploys from GitHub
resource "vercel_project" "sail" {
  name      = "sail-app"
  framework = "nextjs"

  git_repository = {
    type = "github"
    repo = "sail-application/sail-app"
  }

  environment = [
    {
      key    = "NEXT_PUBLIC_SUPABASE_URL"
      value  = var.supabase_url
      target = ["production", "preview"]
    },
  ]
}

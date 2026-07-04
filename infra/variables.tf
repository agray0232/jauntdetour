variable "resource_group_name" {
  description = "Name of the existing Azure resource group to deploy the database into."
  type        = string
  default     = "jauntdetour-rg"
}

variable "environment" {
  description = "Deployment environment tag (e.g. development, production)."
  type        = string
  default     = "production"
}

variable "location" {
  description = "Azure region for the PostgreSQL server. May differ from the resource group's region."
  type        = string
  default     = "centralus"
}

variable "server_name" {
  description = "Globally unique name of the PostgreSQL Flexible Server."
  type        = string
  default     = "jauntdetour-db-prod"
}

variable "database_name" {
  description = "Name of the application database created on the server."
  type        = string
  default     = "jauntdetour"
}

variable "postgres_version" {
  description = "Major PostgreSQL version."
  type        = string
  default     = "14"
}

variable "sku_name" {
  description = "Compute SKU. Burstable B1ms is covered by the 12-month free tier."
  type        = string
  default     = "B_Standard_B1ms"
}

variable "storage_mb" {
  description = "Provisioned storage in MB (32 GB = 32768)."
  type        = number
  default     = 32768
}

variable "backup_retention_days" {
  description = "Automated backup retention window in days."
  type        = number
  default     = 7
}

variable "admin_login" {
  description = "Administrator login for the PostgreSQL server."
  type        = string
  default     = "dbadmin"
}

variable "admin_password" {
  description = "Administrator password. Provide via TF_VAR_admin_password or a .tfvars file — never commit it."
  type        = string
  sensitive   = true
}

variable "dev_client_ip" {
  description = "Public IP allowed through the server firewall for local development. Leave empty to skip the rule."
  type        = string
  default     = ""
}

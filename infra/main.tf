# Reference an existing resource group; Terraform does not create or modify it.
data "azurerm_resource_group" "main" {
  name = var.resource_group_name
}

// Workspace-based Application Insights stores product and operational telemetry.
resource "azurerm_log_analytics_workspace" "main" {
  name                = var.log_analytics_workspace_name
  resource_group_name = data.azurerm_resource_group.main.name
  location            = var.location
  sku                 = "PerGB2018"
  retention_in_days   = var.telemetry_retention_days
  daily_quota_gb      = var.telemetry_daily_quota_gb

  tags = {
    Project     = "JauntDetour"
    Environment = var.environment
  }
}

resource "azurerm_application_insights" "main" {
  name                                 = var.application_insights_name
  resource_group_name                  = data.azurerm_resource_group.main.name
  location                             = var.location
  workspace_id                         = azurerm_log_analytics_workspace.main.id
  application_type                     = "web"
  retention_in_days                    = var.telemetry_retention_days
  daily_data_cap_in_gb                 = var.telemetry_daily_quota_gb
  daily_data_cap_notifications_enabled = true
  ip_masking_enabled                   = true
  local_authentication_enabled         = true
  sampling_percentage                  = 100

  tags = {
    Project     = "JauntDetour"
    Environment = var.environment
  }
}

# Azure Database for PostgreSQL - Flexible Server.
# Dev defaults (B1ms / Burstable / 32 GB) are covered by the 12-month free tier.
resource "azurerm_postgresql_flexible_server" "main" {
  name                = var.server_name
  resource_group_name = data.azurerm_resource_group.main.name
  location            = var.location

  version  = var.postgres_version
  sku_name = var.sku_name

  storage_mb            = var.storage_mb
  backup_retention_days = var.backup_retention_days

  administrator_login    = var.admin_login
  administrator_password = var.admin_password

  # No high availability or geo-redundant backups on the free dev tier.
  zone = "1"

  tags = {
    Project     = "JauntDetour"
    Environment = var.environment
  }

  lifecycle {
    # Azure may assign/adjust the availability zone; ignore drift to avoid noisy plans.
    ignore_changes = [zone]
  }
}

# Application database.
resource "azurerm_postgresql_flexible_server_database" "main" {
  name      = var.database_name
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"

  lifecycle {
    prevent_destroy = true
  }
}

# Allow other Azure services (e.g. the App Service / container) to reach the server.
resource "azurerm_postgresql_flexible_server_firewall_rule" "azure_services" {
  name             = "AllowAzureServices"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

# Optional: allow a single developer machine through the firewall for local testing.
resource "azurerm_postgresql_flexible_server_firewall_rule" "dev_client" {
  count            = var.dev_client_ip == "" ? 0 : 1
  name             = "AllowDevClient"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = var.dev_client_ip
  end_ip_address   = var.dev_client_ip
}

# Enforce TLS for all connections (Azure default, set explicitly for clarity).
resource "azurerm_postgresql_flexible_server_configuration" "require_ssl" {
  name      = "require_secure_transport"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "ON"
}

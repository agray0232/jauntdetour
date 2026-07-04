# Reference an existing resource group; Terraform does not create or modify it.
data "azurerm_resource_group" "main" {
  name = var.resource_group_name
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
    # Storage can only grow; ignore drift if Azure auto-grows it.
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

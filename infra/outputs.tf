output "server_fqdn" {
  description = "Fully qualified domain name of the PostgreSQL server (use as DB_HOST)."
  value       = azurerm_postgresql_flexible_server.main.fqdn
}

output "database_name" {
  description = "Name of the application database (use as DB_NAME)."
  value       = azurerm_postgresql_flexible_server_database.main.name
}

output "admin_login" {
  description = "Administrator login (use as DB_USER for the initial schema load)."
  value       = azurerm_postgresql_flexible_server.main.administrator_login
}

output "resource_group_name" {
  description = "Resource group containing the database."
  value       = data.azurerm_resource_group.main.name
}

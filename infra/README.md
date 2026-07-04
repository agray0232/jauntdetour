# JauntDetour Infrastructure (Terraform)

Infrastructure-as-Code for the JauntDetour Azure resources. Currently provisions the
**Azure Database for PostgreSQL — Flexible Server** (dev free tier) plus its database and
firewall rules.

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.5
- [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) >= 2.30, authenticated:
  ```pwsh
  az login
  az account set --subscription "<your-subscription-id>"
  ```

## Usage

```pwsh
cd infra
Copy-Item terraform.tfvars.example terraform.tfvars   # then edit values

# Provide the admin password without committing it:
$env:TF_VAR_admin_password = "<strong-password>"

terraform init
terraform validate
terraform plan
terraform apply        # type "yes" to confirm
```

After apply, read the connection details:

```pwsh
terraform output server_fqdn
terraform output database_name
```

Use those values to populate the backend `.env` (`DB_HOST`, `DB_NAME`) and apply the schema —
see [../docs/database/implementation-guide.md](../docs/database/implementation-guide.md).

## Files

| File | Purpose |
|------|---------|
| `providers.tf` | Terraform + azurerm provider versions |
| `variables.tf` | Input variables (names, SKU, storage, credentials) |
| `main.tf` | PostgreSQL server, database, firewall, TLS config (deployed into an existing resource group) |
| `outputs.tf` | Server FQDN, database name, admin login, resource group |
| `terraform.tfvars.example` | Template for your local variable values |

## Notes

- The `resource_group_name` must be an **existing** resource group. Terraform references it as a
  data source — it does not create, modify, or delete the resource group or anything else already
  in it. Only the database server, database, firewall rules, and TLS setting are created. The
  server is deployed in the resource group's region.
- `admin_password` is **sensitive** — pass it via `TF_VAR_admin_password` or a gitignored
  `terraform.tfvars`. Never commit it.
- `terraform.tfvars`, `*.tfstate`, and `.terraform/` are gitignored.
- The dev tier uses Burstable `B_Standard_B1ms`, 32 GB, 7-day backups, no HA — covered by the
  Azure 12-month free tier. Production hardening (HA, geo-redundant backups, private endpoint)
  is documented in the implementation guide and is intentionally out of scope here.

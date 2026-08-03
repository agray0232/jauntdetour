---
title: JauntDetour Infrastructure
description: Terraform setup for the JauntDetour Azure database and telemetry resources
author: JauntDetour Development Team
ms.date: 2026-08-02
ms.topic: how-to
keywords:
  - terraform
  - azure
  - postgresql
  - application insights
estimated_reading_time: 5
---

## Overview

The Terraform configuration provisions Azure Database for PostgreSQL Flexible
Server, a Log Analytics workspace, and workspace-based Application Insights.

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) 1.5 or later
- [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) 2.30 or
  later, authenticated to the target subscription

```pwsh
az login
az account set --subscription "<your-subscription-id>"
```

## Usage

```pwsh
cd infra
Copy-Item terraform.tfvars.example terraform.tfvars

# Provide the admin password without committing it.
$env:TF_VAR_admin_password = "<strong-password>"

terraform init
terraform validate
terraform plan
terraform apply
```

Read the deployment outputs after apply:

```pwsh
terraform output server_fqdn
terraform output database_name
terraform output -raw application_insights_connection_string
```

Use the database values to populate the backend environment and apply the
[database schema](../docs/database/implementation-guide.md). Set the Application
Insights connection string as:

- Backend App Service setting `APPLICATIONINSIGHTS_CONNECTION_STRING`
- GitHub Actions secret `APPLICATIONINSIGHTS_CONNECTION_STRING`, which is
  passed to the frontend image build

## Files

| File                       | Purpose                                                                      |
| -------------------------- | ---------------------------------------------------------------------------- |
| `providers.tf`             | Terraform and azurerm version constraints                                    |
| `variables.tf`             | Resource names, retention, quotas, SKU, and credentials                      |
| `main.tf`                  | PostgreSQL, Log Analytics, Application Insights, firewall, and TLS resources |
| `outputs.tf`               | Database, resource group, workspace, and telemetry outputs                   |
| `terraform.tfvars.example` | Local variable template                                                      |

## Notes

- `resource_group_name` must identify an existing resource group. Terraform
  references the group as a data source and does not manage it.
- `admin_password` is sensitive. Pass it through `TF_VAR_admin_password` or a
  gitignored `terraform.tfvars` file.
- `terraform.tfvars`, `*.tfstate`, and `.terraform/` are gitignored.
- Detailed telemetry is retained for 90 days with a default 1 GB daily cap.
- The Application Insights connection string is a sensitive Terraform output.
  The browser receives it at build time, but it is an ingestion locator rather
  than an authorization secret.
- The development database tier uses `B_Standard_B1ms`, 32 GB storage, seven-day
  backups, and no high availability. Production hardening remains documented in
  the database implementation guide.

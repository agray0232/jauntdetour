terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}

provider "azurerm" {
  features {}

  # The subscription already has resources, so its resource providers are
  # registered. Skip automatic registration, which requires subscription-level
  # permissions and otherwise stalls the plan.
  resource_provider_registrations = "none"
}

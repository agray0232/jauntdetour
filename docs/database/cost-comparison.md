# Azure Database Cost Comparison

**Purpose:** Pricing reference behind the PostgreSQL decision.
**Last Updated:** June 2, 2026

> Prices are approximate and change over time. Verify with the
> [Azure Pricing Calculator](https://azure.microsoft.com/pricing/calculator/) before committing.

---

## Summary

| Database | Free tier | Small | Medium | Large |
|----------|-----------|-------|--------|-------|
| **Azure PostgreSQL** ✅ | 12 mo free (B1ms, 32 GB) | $50–75/mo | $150–200/mo | $350–450/mo |
| Azure Cosmos DB | 1000 RU/s + 25 GB | $100–200/mo | $400–600/mo | $1000–1500/mo |
| Azure SQL Database | Serverless (auto-pause) | $75–100/mo | $200–350/mo | $500–750/mo |
| MongoDB Atlas | M0 forever (512 MB) | $60–90/mo | $150–220/mo | $350–500/mo |

PostgreSQL has the best cost-to-performance ratio at every tier.

---

## PostgreSQL configurations

| Environment | Config | Monthly |
|-------------|--------|---------|
| Development | Burstable B1ms, 32 GB, 7-day backups, no HA | **$0** (12-mo free tier) |
| Small (1–10K users) | D2s_v3, 128 GB, zone-redundant HA, geo backups | ~$152 |
| Medium (10–50K users) | D4s_v3, 256 GB, zone-redundant HA, geo backups | ~$305 |
| Large (50–200K users) | D8s_v3, 512 GB, zone-redundant HA, geo backups | ~$610 |

**Cost drivers:** compute tier, HA (~2x compute), backup retention/geo-redundancy, optional read replicas.

---

## 3-year TCO

Assumptions: Y1 = 1K users/1 GB (dev → small); Y2 = 10K users/10 GB; Y3 = 50K users/50 GB.

| Database | Year 1 | Year 2 | Year 3 | **3-Year Total** |
|----------|--------|--------|--------|------------------|
| **Azure PostgreSQL** ✅ | $0 | $1,824 | $3,660 | **$5,484** |
| MongoDB Atlas | $720 | $1,800 | $4,200 | $6,720 |
| Azure SQL Database | $900 | $3,600 | $7,080 | $11,580 |
| Azure Cosmos DB | $648 | $4,896 | $16,080 | $21,624 |

**PostgreSQL saves ~$1,236–$16,140 over 3 years** versus the alternatives.

---

## Cost optimization

- Use the 12-month **free tier** (B1ms) for development.
- Enable **HA only in production** (saves ~50% in dev/staging).
- Keep **7-day backups** in non-prod; 14–35 days in prod.
- Add **read replicas** only when read load demands it.
- Archive old data to **Azure Blob Storage**.

**Potential savings:** 40–60% in non-production environments.

---

## Hidden costs

| Category | Estimated impact |
|----------|------------------|
| Networking (private endpoints, egress) | $5–50/mo |
| Monitoring (Azure Monitor logs/alerts) | $10–50/mo |
| Long-term backup retention | varies |

---

## Verify current pricing

- [Azure PostgreSQL pricing](https://azure.microsoft.com/pricing/details/postgresql/)
- [Azure Pricing Calculator](https://azure.microsoft.com/pricing/calculator/)

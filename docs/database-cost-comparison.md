# Azure Database Cost Comparison for JauntDetour

**Last Updated:** November 16, 2025  
**Purpose:** Quick reference for database pricing across Azure options

---

## Summary Table

| Database | Free Tier | Production (Small) | Production (Medium) | Production (Large) |
|----------|-----------|-------------------|---------------------|-------------------|
| **Azure PostgreSQL** | 12 months free<br>B1ms + 32GB | $50-75/month<br>D2s_v3 + HA | $150-200/month<br>D4s_v3 + HA | $350-450/month<br>D8s_v3 + HA |
| **Azure Cosmos DB** | 1000 RU/s free<br>25 GB storage | $100-200/month<br>800-1600 RU/s | $400-600/month<br>3000-5000 RU/s | $1000-1500/month<br>10000+ RU/s |
| **Azure SQL Database** | None | $75-100/month<br>Standard S2-S3 | $200-350/month<br>Standard S6-S9 | $500-750/month<br>Premium P1-P2 |
| **MongoDB Atlas** | Forever free<br>M0 (512 MB) | $60-90/month<br>M10 cluster | $150-220/month<br>M20 cluster | $350-500/month<br>M30 cluster |

**Recommendation: Azure Database for PostgreSQL** - Best cost-to-performance ratio across all tiers.

---

## Detailed Cost Breakdown

### 1. Azure Database for PostgreSQL (Flexible Server)

#### Free Tier (Development)
- **Duration:** 12 months
- **Compute:** Burstable B1ms (1 vCore, 2 GiB RAM)
- **Storage:** 32 GB included
- **Backups:** 7 days included
- **Total:** **$0/month** for first 12 months

#### Production Configurations

**Small (1-10K users, <10 GB data)**
```
Compute: D2s_v3 (2 vCores, 8 GiB RAM)          $75/month
Storage: 128 GB                                 Included
Zone-Redundant HA: Yes                          $75/month (2x multiplier)
Geo-Redundant Backups: 14 days                  $2/month
────────────────────────────────────────────────────────
Total:                                          $152/month
```

**Medium (10-50K users, 10-50 GB data)**
```
Compute: D4s_v3 (4 vCores, 16 GiB RAM)         $150/month
Storage: 256 GB                                 Included
Zone-Redundant HA: Yes                          $150/month (2x multiplier)
Geo-Redundant Backups: 14 days                  $5/month
────────────────────────────────────────────────────────
Total:                                          $305/month
```

**Large (50-200K users, 50-200 GB data)**
```
Compute: D8s_v3 (8 vCores, 32 GiB RAM)         $300/month
Storage: 512 GB                                 Included
Zone-Redundant HA: Yes                          $300/month (2x multiplier)
Geo-Redundant Backups: 35 days                  $10/month
Read Replica (optional): 1 replica              $300/month
────────────────────────────────────────────────────────
Total (without replica):                        $610/month
Total (with 1 read replica):                    $910/month
```

**Cost Drivers:**
- ✅ Compute tier (Burstable → General Purpose → Memory Optimized)
- ✅ High Availability (2x compute cost when enabled)
- ✅ Storage (up to 16 TB, included with compute)
- ✅ Backup retention (7-35 days, geo-redundancy adds ~50%)
- ✅ Read replicas (each replica = base compute cost)

---

### 2. Azure Cosmos DB

#### Free Tier
- **Duration:** Ongoing (per subscription)
- **Throughput:** 1000 RU/s
- **Storage:** 25 GB
- **Limitations:** One per Azure subscription
- **Total:** **$0/month** (within limits)

#### Production Configurations

**Small (Provisioned Throughput)**
```
Compute: 800 RU/s                               $48/month
Storage: 25 GB                                  $6/month
Single-region, no multi-region writes
────────────────────────────────────────────────────────
Total:                                          $54/month
```

**Medium (Provisioned Throughput)**
```
Compute: 3000 RU/s                              $180/month
Storage: 100 GB                                 $24/month
Multi-region (2 regions)                        2x multiplier
────────────────────────────────────────────────────────
Total (single-region):                          $204/month
Total (multi-region):                           $408/month
```

**Large (Autoscale)**
```
Compute: 10,000 RU/s max autoscale              $590/month (avg ~40% of max)
Storage: 500 GB                                 $120/month
Multi-region (3 regions)                        3x multiplier
────────────────────────────────────────────────────────
Total (single-region):                          $710/month
Total (multi-region):                           $1,890/month
```

**Serverless (Alternative for unpredictable workloads)**
```
Pay-per-request: ~$0.25 per million RU          Varies
Storage: $0.24/GB/month                         Varies
────────────────────────────────────────────────────────
Estimated (10M RU/month, 50 GB):                $15/month
Estimated (100M RU/month, 50 GB):               $37/month
```

**Cost Drivers:**
- ⚠️ Request Units (RU/s) - complex to estimate upfront
- ⚠️ Multi-region replication (2-5x multiplier)
- ⚠️ Storage ($0.24/GB/month)
- ✅ Serverless option for unpredictable loads
- ⚠️ Can become expensive at scale

---

### 3. Azure SQL Database

#### Free Tier
- **None** (serverless has pay-per-use model, ~$0.50/hour when active)

#### Production Configurations

**Small (DTU-based - Standard Tier)**
```
Compute: S2 (50 DTUs)                           $75/month
Storage: 250 GB                                 Included
Backups: 7 days                                 Included
────────────────────────────────────────────────────────
Total:                                          $75/month
```

**Medium (DTU-based - Standard Tier)**
```
Compute: S6 (400 DTUs)                          $300/month
Storage: 250 GB                                 Included
Backups: 14 days                                Included
────────────────────────────────────────────────────────
Total:                                          $300/month
```

**Large (vCore-based - General Purpose)**
```
Compute: 8 vCores                               $900/month
Storage: 512 GB                                 $60/month
Backups: Long-term retention                    $20/month
────────────────────────────────────────────────────────
Total:                                          $980/month
```

**Hyperscale (for very large databases)**
```
Compute: 8 vCores                               $1,200/month
Storage: 1 TB                                   $120/month
Read replicas: 2 replicas @ 2 vCores each       $300/month
────────────────────────────────────────────────────────
Total:                                          $1,620/month
```

**Cost Drivers:**
- ⚠️ More expensive than PostgreSQL for similar performance
- ✅ DTU model simpler than RUs (Cosmos DB)
- ⚠️ vCore model more expensive but more predictable
- ⚠️ Additional storage costs for large databases
- ⚠️ Hyperscale option expensive but handles massive scale

---

### 4. MongoDB Atlas on Azure

#### Free Tier (M0 Shared)
- **Duration:** Forever
- **Storage:** 512 MB
- **RAM:** Shared
- **Limitations:** No backups, shared resources
- **Total:** **$0/month** (forever)

#### Production Configurations

**Small (M10 Dedicated)**
```
Compute: M10 (2 GB RAM, 10 GB storage)          $60/month
Backups: Continuous (2 days)                    Included
Single region
────────────────────────────────────────────────────────
Total:                                          $60/month
```

**Medium (M20 Dedicated)**
```
Compute: M20 (4 GB RAM, 20 GB storage)          $150/month
Backups: Continuous (7 days)                    Included
Single region
────────────────────────────────────────────────────────
Total:                                          $150/month
```

**Large (M30 Dedicated with HA)**
```
Compute: M30 (8 GB RAM, 40 GB storage)          $350/month
Backups: Continuous (14 days)                   Included
High Availability: 3-node replica set           Included
────────────────────────────────────────────────────────
Total:                                          $350/month
```

**Multi-Region (M30 Global Cluster)**
```
Base cluster: M30                               $350/month
Additional regions: 2 @ M30 each                $700/month
Cross-region network: Data transfer             $50-100/month
────────────────────────────────────────────────────────
Total:                                          $1,100-1,150/month
```

**Cost Drivers:**
- ✅ Simpler pricing than Cosmos DB
- ⚠️ Third-party service (billing through MongoDB Inc.)
- ✅ Backups included in price
- ⚠️ Multi-region more expensive than single region
- ⚠️ Additional costs for advanced features (Atlas Search, Data Lake)

---

## 3-Year Total Cost of Ownership (TCO)

### Assumptions
- **Year 1:** 1,000 users, 1 GB data, development → small production
- **Year 2:** 10,000 users, 10 GB data, medium production
- **Year 3:** 50,000 users, 50 GB data, large production

### TCO Comparison

| Database | Year 1 | Year 2 | Year 3 | **3-Year Total** |
|----------|--------|--------|--------|------------------|
| **Azure PostgreSQL** | $0 (free tier) | $1,824 ($152/mo) | $3,660 ($305/mo) | **$5,484** ✅ |
| **Azure Cosmos DB** | $648 ($54/mo) | $4,896 ($408/mo) | $16,080 ($1,340/mo) | **$21,624** |
| **Azure SQL Database** | $900 ($75/mo) | $3,600 ($300/mo) | $7,080 ($590/mo) | **$11,580** |
| **MongoDB Atlas** | $720 ($60/mo) | $1,800 ($150/mo) | $4,200 ($350/mo) | **$6,720** |

**PostgreSQL saves $1,236 - $16,140 over 3 years** compared to alternatives.

---

## Cost Optimization Strategies

### PostgreSQL Cost Optimization
1. **Start with free tier** (B1ms) for 12 months
2. **Use Burstable tier** (B2s) for development/staging ($25-50/month)
3. **Enable HA only in production** (saves 50% in dev/staging)
4. **Use 7-day backups** in dev/staging, 14-35 days in production
5. **Monitor and scale compute tier** based on actual usage
6. **Use read replicas** only when read load demands it
7. **Archive old data** to Azure Blob Storage (much cheaper)

**Potential Savings:** 40-60% in non-production environments

### Cosmos DB Cost Optimization
1. **Use serverless mode** for unpredictable, low-traffic workloads
2. **Leverage free tier** (1000 RU/s) for small apps
3. **Use autoscale** instead of provisioned throughput
4. **Optimize document design** to minimize RU consumption
5. **Use TTL** to automatically delete old data
6. **Avoid multi-region** unless absolutely necessary
7. **Monitor RU consumption** and adjust accordingly

**Potential Savings:** 30-50% with careful optimization

### SQL Database Cost Optimization
1. **Use DTU model** for predictable workloads (simpler pricing)
2. **Elastic pools** for multiple databases (share resources)
3. **Serverless tier** for intermittent workloads
4. **Scale down** during off-hours (if possible)
5. **Use Basic tier** for dev/test environments
6. **Archive to Azure SQL Data Warehouse** for historical data

**Potential Savings:** 30-40% with elastic pools and tiering

### MongoDB Atlas Cost Optimization
1. **Use M0 free tier** for development (512 MB limit)
2. **Pause/resume clusters** when not in use (M2-M5 only)
3. **Use shared tiers** (M2-M5) for staging environments
4. **Monitor storage usage** and optimize documents
5. **Avoid unnecessary indexes** (storage costs)
6. **Use Atlas Data Lake** for archival (cheaper than cluster storage)
7. **Right-size cluster tier** based on RAM/storage needs

**Potential Savings:** 25-35% with proper tier selection

---

## Hidden Costs to Consider

### Networking Costs
- **VNet Integration:** $0.01-0.05/GB for private endpoints
- **Data Transfer:** Outbound data can be $0.05-0.087/GB
- **Cross-region replication:** Data transfer between regions

**Estimated Impact:** $5-50/month depending on traffic

### Operations Costs
- **Monitoring:** Azure Monitor logs ($2-5/GB)
- **Alerts:** Included (limited), pay for advanced features
- **Backup storage:** Long-term retention adds costs
- **Developer time:** More complex databases = higher maintenance

**Estimated Impact:** $10-50/month for monitoring and ops

### Third-Party Costs
- **MongoDB Atlas:** Separate billing relationship
- **Datadog/New Relic:** If using third-party monitoring
- **Professional services:** Migration, optimization consulting

**Estimated Impact:** Varies widely

---

## Pricing Updates

Database pricing can change. Always verify current pricing:

- **Azure Pricing Calculator:** https://azure.microsoft.com/pricing/calculator/
- **Azure PostgreSQL Pricing:** https://azure.microsoft.com/pricing/details/postgresql/
- **Azure Cosmos DB Pricing:** https://azure.microsoft.com/pricing/details/cosmos-db/
- **Azure SQL Pricing:** https://azure.microsoft.com/pricing/details/sql-database/
- **MongoDB Atlas Pricing:** https://www.mongodb.com/pricing

---

## Decision Matrix

| Factor | PostgreSQL | Cosmos DB | SQL Database | MongoDB Atlas |
|--------|-----------|-----------|--------------|---------------|
| **Initial Cost** | ⭐⭐⭐⭐⭐ Free tier | ⭐⭐⭐ Free tier (limited) | ⭐⭐ No free tier | ⭐⭐⭐⭐ Free tier (forever) |
| **Production Cost** | ⭐⭐⭐⭐⭐ Lowest | ⭐⭐ Highest | ⭐⭐⭐ Moderate | ⭐⭐⭐⭐ Competitive |
| **Scaling Cost** | ⭐⭐⭐⭐ Linear | ⭐⭐ Exponential | ⭐⭐⭐ Moderate | ⭐⭐⭐ Moderate |
| **Predictability** | ⭐⭐⭐⭐⭐ Highly predictable | ⭐⭐ RU-based complexity | ⭐⭐⭐⭐ DTU/vCore clear | ⭐⭐⭐⭐ Clear tiers |
| **Total 3-Year Cost** | ⭐⭐⭐⭐⭐ $5,484 | ⭐ $21,624 | ⭐⭐⭐ $11,580 | ⭐⭐⭐⭐ $6,720 |

**Winner: Azure Database for PostgreSQL** - Best balance of cost, performance, and predictability.

---

**Recommendation:** Start with **Azure Database for PostgreSQL free tier** (B1ms) for development. Transition to **D2s_v3 with Zone-Redundant HA** for production. This provides the best cost-to-value ratio for JauntDetour's requirements.

**Estimated Total Cost:**
- **Development (12 months):** $0
- **Production Year 1:** ~$1,824/year ($152/month)
- **Production Year 2:** ~$3,660/year ($305/month)
- **3-Year TCO:** ~$5,484

**Savings vs. alternatives:** $1,236 - $16,140 over 3 years

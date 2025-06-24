import { ProviderType, HealthStatus, ProviderHealth, HealthCheckResult } from './types';

export class HealthChecker {
  private healthTable: Map<ProviderType, ProviderHealth> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;
  private intervalMs: number = 60000;

  constructor(intervalMs: number = 60000) {
    this.intervalMs = intervalMs;
    this.initializeHealthTable();
  }

  private initializeHealthTable(): void {
    const providers = [
      ProviderType.OPENAI,
      ProviderType.CLAUDE,
      ProviderType.GEMINI,
      ProviderType.AZURE
    ];

    providers.forEach((provider, index) => {
      this.healthTable.set(provider, {
        provider,
        status: HealthStatus.UNKNOWN,
        lastChecked: new Date(),
        priority: index + 1 // Default priority order
      });
    });
  }

  public updateHealth(result: HealthCheckResult): void {
    const current = this.healthTable.get(result.provider);
    if (current) {
      current.status = result.status;
      current.lastChecked = result.lastChecked;
      current.responseTime = result.responseTime;
    }
    this.reorderByHealth();
  }

  private reorderByHealth(): void {
    const healthyProviders: ProviderHealth[] = [];
    const unhealthyProviders: ProviderHealth[] = [];

    this.healthTable.forEach(health => {
      if (health.status === HealthStatus.UP) {
        healthyProviders.push(health);
      } else {
        unhealthyProviders.push(health);
      }
    });

    // Sort healthy providers by response time
    healthyProviders.sort((a, b) => (a.responseTime || 0) - (b.responseTime || 0));
    
    // Sort unhealthy providers by last successful check time
    unhealthyProviders.sort((a, b) => b.lastChecked.getTime() - a.lastChecked.getTime());

    // Reassign priorities
    let priority = 1;
    [...healthyProviders, ...unhealthyProviders].forEach(health => {
      health.priority = priority++;
      this.healthTable.set(health.provider, health);
    });
  }

  public getOrderedProviders(): ProviderType[] {
    const ordered = Array.from(this.healthTable.values())
      .sort((a, b) => a.priority - b.priority)
      .map(health => health.provider);
    
    return ordered;
  }

  public getProviderHealth(provider: ProviderType): ProviderHealth | undefined {
    return this.healthTable.get(provider);
  }

  public getAllHealth(): ProviderHealth[] {
    return Array.from(this.healthTable.values())
      .sort((a, b) => a.priority - b.priority);
  }

  public isProviderHealthy(provider: ProviderType): boolean {
    const health = this.healthTable.get(provider);
    return health?.status === HealthStatus.UP;
  }

  public startPeriodicCheck(healthCheckFn: (provider: ProviderType) => Promise<HealthCheckResult>): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(async () => {
      const providers = Object.values(ProviderType);
      
      for (const provider of providers) {
        try {
          const result = await healthCheckFn(provider);
          this.updateHealth(result);
        } catch (error) {
          this.updateHealth({
            provider,
            status: HealthStatus.DOWN,
            lastChecked: new Date(),
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }, this.intervalMs);
  }

  public stopPeriodicCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  public destroy(): void {
    this.stopPeriodicCheck();
    this.healthTable.clear();
  }
}

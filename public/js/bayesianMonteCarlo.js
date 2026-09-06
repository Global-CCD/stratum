// public/js/bayesianMonteCarlo.js - Self-Tuning Bayesian Weights & Monte Carlo Forecaster
export class BayesianMonteCarloEngine {
  /**
   * Bayesian Dynamic Weight Tuning: Adjusts weights based on historical velocity
   */
  static tuneBayesianWeights(completedTasks = [], priorImpactWeight = 0.6, priorSyncWeight = 0.4) {
    if (!completedTasks || completedTasks.length < 5) {
      return { impactWeight: priorImpactWeight, syncWeight: priorSyncWeight, posteriorConfidence: 'PRIOR_DEFAULT' };
    }

    // Measure correlation between high impact and successful completion
    const highImpactSuccessCount = completedTasks.filter(t => Number(t.impact_index) >= 7.0 && t.status === 'CLOSED').length;
    const ratio = highImpactSuccessCount / completedTasks.length;

    // Posterior update (Beta-Binomial shift)
    const tunedImpact = Math.min(0.8, Math.max(0.4, Number((priorImpactWeight * 0.5 + ratio * 0.5).toFixed(2))));
    const tunedSync = Number((1.0 - tunedImpact).toFixed(2));

    return {
      impactWeight: tunedImpact,
      syncWeight: tunedSync,
      sampleSize: completedTasks.length,
      posteriorConfidence: 'BAYESIAN_CONVERGED'
    };
  }

  /**
   * 1,000-Iteration Monte Carlo Simulation for Project Delivery Date Ranges
   */
  static runMonteCarloSimulation(remainingTasksCount, dailyVelocityMean = 2.5, dailyVelocityStdDev = 0.8, iterations = 1000) {
    if (remainingTasksCount <= 0) return { p50Days: 0, p80Days: 0, p95Days: 0, confidence: 'COMPLETE' };

    const simulatedDays = [];

    for (let i = 0; i < iterations; i++) {
      let tasksLeft = remainingTasksCount;
      let days = 0;

      while (tasksLeft > 0 && days < 365) {
        days++;
        // Box-Muller Gaussian random variable for daily velocity
        const u1 = Math.random() || 0.0001;
        const u2 = Math.random() || 0.0001;
        const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        const velocityToday = Math.max(0.2, dailyVelocityMean + z * dailyVelocityStdDev);
        tasksLeft -= velocityToday;
      }
      simulatedDays.push(days);
    }

    simulatedDays.sort((a, b) => a - b);

    const p50 = simulatedDays[Math.floor(iterations * 0.50)];
    const p80 = simulatedDays[Math.floor(iterations * 0.80)];
    const p95 = simulatedDays[Math.floor(iterations * 0.95)];

    return {
      iterations,
      p50Days: p50,
      p80Days: p80,
      p95Days: p95,
      expectedTargetDate: new Date(Date.now() + p80 * 86400000).toISOString().split('T')[0]
    };
  }
}
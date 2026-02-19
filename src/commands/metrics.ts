import { Command } from 'commander';
import { getApiMetrics, resetApiMetrics } from '../lib/client';
import { printInfo } from '../lib/output';

export function createMetricsCommand(): Command {
  const metrics = new Command('metrics')
    .description('View or reset API performance metrics')
    .addCommand(createMetricsShowCommand())
    .addCommand(createMetricsResetCommand());

  return metrics;
}

function createMetricsShowCommand(): Command {
  return new Command('show')
    .description('Show API performance metrics')
    .option('--json', 'Output as JSON')
    .option('-q, --quiet', 'Suppress non-essential output')
    .action((options?: { json?: boolean; quiet?: boolean }) => {
      const data = getApiMetrics();

      if (options?.json) {
        console.log(JSON.stringify(data, null, 2));
        return;
      }

      printInfo('API Performance Metrics', options?.quiet);
      console.log('-------------------------');
      console.log(`Total Requests:    ${data.requestCount}`);
      console.log(`Total Duration:    ${data.totalDuration}ms`);
      console.log(`Average Duration:  ${Math.round(data.averageDuration)}ms`);
      console.log(`Slowest Request:   ${data.slowestDuration}ms`);
      console.log(
        `Fastest Request:   ${data.fastestDuration === Infinity ? 'N/A' : `${data.fastestDuration}ms`}`
      );
      console.log(`Retry Count:       ${data.retryCount}`);
      console.log(`Error Count:       ${data.errorCount}`);

      if (data.requestCount > 0) {
        const successRate = ((data.requestCount - data.errorCount) / data.requestCount) * 100;
        console.log(`Success Rate:      ${successRate.toFixed(1)}%`);
      }
    });
}

function createMetricsResetCommand(): Command {
  return new Command('reset').description('Reset API performance metrics').action(() => {
    resetApiMetrics();
    console.log('✓ API metrics reset successfully!');
  });
}

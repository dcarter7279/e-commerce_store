// Test Runner - Runs all test suites
// Usage: node tests/run-all-tests.js or open run-all-tests.html

import { runProductBrowsingTests } from './product-browsing.test.js';
import { runCartFunctionalityTests } from './cart-functionality.test.js';
import { runCheckoutProcessTests } from './checkout-process.test.js';
import { runUserAccountTests } from './user-account.test.js';
import { runPaymentProcessingTests } from './payment-processing.test.js';
import { runE2ETests } from './e2e.test.js';

/**
 * Run all test suites
 */
async function runAllTests() {
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('  E-COMMERCE SITE TEST SUITE');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n');

    const startTime = Date.now();
    const results = {
        suites: [],
        totalTests: 0,
        totalPassed: 0,
        totalFailed: 0,
        totalSkipped: 0,
        duration: 0
    };

    // Product Browsing Tests
    try {
        const productResults = await runProductBrowsingTests();
        results.suites.push({ name: 'Product Browsing', ...productResults });
        results.totalTests += productResults.total;
        results.totalPassed += productResults.passed;
        results.totalFailed += productResults.failed;
        results.totalSkipped += productResults.skipped;
    } catch (error) {
        console.error('Product Browsing Tests failed to run:', error);
    }

    console.log('\n---\n');

    // Cart Functionality Tests
    try {
        const cartResults = await runCartFunctionalityTests();
        results.suites.push({ name: 'Cart Functionality', ...cartResults });
        results.totalTests += cartResults.total;
        results.totalPassed += cartResults.passed;
        results.totalFailed += cartResults.failed;
        results.totalSkipped += cartResults.skipped;
    } catch (error) {
        console.error('Cart Functionality Tests failed to run:', error);
    }

    console.log('\n---\n');

    // Checkout Process Tests
    try {
        const checkoutResults = await runCheckoutProcessTests();
        results.suites.push({ name: 'Checkout Process', ...checkoutResults });
        results.totalTests += checkoutResults.total;
        results.totalPassed += checkoutResults.passed;
        results.totalFailed += checkoutResults.failed;
        results.totalSkipped += checkoutResults.skipped;
    } catch (error) {
        console.error('Checkout Process Tests failed to run:', error);
    }

    console.log('\n---\n');

    // User Account Tests
    try {
        const accountResults = await runUserAccountTests();
        results.suites.push({ name: 'User Account', ...accountResults });
        results.totalTests += accountResults.total;
        results.totalPassed += accountResults.passed;
        results.totalFailed += accountResults.failed;
        results.totalSkipped += accountResults.skipped;
    } catch (error) {
        console.error('User Account Tests failed to run:', error);
    }

    console.log('\n---\n');

    // Payment Processing Tests
    try {
        const paymentResults = await runPaymentProcessingTests();
        results.suites.push({ name: 'Payment Processing', ...paymentResults });
        results.totalTests += paymentResults.total;
        results.totalPassed += paymentResults.passed;
        results.totalFailed += paymentResults.failed;
        results.totalSkipped += paymentResults.skipped;
    } catch (error) {
        console.error('Payment Processing Tests failed to run:', error);
    }

    console.log('\n---\n');

    // End-to-End Tests
    try {
        const e2eResults = await runE2ETests();
        results.suites.push({ name: 'End-to-End', ...e2eResults });
        results.totalTests += e2eResults.total;
        results.totalPassed += e2eResults.passed;
        results.totalFailed += e2eResults.failed;
        results.totalSkipped += e2eResults.skipped;
    } catch (error) {
        console.error('End-to-End Tests failed to run:', error);
    }

    results.duration = Date.now() - startTime;

    // Print summary
    printSummary(results);

    return results;
}

/**
 * Print test summary
 */
function printSummary(results) {
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('  OVERALL TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n');

    // Suite breakdown
    console.log('📋 Test Suites:\n');
    results.suites.forEach(suite => {
        const status = suite.failed === 0 ? '✅' : '❌';
        const passRate = ((suite.passed / suite.total) * 100).toFixed(1);
        console.log(`${status} ${suite.name.padEnd(25)} ${suite.passed}/${suite.total} (${passRate}%)`);
    });

    console.log('\n');

    // Overall stats
    console.log('📊 Overall Statistics:\n');
    console.log(`Total Test Suites:  ${results.suites.length}`);
    console.log(`Total Tests:        ${results.totalTests}`);
    console.log(`✅ Passed:          ${results.totalPassed}`);
    console.log(`❌ Failed:          ${results.totalFailed}`);
    console.log(`⏭️  Skipped:         ${results.totalSkipped}`);
    console.log(`⏱️  Total Duration:  ${results.duration}ms`);

    const overallPassRate = ((results.totalPassed / results.totalTests) * 100).toFixed(2);
    console.log(`\n📈 Overall Pass Rate: ${overallPassRate}%`);

    console.log('\n');

    // Final result
    if (results.totalFailed === 0) {
        console.log('🎉 ALL TESTS PASSED! 🎉');
        console.log('\n');
        console.log('Your e-commerce site is ready for production!');
    } else {
        console.log('❌ SOME TESTS FAILED');
        console.log('\n');
        console.log(`Please review the ${results.totalFailed} failed test(s) above.`);
    }

    console.log('\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n');
}

/**
 * Export results to JSON
 */
function exportResults(results, filename = 'test-results.json') {
    const json = JSON.stringify(results, null, 2);

    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        // Node.js environment
        const fs = require('fs');
        fs.writeFileSync(filename, json);
        console.log(`\n📄 Results exported to ${filename}`);
    } else {
        // Browser environment
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        console.log(`\n📄 Results exported to ${filename}`);
    }
}

/**
 * Generate HTML report
 */
function generateHTMLReport(results) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Results - E-Commerce Site</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            padding: 2rem;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
        }

        h1 {
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }

        .summary {
            padding: 2rem;
            border-bottom: 1px solid #eee;
        }

        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }

        .stat {
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 4px;
            text-align: center;
        }

        .stat-value {
            font-size: 2rem;
            font-weight: bold;
            color: #333;
        }

        .stat-label {
            font-size: 0.875rem;
            color: #666;
            margin-top: 0.25rem;
        }

        .suites {
            padding: 2rem;
        }

        .suite {
            margin-bottom: 1.5rem;
            border: 1px solid #eee;
            border-radius: 4px;
            overflow: hidden;
        }

        .suite-header {
            padding: 1rem;
            background: #f8f9fa;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .suite-name {
            font-weight: 600;
            font-size: 1.125rem;
        }

        .suite-stats {
            display: flex;
            gap: 1rem;
            font-size: 0.875rem;
        }

        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }

        .pass-rate {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 600;
        }

        .pass-rate.good { background: #d4edda; color: #155724; }
        .pass-rate.warning { background: #fff3cd; color: #856404; }
        .pass-rate.bad { background: #f8d7da; color: #721c24; }

        .overall-result {
            padding: 2rem;
            text-align: center;
            font-size: 1.5rem;
            font-weight: bold;
        }

        .overall-result.success {
            background: #d4edda;
            color: #155724;
        }

        .overall-result.failure {
            background: #f8d7da;
            color: #721c24;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🧪 Test Results</h1>
            <p>E-Commerce Site Comprehensive Test Suite</p>
        </header>

        <div class="summary">
            <h2>Summary</h2>
            <div class="stats">
                <div class="stat">
                    <div class="stat-value">${results.totalTests}</div>
                    <div class="stat-label">Total Tests</div>
                </div>
                <div class="stat">
                    <div class="stat-value passed">${results.totalPassed}</div>
                    <div class="stat-label">Passed</div>
                </div>
                <div class="stat">
                    <div class="stat-value failed">${results.totalFailed}</div>
                    <div class="stat-label">Failed</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${results.duration}ms</div>
                    <div class="stat-label">Duration</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${((results.totalPassed / results.totalTests) * 100).toFixed(1)}%</div>
                    <div class="stat-label">Pass Rate</div>
                </div>
            </div>
        </div>

        <div class="suites">
            <h2>Test Suites</h2>
            ${results.suites.map(suite => {
                const passRate = ((suite.passed / suite.total) * 100).toFixed(1);
                const rateClass = passRate >= 90 ? 'good' : passRate >= 70 ? 'warning' : 'bad';

                return `
                <div class="suite">
                    <div class="suite-header">
                        <div class="suite-name">
                            ${suite.failed === 0 ? '✅' : '❌'} ${suite.name}
                        </div>
                        <div class="suite-stats">
                            <span class="passed">✓ ${suite.passed}</span>
                            <span class="failed">✗ ${suite.failed}</span>
                            <span class="pass-rate ${rateClass}">${passRate}%</span>
                        </div>
                    </div>
                </div>
                `;
            }).join('')}
        </div>

        <div class="overall-result ${results.totalFailed === 0 ? 'success' : 'failure'}">
            ${results.totalFailed === 0 ? '🎉 All Tests Passed!' : '❌ Some Tests Failed'}
        </div>
    </div>
</body>
</html>
    `;

    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        const fs = require('fs');
        fs.writeFileSync('test-report.html', html);
        console.log('📄 HTML report generated: test-report.html');
    } else {
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'test-report.html';
        a.click();
        URL.revokeObjectURL(url);
        console.log('📄 HTML report generated');
    }
}

// Run tests and generate reports
runAllTests().then(results => {
    // Export results
    exportResults(results);

    // Generate HTML report
    generateHTMLReport(results);

    // Exit with appropriate code for CI/CD
    if (typeof process !== 'undefined' && process.exit) {
        process.exit(results.totalFailed === 0 ? 0 : 1);
    }
}).catch(error => {
    console.error('Test suite failed to run:', error);
    if (typeof process !== 'undefined' && process.exit) {
        process.exit(1);
    }
});

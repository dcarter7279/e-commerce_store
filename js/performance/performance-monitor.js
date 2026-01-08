// Performance Monitoring Module
// Tracks and reports performance metrics

/**
 * Core Web Vitals Monitor
 * Tracks LCP, FID, CLS, FCP, TTFB
 */
export class WebVitalsMonitor {
    constructor(options = {}) {
        this.options = {
            reportInterval: options.reportInterval || 30000,
            endpoint: options.endpoint || null,
            onReport: options.onReport || null,
            ...options
        };

        this.metrics = {
            lcp: null,      // Largest Contentful Paint
            fid: null,      // First Input Delay
            cls: null,      // Cumulative Layout Shift
            fcp: null,      // First Contentful Paint
            ttfb: null      // Time to First Byte
        };

        this.init();
    }

    init() {
        this.measureTTFB();
        this.measureFCP();
        this.measureLCP();
        this.measureFID();
        this.measureCLS();

        // Report metrics when page becomes hidden
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.report();
            }
        });

        // Periodic reporting
        if (this.options.reportInterval) {
            setInterval(() => this.report(), this.options.reportInterval);
        }
    }

    /**
     * Measure Time to First Byte
     */
    measureTTFB() {
        if (!('performance' in window)) return;

        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
            this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
        }
    }

    /**
     * Measure First Contentful Paint
     */
    measureFCP() {
        if (!('PerformanceObserver' in window)) return;

        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();

                for (const entry of entries) {
                    if (entry.name === 'first-contentful-paint') {
                        this.metrics.fcp = entry.startTime;
                        observer.disconnect();
                    }
                }
            });

            observer.observe({ entryTypes: ['paint'] });
        } catch (error) {
            console.error('FCP measurement error:', error);
        }
    }

    /**
     * Measure Largest Contentful Paint
     */
    measureLCP() {
        if (!('PerformanceObserver' in window)) return;

        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];

                this.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
            });

            observer.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (error) {
            console.error('LCP measurement error:', error);
        }
    }

    /**
     * Measure First Input Delay
     */
    measureFID() {
        if (!('PerformanceObserver' in window)) return;

        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();

                for (const entry of entries) {
                    this.metrics.fid = entry.processingStart - entry.startTime;
                    observer.disconnect();
                }
            });

            observer.observe({ entryTypes: ['first-input'] });
        } catch (error) {
            console.error('FID measurement error:', error);
        }
    }

    /**
     * Measure Cumulative Layout Shift
     */
    measureCLS() {
        if (!('PerformanceObserver' in window)) return;

        let clsValue = 0;

        try {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                        this.metrics.cls = clsValue;
                    }
                }
            });

            observer.observe({ entryTypes: ['layout-shift'] });
        } catch (error) {
            console.error('CLS measurement error:', error);
        }
    }

    /**
     * Get all metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }

    /**
     * Report metrics
     */
    report() {
        const metrics = this.getMetrics();

        // Call callback if provided
        if (this.options.onReport) {
            this.options.onReport(metrics);
        }

        // Send to endpoint if provided
        if (this.options.endpoint) {
            this.sendMetrics(metrics);
        }

        return metrics;
    }

    /**
     * Send metrics to server
     */
    async sendMetrics(metrics) {
        try {
            await fetch(this.options.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    metrics,
                    url: window.location.href,
                    userAgent: navigator.userAgent,
                    timestamp: Date.now()
                })
            });
        } catch (error) {
            console.error('Failed to send metrics:', error);
        }
    }

    /**
     * Check if metrics meet thresholds
     * Based on Google's Web Vitals thresholds
     */
    getScores() {
        const scores = {};

        // LCP: Good < 2.5s, Needs Improvement < 4s, Poor >= 4s
        if (this.metrics.lcp !== null) {
            scores.lcp = this.metrics.lcp < 2500 ? 'good' :
                         this.metrics.lcp < 4000 ? 'needs-improvement' : 'poor';
        }

        // FID: Good < 100ms, Needs Improvement < 300ms, Poor >= 300ms
        if (this.metrics.fid !== null) {
            scores.fid = this.metrics.fid < 100 ? 'good' :
                         this.metrics.fid < 300 ? 'needs-improvement' : 'poor';
        }

        // CLS: Good < 0.1, Needs Improvement < 0.25, Poor >= 0.25
        if (this.metrics.cls !== null) {
            scores.cls = this.metrics.cls < 0.1 ? 'good' :
                         this.metrics.cls < 0.25 ? 'needs-improvement' : 'poor';
        }

        // FCP: Good < 1.8s, Needs Improvement < 3s, Poor >= 3s
        if (this.metrics.fcp !== null) {
            scores.fcp = this.metrics.fcp < 1800 ? 'good' :
                         this.metrics.fcp < 3000 ? 'needs-improvement' : 'poor';
        }

        // TTFB: Good < 800ms, Needs Improvement < 1800ms, Poor >= 1800ms
        if (this.metrics.ttfb !== null) {
            scores.ttfb = this.metrics.ttfb < 800 ? 'good' :
                          this.metrics.ttfb < 1800 ? 'needs-improvement' : 'poor';
        }

        return scores;
    }
}

/**
 * Resource Timing Monitor
 * Tracks resource load times
 */
export class ResourceMonitor {
    constructor() {
        this.resources = [];
    }

    /**
     * Collect resource timing data
     */
    collect() {
        if (!('performance' in window)) return [];

        const resources = performance.getEntriesByType('resource');

        this.resources = resources.map(resource => ({
            name: resource.name,
            type: this.getResourceType(resource),
            duration: resource.duration,
            size: resource.transferSize || 0,
            cached: resource.transferSize === 0 && resource.decodedBodySize > 0,
            startTime: resource.startTime,
            responseEnd: resource.responseEnd
        }));

        return this.resources;
    }

    getResourceType(resource) {
        const name = resource.name.toLowerCase();

        if (resource.initiatorType) {
            return resource.initiatorType;
        }

        if (name.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)(\?|$)/)) return 'image';
        if (name.match(/\.(css)(\?|$)/)) return 'css';
        if (name.match(/\.(js)(\?|$)/)) return 'script';
        if (name.match(/\.(woff|woff2|ttf|otf|eot)(\?|$)/)) return 'font';

        return 'other';
    }

    /**
     * Get resource statistics
     */
    getStats() {
        if (this.resources.length === 0) {
            this.collect();
        }

        const byType = {};
        let totalSize = 0;
        let totalDuration = 0;
        let cached = 0;

        this.resources.forEach(resource => {
            if (!byType[resource.type]) {
                byType[resource.type] = {
                    count: 0,
                    size: 0,
                    duration: 0
                };
            }

            byType[resource.type].count++;
            byType[resource.type].size += resource.size;
            byType[resource.type].duration += resource.duration;

            totalSize += resource.size;
            totalDuration += resource.duration;

            if (resource.cached) cached++;
        });

        return {
            total: this.resources.length,
            totalSize,
            totalDuration,
            cached,
            cacheRate: (cached / this.resources.length) * 100,
            byType
        };
    }

    /**
     * Find slow resources
     */
    findSlowResources(threshold = 1000) {
        if (this.resources.length === 0) {
            this.collect();
        }

        return this.resources
            .filter(r => r.duration > threshold)
            .sort((a, b) => b.duration - a.duration);
    }

    /**
     * Find large resources
     */
    findLargeResources(threshold = 100000) {
        if (this.resources.length === 0) {
            this.collect();
        }

        return this.resources
            .filter(r => r.size > threshold)
            .sort((a, b) => b.size - a.size);
    }
}

/**
 * Page Load Monitor
 * Tracks page load performance
 */
export class PageLoadMonitor {
    constructor() {
        this.timing = null;
        this.navigation = null;
    }

    /**
     * Collect page load metrics
     */
    collect() {
        if (!('performance' in window)) return null;

        this.timing = performance.timing;
        this.navigation = performance.navigation;

        return this.getMetrics();
    }

    /**
     * Get page load metrics
     */
    getMetrics() {
        if (!this.timing) {
            this.collect();
        }

        if (!this.timing) return null;

        return {
            // Network
            dns: this.timing.domainLookupEnd - this.timing.domainLookupStart,
            tcp: this.timing.connectEnd - this.timing.connectStart,
            request: this.timing.responseStart - this.timing.requestStart,
            response: this.timing.responseEnd - this.timing.responseStart,

            // Processing
            domProcessing: this.timing.domComplete - this.timing.domLoading,
            domContentLoaded: this.timing.domContentLoadedEventEnd - this.timing.navigationStart,

            // Loading
            pageLoad: this.timing.loadEventEnd - this.timing.navigationStart,

            // Total
            totalTime: this.timing.loadEventEnd - this.timing.fetchStart,

            // Navigation type
            navigationType: this.getNavigationType()
        };
    }

    getNavigationType() {
        if (!this.navigation) return 'unknown';

        switch (this.navigation.type) {
            case 0: return 'navigate';
            case 1: return 'reload';
            case 2: return 'back_forward';
            default: return 'unknown';
        }
    }
}

/**
 * Frame Rate Monitor
 * Tracks rendering performance (FPS)
 */
export class FrameRateMonitor {
    constructor() {
        this.frames = [];
        this.running = false;
        this.rafId = null;
    }

    /**
     * Start monitoring
     */
    start() {
        if (this.running) return;

        this.running = true;
        this.frames = [];
        this.lastTime = performance.now();
        this.measure();
    }

    measure() {
        if (!this.running) return;

        const currentTime = performance.now();
        const delta = currentTime - this.lastTime;

        if (delta > 0) {
            this.frames.push(1000 / delta); // Convert to FPS

            // Keep last 60 frames
            if (this.frames.length > 60) {
                this.frames.shift();
            }
        }

        this.lastTime = currentTime;
        this.rafId = requestAnimationFrame(() => this.measure());
    }

    /**
     * Stop monitoring
     */
    stop() {
        this.running = false;

        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }
    }

    /**
     * Get current FPS
     */
    getFPS() {
        if (this.frames.length === 0) return 0;

        const sum = this.frames.reduce((a, b) => a + b, 0);
        return Math.round(sum / this.frames.length);
    }

    /**
     * Get FPS statistics
     */
    getStats() {
        if (this.frames.length === 0) {
            return { avg: 0, min: 0, max: 0 };
        }

        const avg = this.frames.reduce((a, b) => a + b, 0) / this.frames.length;
        const min = Math.min(...this.frames);
        const max = Math.max(...this.frames);

        return {
            avg: Math.round(avg),
            min: Math.round(min),
            max: Math.round(max)
        };
    }
}

/**
 * Memory Monitor
 * Tracks memory usage (if available)
 */
export class MemoryMonitor {
    constructor() {
        this.supported = 'memory' in performance;
    }

    /**
     * Get current memory usage
     */
    getUsage() {
        if (!this.supported) {
            return null;
        }

        const memory = performance.memory;

        return {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit,
            usage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        };
    }

    /**
     * Check if approaching memory limit
     */
    isHighUsage(threshold = 80) {
        const usage = this.getUsage();

        if (!usage) return false;

        return usage.usage > threshold;
    }
}

/**
 * Performance Budget Checker
 * Validates performance against budgets
 */
export class PerformanceBudget {
    constructor(budgets = {}) {
        this.budgets = {
            lcp: 2500,
            fid: 100,
            cls: 0.1,
            fcp: 1800,
            ttfb: 800,
            totalSize: 500000,  // 500KB
            imageSize: 200000,  // 200KB
            scriptSize: 150000, // 150KB
            styleSize: 50000,   // 50KB
            ...budgets
        };

        this.violations = [];
    }

    /**
     * Check if budgets are met
     */
    async check() {
        this.violations = [];

        // Check Web Vitals
        const vitalsMonitor = new WebVitalsMonitor();
        const vitals = vitalsMonitor.getMetrics();

        Object.entries(vitals).forEach(([metric, value]) => {
            if (value !== null && this.budgets[metric] && value > this.budgets[metric]) {
                this.violations.push({
                    type: 'webvital',
                    metric,
                    value,
                    budget: this.budgets[metric],
                    excess: value - this.budgets[metric]
                });
            }
        });

        // Check Resource Sizes
        const resourceMonitor = new ResourceMonitor();
        const stats = resourceMonitor.getStats();

        if (stats.totalSize > this.budgets.totalSize) {
            this.violations.push({
                type: 'size',
                metric: 'totalSize',
                value: stats.totalSize,
                budget: this.budgets.totalSize,
                excess: stats.totalSize - this.budgets.totalSize
            });
        }

        Object.entries(stats.byType).forEach(([type, data]) => {
            const budgetKey = `${type}Size`;

            if (this.budgets[budgetKey] && data.size > this.budgets[budgetKey]) {
                this.violations.push({
                    type: 'size',
                    metric: budgetKey,
                    value: data.size,
                    budget: this.budgets[budgetKey],
                    excess: data.size - this.budgets[budgetKey]
                });
            }
        });

        return {
            passed: this.violations.length === 0,
            violations: this.violations
        };
    }

    /**
     * Generate report
     */
    generateReport() {
        if (this.violations.length === 0) {
            return 'All performance budgets met! 🎉';
        }

        let report = `Performance Budget Violations (${this.violations.length}):\n\n`;

        this.violations.forEach((v, i) => {
            report += `${i + 1}. ${v.metric}\n`;
            report += `   Value: ${this.formatValue(v.metric, v.value)}\n`;
            report += `   Budget: ${this.formatValue(v.metric, v.budget)}\n`;
            report += `   Excess: ${this.formatValue(v.metric, v.excess)}\n\n`;
        });

        return report;
    }

    formatValue(metric, value) {
        if (metric.includes('Size')) {
            return `${(value / 1024).toFixed(2)} KB`;
        }

        if (metric === 'cls') {
            return value.toFixed(3);
        }

        return `${value.toFixed(0)} ms`;
    }
}

// Export singleton instances
export const webVitals = new WebVitalsMonitor();
export const resourceMonitor = new ResourceMonitor();
export const pageLoadMonitor = new PageLoadMonitor();
export const fpsMonitor = new FrameRateMonitor();
export const memoryMonitor = new MemoryMonitor();

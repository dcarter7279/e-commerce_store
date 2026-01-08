// Custom Analytics Provider
// Sends analytics data to custom endpoint

export class CustomAnalyticsProvider {
    constructor(config) {
        this.config = {
            endpoint: config.endpoint || '/api/analytics',
            batchSize: config.batchSize || 10,
            flushInterval: config.flushInterval || 5000,
            debug: config.debug || false,
            ...config
        };

        this.queue = [];
        this.ready = false;
        this.flushTimer = null;
    }

    /**
     * Initialize custom analytics
     */
    async init() {
        this.ready = true;

        // Start flush timer
        this.startFlushTimer();

        // Flush on page unload
        window.addEventListener('beforeunload', () => {
            this.flush(true);  // Synchronous flush
        });

        this.log('Custom Analytics initialized');
    }

    /**
     * Track event
     */
    track(event) {
        if (!this.ready) {
            console.warn('[Custom Analytics] Not initialized');
            return;
        }

        // Add to queue
        this.queue.push({
            ...event,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            screen: {
                width: window.screen.width,
                height: window.screen.height
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        });

        this.log('Event queued:', event.name);

        // Flush if batch size reached
        if (this.queue.length >= this.config.batchSize) {
            this.flush();
        }
    }

    /**
     * Set user ID
     */
    setUserId(userId) {
        if (!this.ready) return;

        this.track({
            name: 'user_identified',
            properties: { userId }
        });

        this.log('User ID set:', userId);
    }

    /**
     * Set user properties
     */
    setUserProperties(properties) {
        if (!this.ready) return;

        this.track({
            name: 'user_properties_updated',
            properties
        });

        this.log('User properties set:', properties);
    }

    /**
     * Flush events to server
     */
    async flush(sync = false) {
        if (this.queue.length === 0) return;

        const events = [...this.queue];
        this.queue = [];

        const payload = {
            events,
            session: {
                id: this.getSessionId(),
                timestamp: Date.now()
            }
        };

        try {
            if (sync) {
                // Use sendBeacon for synchronous sending on unload
                const blob = new Blob([JSON.stringify(payload)], {
                    type: 'application/json'
                });
                navigator.sendBeacon(this.config.endpoint, blob);
            } else {
                // Use fetch for async sending
                await fetch(this.config.endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload),
                    keepalive: true
                });
            }

            this.log(`Flushed ${events.length} events`);
        } catch (error) {
            console.error('[Custom Analytics] Failed to send events:', error);

            // Re-queue events on error
            this.queue.unshift(...events);
        }
    }

    /**
     * Start flush timer
     */
    startFlushTimer() {
        this.flushTimer = setInterval(() => {
            this.flush();
        }, this.config.flushInterval);
    }

    /**
     * Stop flush timer
     */
    stopFlushTimer() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }
    }

    /**
     * Get or generate session ID
     */
    getSessionId() {
        let sessionId = sessionStorage.getItem('analytics_session_id');

        if (!sessionId) {
            sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem('analytics_session_id', sessionId);
        }

        return sessionId;
    }

    /**
     * Debug logging
     */
    log(...args) {
        if (this.config.debug) {
            console.log('[Custom Analytics]', ...args);
        }
    }
}

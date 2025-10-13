import React, { useState, useEffect } from 'react';
import { RefreshCw, Database, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import api from '../api';

function CacheTestComponent() {
  const [testResults, setTestResults] = useState([]);
  const [isTesting, setIsTesting] = useState(false);
  const [cacheStats, setCacheStats] = useState(null);

  const runCacheTests = async () => {
    setIsTesting(true);
    const results = [];

    try {
      // Test 1: First Request (Should be slow - cache miss)
      console.log('🧪 Test 1: First Request (Cache Miss)');
      const startTime1 = performance.now();
      const response1 = await api.get('/benefits-lists');
      const endTime1 = performance.now();
      const time1 = endTime1 - startTime1;
      
      results.push({
        test: 'First Request',
        time: time1,
        cached: false,
        status: 'Cache Miss',
        description: 'Initial request - should be slower'
      });

      // Wait a bit for cache to be set
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Test 2: Second Request (Should be fast - cache hit)
      console.log('🧪 Test 2: Second Request (Cache Hit)');
      const startTime2 = performance.now();
      const response2 = await api.get('/benefits-lists');
      const endTime2 = performance.now();
      const time2 = endTime2 - startTime2;
      
      const isCached = time2 < time1 * 0.7; // Assume cached if 70% faster
      results.push({
        test: 'Second Request',
        time: time2,
        cached: isCached,
        status: isCached ? 'Cache Hit' : 'Possible Cache Miss',
        description: `Subsequent request - should be faster (${((time1 - time2) / time1 * 100).toFixed(1)}% ${time2 < time1 ? 'faster' : 'slower'})`
      });

      // Test 3: Multiple rapid requests
      console.log('🧪 Test 3: Rapid Requests');
      const rapidTimes = [];
      for (let i = 0; i < 3; i++) {
        const start = performance.now();
        await api.get('/benefits-lists');
        const end = performance.now();
        rapidTimes.push(end - start);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const avgRapidTime = rapidTimes.reduce((a, b) => a + b, 0) / rapidTimes.length;
      const consistentPerformance = Math.max(...rapidTimes) / Math.min(...rapidTimes) < 2;
      
      results.push({
        test: 'Rapid Requests',
        time: avgRapidTime,
        cached: consistentPerformance && avgRapidTime < time1 * 0.8,
        status: consistentPerformance ? 'Consistent (Cached)' : 'Inconsistent',
        description: `3 rapid requests - ${consistentPerformance ? 'stable performance' : 'varying performance'}`
      });

    } catch (error) {
      console.error('Cache test failed:', error);
      results.push({
        test: 'Error',
        time: 0,
        cached: false,
        status: 'Failed',
        description: 'Test execution failed'
      });
    }

    setTestResults(results);
    setIsTesting(false);
  };

  const getCacheStats = async () => {
    try {
      // You'll need to create this endpoint in your Laravel backend
      const response = await api.get('/api/cache-stats');
      setCacheStats(response.data);
    } catch (error) {
      console.log('Cache stats endpoint not available');
    }
  };

  const clearCache = async () => {
    try {
      await api.post('/api/clear-cache');
      setTestResults([]);
      setCacheStats(null);
      console.log('Cache cleared');
    } catch (error) {
      console.log('Cache clear endpoint not available');
    }
  };

  useEffect(() => {
    getCacheStats();
  }, []);

  const getPerformanceColor = (time, baseline = 200) => {
    if (time < baseline * 0.5) return 'text-green-600';
    if (time < baseline) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          Cache Performance Test
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={clearCache}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            Clear Cache
          </button>
          <button
            onClick={getCacheStats}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Refresh Stats
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {testResults.filter(r => r.cached).length}
          </div>
          <div className="text-sm text-blue-600">Cache Hits</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {testResults.length > 0 ? testResults[0]?.time.toFixed(0) : '0'}ms
          </div>
          <div className="text-sm text-green-600">First Load</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {testResults.length > 1 ? testResults[1]?.time.toFixed(0) : '0'}ms
          </div>
          <div className="text-sm text-purple-600">Cached Load</div>
        </div>
      </div>

      <button
        onClick={runCacheTests}
        disabled={isTesting}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
      >
        <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
        {isTesting ? 'Running Cache Tests...' : 'Run Comprehensive Cache Tests'}
      </button>

      {cacheStats && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-700 mb-2">Cache Statistics</h4>
          <pre className="text-sm text-gray-600 overflow-x-auto">
            {JSON.stringify(cacheStats, null, 2)}
          </pre>
        </div>
      )}

      {testResults.length > 0 && (
        <div className="mt-6">
          <h4 className="font-semibold text-gray-700 mb-3">Test Results</h4>
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg border ${
                  result.cached 
                    ? 'bg-green-50 border-green-200' 
                    : result.status === 'Failed'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {result.cached ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : result.status === 'Failed' ? (
                      <XCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{result.test}</div>
                      <div className="text-sm text-gray-600">{result.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className={getPerformanceColor(result.time)}>
                      {result.time.toFixed(2)}ms
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-500 font-medium">{result.status}</div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h5 className="font-semibold text-blue-900 mb-2">Cache Test Summary</h5>
            <div className="text-sm text-blue-800">
              {testResults.filter(r => r.cached).length >= 2 ? (
                <p>✅ Cache is working correctly! Subsequent requests are significantly faster.</p>
              ) : (
                <p>⚠️ Cache may not be working optimally. Check backend configuration.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CacheTestComponent;
const { performance } = require('perf_hooks');

const BASE_URL = process.env.API_URL || 'http://localhost:5001';

async function runBenchmark() {
  console.log('========================================================');
  console.log('⚡ Practical 9: In-Memory Caching & Performance Benchmark');
  console.log('========================================================\n');

  // Step 1: Register / Login a benchmark test user
  const testEmail = `bench_${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  console.log(`1. Authenticating test user: ${testEmail}...`);
  const regRes = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPassword })
  });
  const regData = await regRes.json();
  const token = regData.token;

  if (!token) {
    console.error('Failed to obtain authentication token:', regData);
    process.exit(1);
  }
  console.log('   Authenticated successfully. Token acquired.\n');

  // Step 2: Seed sample tasks to create realistic database query workload
  console.log('2. Seeding 5 sample task documents in MongoDB...');
  for (let i = 1; i <= 5; i++) {
    await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: `Benchmark Task #${i}`,
        description: `Workload seed description for performance measurement sample ${i}`,
        priority: i % 2 === 0 ? 'high' : 'medium'
      })
    });
  }
  console.log('   Tasks seeded successfully.\n');

  // Step 3: Measure 3 UNCACHED requests (flushing cache before each run)
  console.log('3. Measuring UNCACHED requests (flushing cache before each call)...');
  const uncachedReadings = [];

  for (let i = 1; i <= 3; i++) {
    // Flush cache so next request is guaranteed a MISS
    await fetch(`${BASE_URL}/cache-flush`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const start = performance.now();
    const res = await fetch(`${BASE_URL}/tasks`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const duration = performance.now() - start;
    const cacheHeader = res.headers.get('x-cache') || 'UNKNOWN';
    const data = await res.json();

    uncachedReadings.push({
      sample: i,
      timeMs: parseFloat(duration.toFixed(2)),
      status: res.status,
      cacheHeader,
      itemCount: data.length
    });

    console.log(`   Sample #${i} (Uncached): ${duration.toFixed(2)} ms [Header: X-Cache: ${cacheHeader}]`);
  }

  // Step 4: Measure 3 CACHED requests (consecutive calls on warm cache)
  console.log('\n4. Measuring CACHED requests (consecutive calls against in-memory cache)...');
  const cachedReadings = [];

  for (let i = 1; i <= 3; i++) {
    const start = performance.now();
    const res = await fetch(`${BASE_URL}/tasks`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const duration = performance.now() - start;
    const cacheHeader = res.headers.get('x-cache') || 'UNKNOWN';
    const data = await res.json();

    cachedReadings.push({
      sample: i,
      timeMs: parseFloat(duration.toFixed(2)),
      status: res.status,
      cacheHeader,
      itemCount: data.length
    });

    console.log(`   Sample #${i} (Cached):   ${duration.toFixed(2)} ms [Header: X-Cache: ${cacheHeader}]`);
  }

  // Step 5: Test Cache Invalidation on Mutation
  console.log('\n5. Testing Cache Invalidation on Mutation (POST /tasks)...');
  const createRes = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'New Mutation Task',
      description: 'Verifying cache eviction occurs',
      priority: 'high'
    })
  });
  console.log('   Created new task. Cache for user should now be evicted.');

  const verifyStart = performance.now();
  const verifyRes = await fetch(`${BASE_URL}/tasks`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const verifyDuration = performance.now() - verifyStart;
  const verifyCacheHeader = verifyRes.headers.get('x-cache');
  const verifyData = await verifyRes.json();
  console.log(`   Post-invalidation fetch took ${verifyDuration.toFixed(2)} ms [Header: X-Cache: ${verifyCacheHeader}] (Items: ${verifyData.length})`);

  // Step 6: Fetch cache telemetry from /cache-stats
  console.log('\n6. Fetching Cache Telemetry (/cache-stats)...');
  const statsRes = await fetch(`${BASE_URL}/cache-stats`);
  const statsData = await statsRes.json();
  console.log('   Telemetry:', JSON.stringify(statsData.data, null, 2));

  // Compute averages
  const avgUncached = (uncachedReadings.reduce((sum, r) => sum + r.timeMs, 0) / uncachedReadings.length).toFixed(2);
  const avgCached = (cachedReadings.reduce((sum, r) => sum + r.timeMs, 0) / cachedReadings.length).toFixed(2);
  const speedup = (avgUncached / avgCached).toFixed(1);

  console.log('\n========================================================');
  console.log('📊 EMPIRICAL RESULTS SUMMARY:');
  console.log(`   Average Uncached Response Time: ${avgUncached} ms`);
  console.log(`   Average Cached Response Time:   ${avgCached} ms`);
  console.log(`   Performance Improvement:        ${speedup}x FASTER with in-memory caching!`);
  console.log('========================================================\n');
}

runBenchmark().catch((err) => {
  console.error('Benchmark Error:', err);
  process.exit(1);
});

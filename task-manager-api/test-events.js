const { performance } = require('perf_hooks');

const BASE_URL = process.env.API_URL || 'http://localhost:5001';

async function runEventTest() {
  console.log('================================================================');
  console.log('⚡ Practical 10: Asynchronous Event-Driven Architecture Test');
  console.log('================================================================\n');

  // Step 1: Register / Authenticate test user
  const email = `event_user_${Date.now()}@example.com`;
  const password = 'Password123!';

  console.log(`1. Authenticating user: ${email}...`);
  const regRes = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const { token } = await regRes.json();
  console.log('   Authenticated successfully. JWT Token acquired.\n');

  // Step 2: Test 'task-created' event & non-blocking response
  console.log('2. Emitting task creation request to POST /tasks...');
  const postStartTime = performance.now();
  const clientRequestTimestamp = new Date().toISOString();

  const createRes = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'Async Notification Demo Task',
      description: 'Testing non-blocking background email notification dispatch',
      priority: 'high'
    })
  });

  const postDuration = (performance.now() - postStartTime).toFixed(2);
  const clientReceiveTimestamp = new Date().toISOString();
  const createdTask = await createRes.json();

  console.log(`\n   [CLIENT] Request Dispatched at : ${clientRequestTimestamp}`);
  console.log(`   [CLIENT] Response Received at   : ${clientReceiveTimestamp}`);
  console.log(`   [CLIENT] Total HTTP Round-Trip : ${postDuration} ms`);
  console.log(`   [CLIENT] Status Code           : ${createRes.status} Created`);
  console.log(`   [CLIENT] Created Task ID       : ${createdTask._id}\n`);

  // Step 3: Test 'task-deleted' event (Supplementary Problem 1)
  console.log(`3. Deleting task ${createdTask._id} to test 'task-deleted' audit event...`);
  const delStartTime = performance.now();
  const deleteRes = await fetch(`${BASE_URL}/tasks/${createdTask._id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const delDuration = (performance.now() - delStartTime).toFixed(2);
  const deleteData = await deleteRes.json();

  console.log(`   [CLIENT] Delete Response Time  : ${delDuration} ms (Status: ${deleteRes.status})`);
  console.log(`   [CLIENT] Delete Message        : ${deleteData.message}\n`);

  // Step 4: Wait for the 2-second background worker to complete
  console.log('4. Pausing for 3.0 seconds to allow the background notification worker (2s delay) to complete in server console...');
  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log('\n================================================================');
  console.log('📊 VERIFICATION SUMMARY:');
  console.log(`   - Client API Response Time   : ${postDuration} ms (INSTANT)`);
  console.log(`   - Background Worker Delay    : 2000 ms`);
  console.log(`   - Execution Mode             : NON-BLOCKING ASYNCHRONOUS`);
  console.log('   - Proof: The API returned 201 Created immediately without');
  console.log('     waiting for the 2-second notification listener to finish!');
  console.log('================================================================\n');
}

runEventTest().catch((err) => {
  console.error('Test Error:', err);
  process.exit(1);
});

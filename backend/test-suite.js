const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api';

function request({ method, path: apiPath, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + apiPath);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { ...headers },
    };

    if (body && typeof body === 'object' && !(body instanceof Buffer)) {
      body = JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
    }

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// Multipart form upload helper
function uploadMultipart(apiPath, token, filename, fileBuffer, mimeType = 'text/plain') {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const url = new URL(BASE_URL + apiPath);

    let pre = `--${boundary}\r\n`;
    pre += `Content-Disposition: form-data; name="files"; filename="${filename}"\r\n`;
    pre += `Content-Type: ${mimeType}\r\n\r\n`;

    const post = `\r\n--${boundary}--\r\n`;

    const fullBody = Buffer.concat([
      Buffer.from(pre, 'utf8'),
      fileBuffer,
      Buffer.from(post, 'utf8'),
    ]);

    const options = {
      method: 'POST',
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': fullBody.length,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    req.write(fullBody);
    req.end();
  });
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('Starting Cloud File Storage End-to-End Test Suite');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health Check
    const health = await request({ method: 'GET', path: '/health' });
    assert(health.status === 200 && health.data.status === 'online', 'Health endpoint reports online');

    // 2. User Registration (Unique user)
    const timestamp = Date.now();
    const testUser = {
      name: 'Bob Tester',
      email: `bob_${timestamp}@example.com`,
      password: 'SecurePassword@123',
    };

    const regRes = await request({ method: 'POST', path: '/auth/register', body: testUser });
    assert(regRes.status === 201 && regRes.data.success, 'User registration succeeds');
    const userToken = regRes.data.token;
    const userId = regRes.data.user.id;

    // 3. Duplicate email registration rejected
    const dupRes = await request({ method: 'POST', path: '/auth/register', body: testUser });
    assert(dupRes.status === 409 && !dupRes.data.success, 'Duplicate email registration returns 409 Conflict');

    // 4. User Login
    const loginRes = await request({
      method: 'POST',
      path: '/auth/login',
      body: { email: testUser.email, password: testUser.password },
    });
    assert(loginRes.status === 200 && loginRes.data.token, 'User login succeeds and returns JWT');

    // 5. Invalid password rejected
    const badLogin = await request({
      method: 'POST',
      path: '/auth/login',
      body: { email: testUser.email, password: 'WrongPassword' },
    });
    assert(badLogin.status === 401, 'Invalid password correctly rejected with 401');

    // 6. User Profile endpoint
    const profileRes = await request({
      method: 'GET',
      path: '/auth/me',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(profileRes.status === 200 && profileRes.data.user.email === testUser.email, 'Profile retrieves authenticated user details');

    // 7. File Upload (Valid file 500 bytes)
    const smallContent = Buffer.from('This is a test cloud document with secure payload.'.repeat(10), 'utf8');
    const uploadRes = await uploadMultipart('/files/upload', userToken, 'document_sample.txt', smallContent);
    assert(uploadRes.status === 201 && uploadRes.data.success && uploadRes.data.files.length === 1, 'Valid file upload succeeds');
    const uploadedFileId = uploadRes.data.files[0].id;

    // 8. File Upload (> 10MB file rejected)
    console.log('Testing 10MB limit enforcement...');
    const oversizedBuffer = Buffer.alloc(10 * 1024 * 1024 + 1024); // 10MB + 1KB
    const overUploadRes = await uploadMultipart('/files/upload', userToken, 'oversized_file.dat', oversizedBuffer);
    assert(
      overUploadRes.status === 400 && (!overUploadRes.data || overUploadRes.data.success === false),
      'File exceeding 10 MB limit is properly rejected with 400 status'
    );

    // 9. List User Files
    const listRes = await request({
      method: 'GET',
      path: '/files',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(
      listRes.status === 200 && listRes.data.files.some((f) => f.id === uploadedFileId),
      'User can list their uploaded files'
    );

    // 10. Admin Login
    const adminLogin = await request({
      method: 'POST',
      path: '/auth/login',
      body: { email: 'admin@cloud.com', password: 'Admin@12345' },
    });
    assert(adminLogin.status === 200 && adminLogin.data.user.role === 'admin', 'Admin login succeeds with administrator role');
    const adminToken = adminLogin.data.token;

    // 11. RBAC Guard: Normal user cannot access admin routes
    const userAccessAdmin = await request({
      method: 'GET',
      path: '/admin/stats',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(userAccessAdmin.status === 403, 'Normal user blocked from /api/admin/stats with 403 Forbidden');

    // 12. Admin Overview Stats
    const adminStats = await request({
      method: 'GET',
      path: '/admin/stats',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminStats.status === 200 && adminStats.data.stats.totalUsers >= 2, 'Admin retrieves system overview stats');

    // 13. Admin View All Files
    const adminFiles = await request({
      method: 'GET',
      path: '/admin/files',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      adminFiles.status === 200 && adminFiles.data.files.some((f) => f.id === uploadedFileId),
      'Admin can view all files with uploader details'
    );

    // 14. Admin Download File
    const adminDownload = await request({
      method: 'GET',
      path: `/admin/files/${uploadedFileId}/download`,
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminDownload.status === 200, 'Admin can download any file');

    // 15. User Delete File
    const deleteRes = await request({
      method: 'DELETE',
      path: `/files/${uploadedFileId}`,
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(deleteRes.status === 200 && deleteRes.data.success, 'User can delete their own file');

    // 16. Verify file is deleted
    const verifyList = await request({
      method: 'GET',
      path: '/files',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(!verifyList.data.files.some((f) => f.id === uploadedFileId), 'Deleted file is no longer present in user file list');

    // 17. Admin Delete User
    const adminDeleteUser = await request({
      method: 'DELETE',
      path: `/admin/users/${userId}`,
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminDeleteUser.status === 200 && adminDeleteUser.data.success, 'Admin can delete user and their associated data');

    console.log('\n====================================================');
    console.log(`Test Suite Finished: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================');

    process.exit(failed === 0 ? 0 : 1);
  } catch (err) {
    console.error('Test suite failed with unexpected error:', err);
    process.exit(1);
  }
}

runTestSuite();

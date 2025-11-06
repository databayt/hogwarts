/**
 * K6 Performance Test Script for File Upload System
 * Tests upload performance, concurrent uploads, and system limits
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';
import { SharedArray } from 'k6/data';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const uploadSuccessRate = new Rate('upload_success_rate');
const uploadDuration = new Trend('upload_duration');
const uploadErrors = new Counter('upload_errors');
const concurrentUploads = new Gauge('concurrent_uploads');
const fileSizeUploaded = new Counter('file_size_uploaded');

// Test configuration
export const options = {
    scenarios: {
        // Scenario 1: Small file uploads (images)
        small_files: {
            executor: 'ramping-vus',
            startVUs: 1,
            stages: [
                { duration: '1m', target: 10 },  // Ramp up to 10 VUs
                { duration: '3m', target: 10 },  // Stay at 10 VUs
                { duration: '1m', target: 0 },   // Ramp down
            ],
            exec: 'uploadSmallFile',
        },
        // Scenario 2: Large file uploads (documents/videos)
        large_files: {
            executor: 'ramping-vus',
            startVUs: 1,
            stages: [
                { duration: '1m', target: 5 },   // Ramp up to 5 VUs
                { duration: '5m', target: 5 },   // Stay at 5 VUs
                { duration: '1m', target: 0 },   // Ramp down
            ],
            exec: 'uploadLargeFile',
            startTime: '2m',  // Start after small files scenario
        },
        // Scenario 3: Chunked uploads for very large files
        chunked_uploads: {
            executor: 'per-vu-iterations',
            vus: 3,
            iterations: 5,
            exec: 'uploadChunkedFile',
            startTime: '5m',
        },
        // Scenario 4: Burst test
        burst_test: {
            executor: 'shared-iterations',
            vus: 50,
            iterations: 100,
            maxDuration: '2m',
            exec: 'uploadBurst',
            startTime: '10m',
        },
    },
    thresholds: {
        // System thresholds
        http_req_duration: ['p(95)<5000', 'p(99)<10000'],  // 95% under 5s, 99% under 10s
        http_req_failed: ['rate<0.01'],  // Error rate under 1%
        upload_success_rate: ['rate>0.95'],  // Success rate above 95%
        upload_duration: ['p(95)<5000', 'p(99)<10000'],
        upload_errors: ['count<10'],  // Less than 10 errors total
    },
    cloud: {
        projectID: 3123456,
        name: 'Hogwarts File Upload Performance Test',
        distribution: {
            'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 60 },
            'amazon:eu:dublin': { loadZone: 'amazon:eu:dublin', percent: 30 },
            'amazon:ap:singapore': { loadZone: 'amazon:ap:singapore', percent: 10 },
        },
    },
};

// Test data
const BASE_URL = __ENV.BASE_URL || 'https://ed.databayt.org';
const API_TOKEN = __ENV.API_TOKEN || '';

// School IDs for multi-tenant testing
const schoolIds = new SharedArray('schools', function () {
    return [
        'school-001',
        'school-002',
        'school-003',
        'school-004',
        'school-005',
    ];
});

// Setup function
export function setup() {
    // Authenticate and get tokens for each school
    const tokens = {};

    schoolIds.forEach(schoolId => {
        const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
            email: `test@${schoolId}.databayt.org`,
            password: 'TestPassword123!',
            schoolId: schoolId,
        }), {
            headers: { 'Content-Type': 'application/json' },
        });

        if (loginRes.status === 200) {
            const data = JSON.parse(loginRes.body);
            tokens[schoolId] = data.token;
        }
    });

    return { tokens };
}

// Scenario 1: Small file upload (1-5MB)
export function uploadSmallFile(data) {
    const schoolId = schoolIds[randomIntBetween(0, schoolIds.length - 1)];
    const token = data.tokens[schoolId];

    group('Small File Upload', () => {
        const fileName = `test-image-${randomString(8)}.jpg`;
        const fileSize = randomIntBetween(1024 * 1024, 5 * 1024 * 1024); // 1-5MB
        const fileContent = generateFile(fileSize);

        const formData = new FormData();
        formData.append('file', http.file(fileContent, fileName, 'image/jpeg'));
        formData.append('schoolId', schoolId);
        formData.append('category', 'images');
        formData.append('tags', JSON.stringify(['test', 'performance']));

        const startTime = Date.now();
        concurrentUploads.add(1);

        const response = http.post(
            `${BASE_URL}/api/upload/single`,
            formData.body(),
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    ...formData.headers(),
                },
                timeout: '30s',
            }
        );

        const duration = Date.now() - startTime;
        concurrentUploads.add(-1);

        // Record metrics
        uploadDuration.add(duration);
        fileSizeUploaded.add(fileSize);

        const success = check(response, {
            'status is 200': (r) => r.status === 200,
            'has file ID': (r) => JSON.parse(r.body).fileId !== undefined,
            'upload time < 5s': () => duration < 5000,
        });

        uploadSuccessRate.add(success ? 1 : 0);
        if (!success) {
            uploadErrors.add(1);
            console.error(`Upload failed: ${response.status} - ${response.body}`);
        }

        sleep(randomIntBetween(1, 3));
    });
}

// Scenario 2: Large file upload (50-100MB)
export function uploadLargeFile(data) {
    const schoolId = schoolIds[randomIntBetween(0, schoolIds.length - 1)];
    const token = data.tokens[schoolId];

    group('Large File Upload', () => {
        const fileName = `test-document-${randomString(8)}.pdf`;
        const fileSize = randomIntBetween(50 * 1024 * 1024, 100 * 1024 * 1024); // 50-100MB
        const fileContent = generateFile(fileSize);

        const formData = new FormData();
        formData.append('file', http.file(fileContent, fileName, 'application/pdf'));
        formData.append('schoolId', schoolId);
        formData.append('category', 'documents');

        const startTime = Date.now();
        concurrentUploads.add(1);

        const response = http.post(
            `${BASE_URL}/api/upload/single`,
            formData.body(),
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    ...formData.headers(),
                },
                timeout: '120s',
            }
        );

        const duration = Date.now() - startTime;
        concurrentUploads.add(-1);

        uploadDuration.add(duration);
        fileSizeUploaded.add(fileSize);

        const success = check(response, {
            'status is 200': (r) => r.status === 200,
            'has file ID': (r) => JSON.parse(r.body).fileId !== undefined,
            'upload time < 30s': () => duration < 30000,
        });

        uploadSuccessRate.add(success ? 1 : 0);
        if (!success) {
            uploadErrors.add(1);
        }

        sleep(randomIntBetween(2, 5));
    });
}

// Scenario 3: Chunked upload for very large files (500MB)
export function uploadChunkedFile(data) {
    const schoolId = schoolIds[randomIntBetween(0, schoolIds.length - 1)];
    const token = data.tokens[schoolId];

    group('Chunked File Upload', () => {
        const fileName = `test-video-${randomString(8)}.mp4`;
        const totalSize = 500 * 1024 * 1024; // 500MB
        const chunkSize = 5 * 1024 * 1024; // 5MB chunks
        const totalChunks = Math.ceil(totalSize / chunkSize);

        // Initialize chunked upload
        const initResponse = http.post(
            `${BASE_URL}/api/upload/chunked/init`,
            JSON.stringify({
                fileName: fileName,
                fileSize: totalSize,
                mimeType: 'video/mp4',
                schoolId: schoolId,
                chunkSize: chunkSize,
                totalChunks: totalChunks,
            }),
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (initResponse.status !== 200) {
            uploadErrors.add(1);
            return;
        }

        const { uploadId } = JSON.parse(initResponse.body);

        // Upload chunks
        let uploadedChunks = 0;
        for (let i = 0; i < totalChunks; i++) {
            const chunkData = generateFile(Math.min(chunkSize, totalSize - i * chunkSize));

            const formData = new FormData();
            formData.append('chunk', http.file(chunkData, `chunk-${i}`, 'application/octet-stream'));
            formData.append('uploadId', uploadId);
            formData.append('chunkNumber', i.toString());

            const chunkResponse = http.post(
                `${BASE_URL}/api/upload/chunked/chunk`,
                formData.body(),
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        ...formData.headers(),
                    },
                    timeout: '30s',
                }
            );

            if (chunkResponse.status === 200) {
                uploadedChunks++;
            } else {
                console.error(`Chunk ${i} upload failed`);
                break;
            }

            // Small delay between chunks
            sleep(0.5);
        }

        // Complete the upload if all chunks were uploaded
        if (uploadedChunks === totalChunks) {
            const completeResponse = http.post(
                `${BASE_URL}/api/upload/chunked/complete`,
                JSON.stringify({
                    uploadId: uploadId,
                    totalChunks: totalChunks,
                }),
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const success = check(completeResponse, {
                'chunked upload completed': (r) => r.status === 200,
                'has final file ID': (r) => JSON.parse(r.body).fileId !== undefined,
            });

            uploadSuccessRate.add(success ? 1 : 0);
            fileSizeUploaded.add(totalSize);
        } else {
            uploadErrors.add(1);
        }
    });
}

// Scenario 4: Burst upload test
export function uploadBurst(data) {
    const schoolId = schoolIds[__VU % schoolIds.length];
    const token = data.tokens[schoolId];

    const fileName = `burst-test-${__VU}-${__ITER}.txt`;
    const fileSize = 512 * 1024; // 512KB
    const fileContent = generateFile(fileSize);

    const formData = new FormData();
    formData.append('file', http.file(fileContent, fileName, 'text/plain'));
    formData.append('schoolId', schoolId);

    const response = http.post(
        `${BASE_URL}/api/upload/single`,
        formData.body(),
        {
            headers: {
                'Authorization': `Bearer ${token}`,
                ...formData.headers(),
            },
            timeout: '10s',
        }
    );

    const success = response.status === 200;
    uploadSuccessRate.add(success ? 1 : 0);
    if (!success) {
        uploadErrors.add(1);
    }
}

// Helper function to generate file content
function generateFile(size) {
    const chunk = 'A'.repeat(1024); // 1KB chunk
    const chunks = Math.ceil(size / 1024);
    let content = '';

    for (let i = 0; i < chunks; i++) {
        content += chunk;
    }

    return content.substring(0, size);
}

// Teardown function
export function teardown(data) {
    // Clean up test files
    console.log('Test completed. Cleaning up test files...');

    // You could make API calls here to delete test files
    // or trigger a cleanup job
}

// Handle test summary
export function handleSummary(data) {
    return {
        'performance-summary.json': JSON.stringify(data),
        'performance-report.html': htmlReport(data),
        stdout: textSummary(data, { indent: ' ', enableColors: true }),
    };
}

// Generate HTML report
function htmlReport(data) {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>File Upload Performance Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        .metric { margin: 10px 0; padding: 10px; background: #f0f0f0; }
        .success { color: green; }
        .failure { color: red; }
    </style>
</head>
<body>
    <h1>File Upload Performance Test Results</h1>
    <div class="metric">
        <h3>Upload Success Rate</h3>
        <p class="${data.metrics.upload_success_rate.rate > 0.95 ? 'success' : 'failure'}">
            ${(data.metrics.upload_success_rate.rate * 100).toFixed(2)}%
        </p>
    </div>
    <div class="metric">
        <h3>Average Upload Duration</h3>
        <p>${data.metrics.upload_duration.avg.toFixed(2)}ms</p>
        <p>P95: ${data.metrics.upload_duration.p95.toFixed(2)}ms</p>
        <p>P99: ${data.metrics.upload_duration.p99.toFixed(2)}ms</p>
    </div>
    <div class="metric">
        <h3>Total Data Uploaded</h3>
        <p>${(data.metrics.file_size_uploaded.count / (1024 * 1024 * 1024)).toFixed(2)} GB</p>
    </div>
    <div class="metric">
        <h3>Upload Errors</h3>
        <p class="${data.metrics.upload_errors.count < 10 ? 'success' : 'failure'}">
            ${data.metrics.upload_errors.count}
        </p>
    </div>
</body>
</html>
    `;
}
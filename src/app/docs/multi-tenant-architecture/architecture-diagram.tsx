import React from 'react';

export function MultiTenantArchitectureDiagram() {
  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold mb-6 text-center text-gray-800">
        Multi-Tenant Architecture Flow
      </h3>
      
      {/* Architecture Overview */}
      <div className="mb-8">
        <h4 className="text-lg font-medium mb-4 text-gray-700">Domain Structure</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
            <h5 className="font-semibold text-blue-800 mb-2">Root Domain</h5>
            <p className="text-sm text-blue-700">databayt.org</p>
            <p className="text-xs text-blue-600 mt-1">Company main domain</p>
          </div>
          <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
            <h5 className="font-semibold text-green-800 mb-2">Sector Domain</h5>
            <p className="text-sm text-green-700">ed.databayt.org</p>
            <p className="text-xs text-green-600 mt-1">Education SaaS marketing</p>
          </div>
          <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
            <h5 className="font-semibold text-purple-800 mb-2">School Subdomain</h5>
            <p className="text-sm text-purple-700">school.ed.databayt.org</p>
            <p className="text-xs text-purple-600 mt-1">Individual school portal</p>
          </div>
        </div>
      </div>

      {/* Request Flow */}
      <div className="mb-8">
        <h4 className="text-lg font-medium mb-4 text-gray-700">Request Flow</h4>
        <div className="space-y-4">
          {/* Step 1: User Request */}
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
              1
            </div>
            <div className="flex-1 bg-gray-100 rounded-lg p-3">
              <p className="text-sm font-medium">User visits school.ed.databayt.org/dashboard</p>
            </div>
          </div>

          {/* Step 2: Middleware */}
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
              2
            </div>
            <div className="flex-1 bg-gray-100 rounded-lg p-3">
              <p className="text-sm font-medium">Middleware extracts subdomain "school" and injects x-subdomain header</p>
            </div>
          </div>

          {/* Step 3: Server Resolution */}
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
              3
            </div>
            <div className="flex-1 bg-gray-100 rounded-lg p-3">
              <p className="text-sm font-medium">getTenantContext() resolves subdomain to schoolId</p>
            </div>
          </div>

          {/* Step 4: Database Query */}
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
              4
            </div>
            <div className="flex-1 bg-gray-100 rounded-lg p-3">
              <p className="text-sm font-medium">Database query scoped by schoolId for tenant isolation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Isolation */}
      <div className="mb-8">
        <h4 className="text-lg font-medium mb-4 text-gray-700">Data Isolation Strategy</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-800 mb-3">Database Schema</h5>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                <span>Every table includes schoolId field</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span>Unique constraints scoped by schoolId</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <span>Foreign keys maintain referential integrity</span>
              </div>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-800 mb-3">Query Pattern</h5>
            <div className="bg-gray-900 text-green-400 p-3 rounded text-sm font-mono">
              <div>// ✅ Correct - Always include schoolId</div>
              <div>const students = await db.student.findMany({</div>
              <div className="ml-4">where: { schoolId: "school_123" }</div>
              <div>});</div>
            </div>
          </div>
        </div>
      </div>

      {/* Current vs Target State */}
      <div className="mb-8">
        <h4 className="text-lg font-medium mb-4 text-gray-700">Implementation Progress</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-800 mb-3">✅ Current State</h5>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span>Basic subdomain detection</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span>Header injection (x-subdomain)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span>Tenant context resolution</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span>Database schema with schoolId</span>
              </div>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-800 mb-3">🎯 Target State</h5>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">→</span>
                </div>
                <span>Route rewriting & tenant pages</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">→</span>
                </div>
                <span>Admin dashboard for tenant management</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">→</span>
                </div>
                <span>Redis caching & performance optimization</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">→</span>
                </div>
                <span>Comprehensive security & monitoring</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Layers */}
      <div className="mb-8">
        <h4 className="text-lg font-medium mb-4 text-gray-700">Security Layers</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4 bg-red-50">
            <h5 className="font-medium text-red-800 mb-2">Network Layer</h5>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• HTTPS enforcement</li>
              <li>• CORS configuration</li>
              <li>• Rate limiting per tenant</li>
            </ul>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4 bg-yellow-50">
            <h5 className="font-medium text-yellow-800 mb-2">Application Layer</h5>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Tenant context validation</li>
              <li>• Role-based access control</li>
              <li>• Session management</li>
            </ul>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4 bg-green-50">
            <h5 className="font-medium text-green-800 mb-2">Data Layer</h5>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Database-level isolation</li>
              <li>• Query parameterization</li>
              <li>• Audit logging</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Implementation Timeline */}
      <div>
        <h4 className="text-lg font-medium mb-4 text-gray-700">Implementation Timeline</h4>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-20 text-sm font-medium text-blue-600">Week 1-2</div>
            <div className="flex-1 bg-blue-100 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-800">Phase 1: Core Infrastructure</p>
              <p className="text-xs text-blue-600">Enhanced middleware, tenant validation, enhanced context</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="w-20 text-sm font-medium text-green-600">Week 3-4</div>
            <div className="flex-1 bg-green-100 rounded-lg p-3">
              <p className="text-sm font-medium text-green-800">Phase 2: Tenant Management</p>
              <p className="text-xs text-green-600">Admin dashboard, CRUD operations, tenant monitoring</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="w-20 text-sm font-medium text-yellow-600">Week 5-6</div>
            <div className="flex-1 bg-yellow-100 rounded-lg p-3">
              <p className="text-sm font-medium text-yellow-800">Phase 3: User Experience</p>
              <p className="text-xs text-yellow-600">Tenant-specific routing, dynamic navigation</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="w-20 text-sm font-medium text-red-600">Week 7-8</div>
            <div className="flex-1 bg-red-100 rounded-lg p-3">
              <p className="text-sm font-medium text-red-800">Phase 4: Security & Performance</p>
              <p className="text-xs text-red-600">Security headers, caching layer, production readiness</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MultiTenantArchitectureDiagram;

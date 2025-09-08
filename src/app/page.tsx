import Link from 'next/link';
import { Shield, Scale, FileText, Users, Calendar, BarChart3 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Rochester Law Department</h1>
                <p className="text-sm text-gray-600">Case Management System</p>
              </div>
            </div>
            <nav className="flex space-x-6">
              <Link 
                href="/demo" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Try Demo
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              Government-Grade
              <span className="block text-blue-600">Legal Case Management</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600">
              A comprehensive case management system designed specifically for municipal law departments. 
              Built to handle the complete workflow of a 25-person law department with advanced security, 
              compliance, and collaboration features.
            </p>
            <div className="mt-10 flex justify-center space-x-4">
              <Link
                href="/demo"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md font-medium text-lg transition-colors"
              >
                Launch Demo
              </Link>
              <a
                href="#features"
                className="border border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-3 rounded-md font-medium text-lg transition-colors"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="bg-white py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Complete Legal Workflow Management
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600">
                Everything your legal department needs in one secure, government-compliant platform.
              </p>
            </div>

            <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <Scale className="h-12 w-12 text-blue-600 mx-auto" />
                <h3 className="mt-4 text-xl font-semibold text-gray-900">Case Management</h3>
                <p className="mt-2 text-gray-600">
                  Track litigation, transactional, and regulatory cases with automated assignment and deadline monitoring.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <FileText className="h-12 w-12 text-blue-600 mx-auto" />
                <h3 className="mt-4 text-xl font-semibold text-gray-900">Document Management</h3>
                <p className="mt-2 text-gray-600">
                  Secure storage with version control, collaboration tools, and full-text search capabilities.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <Users className="h-12 w-12 text-blue-600 mx-auto" />
                <h3 className="mt-4 text-xl font-semibold text-gray-900">User & Role Management</h3>
                <p className="mt-2 text-gray-600">
                  Hierarchical permissions with government clearance levels and multi-factor authentication.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <Shield className="h-12 w-12 text-blue-600 mx-auto" />
                <h3 className="mt-4 text-xl font-semibold text-gray-900">Security & Compliance</h3>
                <p className="mt-2 text-gray-600">
                  NIST compliance, FOIL request tracking, and comprehensive audit logging for accountability.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <Calendar className="h-12 w-12 text-blue-600 mx-auto" />
                <h3 className="mt-4 text-xl font-semibold text-gray-900">Calendar & Tasks</h3>
                <p className="mt-2 text-gray-600">
                  Integrated calendar with deadline tracking, automated reminders, and workload balancing.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <BarChart3 className="h-12 w-12 text-blue-600 mx-auto" />
                <h3 className="mt-4 text-xl font-semibold text-gray-900">Reporting & Analytics</h3>
                <p className="mt-2 text-gray-600">
                  Case statistics, productivity metrics, and compliance reports with export capabilities.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Demo CTA */}
        <div className="bg-blue-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Ready to See It in Action?
              </h2>
              <p className="mt-4 text-xl text-blue-100">
                Experience the full Rochester Law CMS with our comprehensive demo.
              </p>
              <div className="mt-8">
                <Link
                  href="/demo"
                  className="bg-white hover:bg-gray-100 text-blue-600 px-8 py-3 rounded-md font-semibold text-lg transition-colors"
                >
                  Launch Demo Now
                </Link>
              </div>
              <div className="mt-6 text-blue-200">
                <p>Demo users available with different role permissions</p>
                <p className="text-sm">Password for all demo accounts: <span className="font-mono">Demo2024!</span></p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3">
              <Shield className="h-6 w-6 text-white" />
              <span className="text-white font-semibold">Rochester Law Department CMS</span>
            </div>
            <p className="mt-4 text-gray-400">
              Government-grade case management system for municipal law departments
            </p>
            <p className="mt-2 text-gray-500 text-sm">
              © 2024 City of Rochester Law Department - All Rights Reserved
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
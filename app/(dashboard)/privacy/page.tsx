// app/(dashboard)/privacy/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Shield, Lock, Eye, Mail, Database, Server } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
    setCurrentDate(formattedDate);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Last updated: {currentDate || 'Loading...'}
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Introduction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300">
              Event Manager ("we", "our", "us") is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, and safeguard your personal 
              information when you use our event management platform.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              Information We Collect
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Personal Information</h3>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 dark:text-gray-300">
                  <li>Name and contact information (email, phone number)</li>
                  <li>Account credentials (password, authentication data)</li>
                  <li>Event details and guest information you provide</li>
                  <li>Payment information (processed securely by third-party providers)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Usage Data</h3>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 dark:text-gray-300">
                  <li>Pages visited and features used</li>
                  <li>Time and date of access</li>
                  <li>Device information and browser type</li>
                  <li>IP address and geographical location</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-blue-600" />
              How We Use Your Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li>✓ To provide and maintain our event management services</li>
              <li>✓ To process RSVPs and manage guest lists</li>
              <li>✓ To send WhatsApp and email notifications</li>
              <li>✓ To improve our platform and user experience</li>
              <li>✓ To communicate with you about updates and support</li>
              <li>✓ To comply with legal obligations</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-blue-600" />
              Data Storage & Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                We implement appropriate technical and organizational measures to protect 
                your personal information against unauthorized access, alteration, disclosure, 
                or destruction.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  🔒 All data is encrypted in transit and at rest using industry-standard 
                  encryption protocols.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              Your Rights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li>• <strong>Access:</strong> Request a copy of your personal data</li>
              <li>• <strong>Correction:</strong> Request corrections to inaccurate data</li>
              <li>• <strong>Deletion:</strong> Request deletion of your data</li>
              <li>• <strong>Export:</strong> Request a portable copy of your data</li>
              <li>• <strong>Opt-out:</strong> Opt out of marketing communications</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Contact Us
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm">
                <span className="font-semibold">Email:</span> privacy@eventmanager.com
              </p>
              <p className="text-sm mt-1">
                <span className="font-semibold">Address:</span> 123 Event Street, City, Country
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
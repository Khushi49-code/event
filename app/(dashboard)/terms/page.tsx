// app/(dashboard)/terms/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FileText, CheckCircle, AlertCircle, Users, Shield, Clock } from 'lucide-react';

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Terms & Conditions</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Last updated: {currentDate || 'Loading...'}
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Agreement to Terms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300">
              By using Event Manager, you agree to be bound by these Terms & Conditions. 
              If you do not agree with any part of these terms, please do not use our platform.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              User Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Account Responsibility</h3>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 dark:text-gray-300">
                  <li>You are responsible for maintaining the confidentiality of your account</li>
                  <li>You are responsible for all activities under your account</li>
                  <li>You must notify us immediately of any unauthorized use</li>
                  <li>You must be at least 18 years old to use this platform</li>
                </ul>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <p className="text-sm text-yellow-700 dark:text-yellow-300 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  You are responsible for all content you create and share through our platform.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Acceptable Use
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 font-semibold">You agree NOT to:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Use the platform for any illegal purposes</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Send spam or unsolicited communications</li>
                <li>Share inappropriate or offensive content</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with the platform's operation</li>
                <li>Collect user data without permission</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Plan & Subscription Terms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Billing & Payments</h3>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 dark:text-gray-300">
                  <li>Plans are billed on a recurring basis as selected</li>
                  <li>Payments are non-refundable except as required by law</li>
                  <li>We reserve the right to change prices with prior notice</li>
                  <li>You may cancel your subscription at any time</li>
                </ul>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-300 flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  Free trial users can upgrade or cancel before the trial ends.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              Disclaimer & Liability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">
                  ⚠️ Our platform is provided "as is" without warranties of any kind. 
                  We are not liable for any damages arising from the use of our services.
                </p>
              </div>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• We do not guarantee uninterrupted or error-free service</li>
                <li>• We are not responsible for third-party services integrated with our platform</li>
                <li>• You use the platform at your own risk</li>
                <li>• We are not liable for any data loss or security breaches</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300">
              For any questions or concerns regarding these Terms, please contact us:
            </p>
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm">
                <span className="font-semibold">Email:</span> legal@eventmanager.com
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
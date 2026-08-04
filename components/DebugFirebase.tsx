// components/DebugFirebase.tsx
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { testFirebaseConnection, submitSupportRequest } from '@/lib/services/supportService';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

export function DebugFirebase() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testConnection = async () => {
    setLoading(true);
    try {
      const success = await testFirebaseConnection();
      setResult({ type: 'connection', success });
      if (success) {
        toast.success('Firebase connection successful!');
      } else {
        toast.error('Firebase connection failed!');
      }
    } catch (error) {
      setResult({ type: 'connection', success: false, error });
    } finally {
      setLoading(false);
    }
  };

  const testSupportSubmit = async () => {
    if (!user) {
      toast.error('Please sign in first');
      return;
    }

    setLoading(true);
    try {
      const testData = {
        subject: 'Test Support Request',
        category: 'technical',
        message: 'This is a test message to verify Firebase connection',
        priority: 'medium' as const,
      };

      const response = await submitSupportRequest(testData, user);
      setResult({ type: 'support', ...response });
      
      if (response.success) {
        toast.success('Test support request submitted! ID: ' + response.id);
      } else {
        toast.error('Failed to submit: ' + response.error);
      }
    } catch (error) {
      setResult({ type: 'support', success: false, error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>🔧 Firebase Debug Tool</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={testConnection} 
              disabled={loading}
              variant="outline"
            >
              Test Firebase Connection
            </Button>
            <Button 
              onClick={testSupportSubmit} 
              disabled={loading || !user}
            >
              Test Support Submit
            </Button>
          </div>
          
          {result && (
            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <h4 className="font-semibold">Debug Result:</h4>
              <pre className="text-xs mt-2 overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
          
          {user && (
            <div className="text-sm text-gray-600">
              ✅ User: {user.email} (UID: {user.uid})
            </div>
          )}
          
          {!user && (
            <div className="text-sm text-yellow-600">
              ⚠️ Not signed in. Please sign in to test support submissions.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
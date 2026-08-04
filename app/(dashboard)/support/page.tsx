// app/support/page.tsx
"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Loader2, Send, HelpCircle } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { submitSupportRequest } from '@/lib/services/supportService';
import { toast } from 'sonner';

export default function SupportPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    category: '',
    message: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to submit a support request');
      return;
    }
    
    if (!formData.subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }
    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }
    if (!formData.message.trim()) {
      toast.error('Please describe your issue');
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await submitSupportRequest(formData, user);
      
      if (result.success) {
        toast.success('Support request sent successfully!');
        setFormData({ subject: '', category: '', message: '', priority: 'medium' });
      } else {
        toast.error(result.error || 'Failed to send support request');
      }
    } catch (error) {
      console.error('Error submitting support form:', error);
      toast.error('Failed to send support request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <HelpCircle className="h-8 w-8 text-blue-600" />
          Support
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Need help? Fill out the form below and our support team will get back to you.
        </p>
      </div>

      {/* Support Form */}
      <Card>
        <CardHeader>
          <CardTitle>Submit a Support Request</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject <span className="text-red-500">*</span></Label>
              <Input
                id="subject"
                placeholder="Brief description of your issue"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                required
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">🛠️ Technical Issue</SelectItem>
                  <SelectItem value="billing">💰 Billing & Payments</SelectItem>
                  <SelectItem value="account">👤 Account Management</SelectItem>
                  <SelectItem value="feature">💡 Feature Request</SelectItem>
                  <SelectItem value="other">📝 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => 
                  setFormData({ ...formData, priority: value })
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Low</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="high">🟠 High</SelectItem>
                  <SelectItem value="urgent">🔴 Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message <span className="text-red-500">*</span></Label>
              <Textarea
                id="message"
                placeholder="Describe your issue in detail..."
                rows={6}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            {/* User Email (Read-only) */}
            <div className="space-y-2">
              <Label>Your Email</Label>
              <Input 
                value={user?.email || 'Not signed in'} 
                disabled 
                className="bg-gray-50 dark:bg-gray-800"
              />
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !user}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Support Request
                </>
              )}
            </Button>

            {!user && (
              <p className="text-sm text-yellow-600 text-center">
                ⚠️ Please sign in to submit a support request
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
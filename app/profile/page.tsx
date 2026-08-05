'use client';

import { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { updateProfile } from 'firebase/auth';
import { auth } from '@/lib/config';
import { usePlanExpiry } from '@/hooks/usePlanExpiry';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Calendar, Save, ArrowLeft, LayoutDashboard, CreditCard, Crown, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const { planName, daysLeft, status: planStatus, loading: planLoading } = usePlanExpiry();

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await updateProfile(user, {
        displayName: displayName,
      });
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  // Visual config for plan status badge/card
  const planStatusConfig: Record<string, { badge: 'success' | 'warning' | 'danger'; icon: any; message: string }> = {
    ok: {
      badge: 'success',
      icon: Crown,
      message: daysLeft !== null ? `${daysLeft} days remaining` : 'Active',
    },
    reminder: {
      badge: 'warning',
      icon: Clock,
      message: `${daysLeft} days remaining — renewal coming up`,
    },
    warning: {
      badge: 'warning',
      icon: AlertTriangle,
      message: `${daysLeft} days remaining — renew soon`,
    },
    urgent: {
      badge: 'danger',
      icon: AlertTriangle,
      message: `${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining — renew now`,
    },
    expired: {
      badge: 'danger',
      icon: XCircle,
      message: 'Plan expired — renew to restore access',
    },
    none: {
      badge: 'warning',
      icon: CreditCard,
      message: 'No active plan',
    },
  };

  const currentPlanConfig = planStatusConfig[planStatus] || planStatusConfig.none;
  const PlanIcon = currentPlanConfig.icon;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back to Dashboard Button */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={handleBackToDashboard}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-1">Manage your personal information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Profile Photo</CardTitle>
            <CardDescription>Your profile picture</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Avatar
              src={user?.photoURL || undefined}
              fallback={user?.displayName?.[0] || user?.email?.[0] || 'U'}
              size="xl"
              className="w-32 h-32 text-4xl"
            />
            <p className="mt-3 text-sm text-gray-600">
              {user?.email}
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => toast('Photo upload coming soon!')}
            >
              Change Photo
            </Button>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </div>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setDisplayName(user?.displayName || '');
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Display Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User size={16} />
                Display Name
              </label>
              {isEditing ? (
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                  className="w-full"
                />
              ) : (
                <p className="text-gray-900 py-2">
                  {user?.displayName || 'Not set'}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail size={16} />
                Email Address
              </label>
              <p className="text-gray-900 py-2">{user?.email}</p>
            </div>

            {/* User ID */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar size={16} />
                User ID
              </label>
              <p className="text-gray-500 text-sm font-mono py-2">{user?.uid}</p>
            </div>

            {/* Account Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Account Status</label>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-900">Active</span>
              </div>
            </div>

            {/* Save Button */}
            {isEditing && (
              <Button 
                className="w-full mt-4"
                onClick={handleUpdateProfile}
                disabled={loading}
              >
                <Save size={16} className="mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* My Plan Section */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              My Plan
            </CardTitle>
            <CardDescription>Your current subscription and renewal status</CardDescription>
          </CardHeader>
          <CardContent>
            {planLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-5 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <PlanIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">
                        {planName || 'No Plan Selected'}
                      </p>
                      <Badge variant={currentPlanConfig.badge}>
                        {planStatus === 'expired' ? 'Expired' : planStatus === 'none' ? 'Inactive' : 'Active'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {currentPlanConfig.message}
                    </p>
                  </div>
                </div>

                <Link href="/settings/billing">
                  <Button className="w-full sm:w-auto">
                    <Crown className="mr-2 h-4 w-4" />
                    {planStatus === 'none' ? 'Choose a Plan' : 'Upgrade Plan'}
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation - Optional: Add another Back to Dashboard button at bottom */}
      <div className="mt-8 flex justify-center">
        <Button
          variant="outline"
          onClick={handleBackToDashboard}
          className="flex items-center gap-2"
        >
          <LayoutDashboard size={18} />
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
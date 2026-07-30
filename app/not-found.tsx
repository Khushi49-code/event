// app/not-found.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Calendar, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <Calendar className="h-16 w-16 text-blue-600" />
          </div>
        </div>
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
          Page Not Found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button>
              <Home className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <Link href="/events">
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              View Events
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
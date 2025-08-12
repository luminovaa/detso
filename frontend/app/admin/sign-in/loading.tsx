"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8 dark:bg-gray-900">
      <div className="w-full max-w-md">
        {/* Logo Skeleton */}
        <div className="flex justify-center mb-8">
          <Skeleton className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Card Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg">
          {/* Header Skeleton */}
          <div className="text-center mb-8 space-y-4">
            <Skeleton className="h-8 w-3/4 mx-auto bg-gray-200 dark:bg-gray-700" />
            <Skeleton className="h-4 w-1/2 mx-auto bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Form Skeleton */}
          <div className="space-y-6">
            {/* Email/Username Field */}
            <div>
              <Skeleton className="h-4 w-1/4 mb-2 bg-gray-200 dark:bg-gray-700" />
              <Skeleton className="h-12 w-full rounded-lg bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Password Field */}
            <div>
              <Skeleton className="h-4 w-1/4 mb-2 bg-gray-200 dark:bg-gray-700" />
              <Skeleton className="h-12 w-full rounded-lg bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-4 rounded bg-gray-200 dark:bg-gray-700" />
                <Skeleton className="h-4 w-20 bg-gray-200 dark:bg-gray-700" />
              </div>
              <Skeleton className="h-4 w-24 bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Submit Button */}
            <Skeleton className="h-12 w-full rounded-lg bg-gray-200 dark:bg-gray-700" />

            {/* Sign Up Link */}
            <div className="pt-4">
              <Skeleton className="h-4 w-full bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        </div>

        {/* Footer Skeleton */}
        <div className="mt-8">
          <Skeleton className="h-3 w-1/2 mx-auto bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    </div>
  );
}
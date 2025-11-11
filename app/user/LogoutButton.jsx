'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { logoutAction } from '@/app/(auth)/logout/actions'; // adjust path if yours differs

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      // Call the server action — this runs on the server and clears cookies
      const result = await logoutAction();
      if (result?.success) {
        // client-side navigation after server sign-out
        router.push('/login');
      } else {
        // fallback behavior
        console.error('Sign-out returned unexpected result', result);
      }
    } catch (err) {
      console.error('Sign-out failed', err);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className="px-3 py-2 rounded bg-red-600 text-white cursor-pointer"
    >
      Sign out
    </button>
  );
}

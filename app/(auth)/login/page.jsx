// app/(auth)/login/page.jsx
import { getUser } from '@/utils/supabase/supabaseQueries';
import { redirect } from 'next/navigation';
import Link from 'next/link';

import LoginForm from './LoginForm';

export default async function LoginPage() {  
  const profile = await getUser();
  if (profile) {
    redirect('/user');
  }
  
  return (
    <div className="w-full min-h-[100dvh] flex items-stretch">
      <div className="hidden lg:flex w-1/2 bg-gray-100 flex-col p-8">
        <Link href='/' className="flex items-center gap-1" >
            {/* Logo here */}
            <span className="text-lg font-bold text-gray-900 italic">FeeTrack</span>
        </Link>

        <div className="w-full h-full flex flex-col justify-between mt-12">
            <div>
                <h2 className="text-3xl font-bold mb-4">Welcome back</h2>
                <p className="text-gray-700">Log in to your FeeTrack account.</p>
            </div>

            <div className="flex flex-col text-sm gap-1">
                <h2 className="text-sm font-bold">© FeeTrack</h2>
                <p>You may react out to us at: feetrack[at]gmail.com</p>
            </div>
        </div>
      </div>

      <div className="flex flex-col w-full lg:max-w-1/2 p-4">
        <Link href='/' className="lg:hidden flex items-center gap-1" >
            <h1 className="text-lg font-bold text-gray-900 italic">FeeTrack</h1>
        </Link>

        <LoginForm />
      </div>
    </div>
  )
}

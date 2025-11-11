// app/(auth)/login/page.jsx
import { getUser } from '@/utils/supabase/supabaseQueries';
import { redirect } from 'next/navigation';
import Link from 'next/link';

import SignupForm from './SignupForm';

export default async function SignupPage() {  
  const profile = await getUser();
  if (profile) {
    redirect('/user');
  }
  
  return (
    <div className="w-full min-h-[100dvh] flex items-stretch">
      <div className="hidden lg:flex w-1/2 bg-gray-100 flex-col p-8 ">
        <Link href='/' className="flex items-center gap-1" >
            {/* Logo here */}
            <span className="text-lg font-bold text-gray-900 italic">FeeTrack</span>
        </Link>

        <div className="w-full h-full flex flex-col justify-between mt-12">
            <div className='flex flex-col gap-12'>
                <div className='text-3xl font-bold leading-relaxed '>
                    <h2>Manage your school's fees</h2>
                    <h2>in a <span className='text-primary'>faster, easier and safer </span>way.</h2>
                </div>

                <ul className="list-disc list-inside mt-2 text-gray-700">
                    <li>Easy fee collection and tracking.</li>
                    <li>Modern and comprehensive payment receipts.</li>
                    <li>Comprehensive reporting and analytics.</li>
                    <li>User-friendly interface and 24/7 support.</li>
                </ul>
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

        <SignupForm />
      </div>
    </div>
  )
}

import Link from "next/link"
import UpdatePasswordForm from "./UpdatePassForm"

export default async function UpdatePasswordPage({searchParams}) {
    const params = await searchParams
    const code = params.code

    if (!code) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <p>Invalid reset link. Please request a new reset link.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col w-full p-4 sm:p-8 lg:p-12">
            <Link href='/' className="">
                <h1 className="text-lg font-bold text-gray-900 italic">FeeTrack</h1>
            </Link>

            <div className="w-full max-w-md mx-auto flex flex-col justify-center flex-grow">
                <h1 className="font-bold text-2xl my-4 text-center">Update Password</h1>
            
                <div className="w-full mt-4">
                    <UpdatePasswordForm code={code} />
                </div>
            </div>
        </div>
    )
}
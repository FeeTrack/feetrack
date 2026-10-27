'use client'

import { useState } from "react"
import Link from "next/link"

import { resetPasswordAction } from "./actions"
import Spinner from "@/components/Spinner"

export default function ResetPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [successMessage, setSuccessMessage] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            setLoading(true)
            setError(null)
            setSuccessMessage(null)

            const res = await resetPasswordAction(email)

            if (res?.error) {
                setError(typeof res.error === 'string' ? res.error : 'Failed to send link. Please try again.')
                return
            }

            setSuccessMessage(`If an account exists for ${email}, a password reset link has been sent to it. Please check your inbox and spam folder.`)
        } catch (error) {
            console.error(error)
            setError('Failed to send link. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col w-full p-4 sm:p-8 lg:p-12">
            <Link href='/' className="">
                <h1 className="text-lg font-bold text-gray-900 italic">FeeTrack</h1>
            </Link>

            <div className="w-full max-w-md mx-auto flex flex-col justify-center flex-grow">
                <h1 className="font-bold text-2xl my-4 text-center">Reset Password</h1>
            
                <div className="w-full mt-4">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-700">Email</label>
                            <input 
                                id="email"
                                type="email"
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)}
                                required 
                                className="w-full text-sm border border-gray-300 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" 
                            />
                        </div>

                        {error && (
                            <div className="text-red-700 text-sm text-center">
                                {error}
                            </div>
                        )}

                        {successMessage && (
                            <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-emerald-900 text-sm text-center">
                                {successMessage}
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="primary-btn w-full rounded-full py-2 disabled:opacity-70">
                            {loading ? (
                                <span className="flex justify-center items-center gap-2">
                                    <Spinner size={12} bgColor='white' />
                                    <h4>Sending link...</h4>
                                </span>
                            ) : 'Send Reset Link'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
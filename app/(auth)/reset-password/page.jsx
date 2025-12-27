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

            const res = await resetPasswordAction(email)

            if (res?.error) {
                if (res.error.message) {
                    setError(res.error.message)
                } else {
                    console.error(res.error)
                    setError('Failed to send link. Please try again.')
                }
            }

            setSuccessMessage('If the email is valid, a reset link is sent on it.')
        } catch (error) {
            console.error(error)
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
                            <div className="text-black text-sm text-center">
                                {successMessage}
                            </div>
                        )}

                        <button type="submit" className="primary-btn w-full rounded-full py-2">
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
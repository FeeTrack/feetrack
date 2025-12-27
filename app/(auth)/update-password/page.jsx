'use client'

import { useEffect, useState } from "react"
import Link from "next/link"

import { verifyCodeAction, updatePasswordAction } from "./actions"
import Spinner from "@/components/Spinner"
import { EyeOff, Eye } from "lucide-react"
import { useSearchParams } from "next/navigation"

export default function UpdatePasswordPage() {
    const searchParams = useSearchParams()
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [successMessage, setSuccessMessage] = useState(null)
    const [buttonDisabled, setButtonDisabled] = useState(false)

    useEffect(() => {
        const verifyCode = async () => {
            const code = searchParams.get('code')

            if (!code) {
                setError('Invalid reset link. Please request a new reset link.')
                setButtonDisabled(true)
                return
            }

            try {
                const res = await verifyCodeAction(code)

                if (res.error) {
                    console.error(res.error)
                    setError('Failed to create session. Please request a new reset link.')
                    return
                }
            } catch (error) {
                console.error(error)
                setError('Failed to verify reset link. Please request a new reset link.')
            }
        }

        verifyCode()
    }, [searchParams])

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            setLoading(true)

            const res = await updatePasswordAction(password)

            if (res?.error) {
                console.error(res.error)
                setError('Failed to update password. Please try again.')
                return
            }

            setSuccessMessage('Password updated successfully. Please login.')
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
                <h1 className="font-bold text-2xl my-4 text-center">Update Password</h1>
            
                <div className="w-full mt-4">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium mb-2 text-gray-700">
                                Password
                            </label>
                            <div className="relative">
                                <input 
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    minLength={6}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required 
                                    className="w-full text-sm border border-gray-300 rounded-full px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary" 
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute cursor-pointer top-1/2 -translate-y-1/2 right-3 text-gray-700"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
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

                        <button type="submit" disabled={buttonDisabled} className="primary-btn w-full rounded-full py-2">
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Spinner size={12} bgColor='white' />
                                    <h4>Updating...</h4>
                                </span>
                            ) : 'Update Password'}
                        </button>

                        {successMessage && (
                            <div className="w-full">
                                <Link href='/login' className="w-full flex justify-center primary-btn py-2 rounded-full bg-white text-black hover:bg-gray-100 border border-gray-300 shadow-sm" >
                                    Proceed to login
                                </Link>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    )
}
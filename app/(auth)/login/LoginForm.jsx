"use client"
import { useActionState, useState } from "react"
import { loginAction } from "./actions"
import Link from "next/link"

import Spinner from "@/components/Spinner"

export default function LoginForm() {
    const [state, formAction, pending] = useActionState(loginAction, { error: null })

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    })

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    return (
        <div className="w-full max-w-md mx-auto flex flex-col justify-center flex-grow">
            <h1 className="font-bold text-2xl my-4 text-center">Sign in</h1>

            <div className="w-full mt-4">
                <form action={formAction} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-700">Email</label>
                        <input 
                            name="email" 
                            type="email"
                            value={formData.email} 
                            onChange={handleChange}
                            required 
                            className="w-full text-sm border border-gray-300 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" 
                        />
                    </div>
                    <div>
                        <div className="flex items-center justify-between gap-2 text-gray-700 mb-2 text-sm font-medium">
                            <label htmlFor="password">Password</label>
                            <Link href='/update-password' className="hover:underline text-gray-500">
                                Forgot password?                                
                            </Link>
                        </div>
                        <input
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength={6}
                            className="w-full text-sm border border-gray-300 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
                        />
                    </div>

                    {state?.error && (
                        <div className="text-red-700 text-sm text-center">
                            {state?.error?.code === 'PLAN_EXPIRED' ? (
                                <>
                                    Your school subscription has expired. Please <Link href='/contact' className="underline">upgrade</Link> to continue.
                                </>
                            ) : (
                                state?.error || (
                                    'Unexpected error occurred.'
                                )
                            )}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="primary-btn w-full rounded-full py-2"
                    >
                        {pending ? (
                            <span className="flex justify-center items-center gap-2">
                                <Spinner size={12} bgColor='white' />
                                <h6>Signing in...</h6>
                            </span>
                        ) : "Sign in"}
                    </button>
                </form>
            </div>

            <div className="mt-4 relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative w-full text-center text-sm">
                    <span className="z-10 text-gray-700 bg-white px-2">New to FeeTrack?</span>
                </div>
            </div>

            <div className="mt-4 w-full">
                <Link href='/signup' className="w-full flex justify-center primary-btn py-2 rounded-full bg-white text-black hover:bg-gray-100 border border-gray-300 shadow-sm" >
                    Create an account
                </Link>
            </div>
        </div>
    )
}
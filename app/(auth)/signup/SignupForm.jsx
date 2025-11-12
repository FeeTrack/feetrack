"use client"
import { useActionState, useState } from "react"
import { signupAction } from "./actions"
import Link from "next/link"

import Spinner from "@/components/Spinner"

export default function SignupForm() {
    const [state, formAction, pending] = useActionState(signupAction, { error: null })
    const [clientErrors, setClientErrors] = useState({})

    const [formData, setFormData] = useState({
        schoolName: "",
        schoolAddress: "",
        profileName: "",
        schoolType: "",
        mobileNo: "",
        emailUserName: "",
        password: "",
        confirmPassword: ""
    })

    const schoolTypes = [
        { value: 'preschool', label: 'Pre-school' },
        { value: 'school', label: 'School' },
        { value: 'tuition', label: 'Coaching Centre' },
        { value: 'college', label: 'College' },
    ]

    const validateForm = () => {
        const errors = {}

        if (!formData.schoolName) {
            errors.schoolName = "Please enter school name"
        }
        if (!formData.schoolAddress) {
            errors.schoolAddress = "Please enter school address"
        }
        if (!formData.profileName) {
            errors.profileName = "Please enter your name"
        }
        if (!formData.schoolType) {
            errors.schoolType = "Please enter school type"
        }
        if (!formData.mobileNo) {
            errors.mobileNo = "Please enter the mobile number"
        }
        
        // emailUserName validation
        if (!formData.emailUserName) {
            errors.emailUserName = "emailUserName is required"
        } else if (!/\S+@\S+\.\S+/.test(formData.emailUserName)) {
            errors.emailUserName = "emailUserName is invalid"
        }
        
        // Password validation
        if (!formData.password) {
            errors.password = "Password is required"
        } else if (formData.password.length < 6) {
            errors.password = "Password must be at least 6 characters"
        }
        
        // Confirm password validation
        if (!formData.confirmPassword) {
            errors.confirmPassword = "Please confirm your password"
        } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = "Passwords do not match"
        }
        
        return errors
    }

    const handleSubmit = (e) => {
        const errors = validateForm()
        
        if (Object.keys(errors).length > 0) {
            e.preventDefault() // Prevent form submission
            setClientErrors(errors)
            return
        }
        
        setClientErrors({}) // Clear errors if validation passes
        // Form will submit to server action
    }

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
        // Clear error for this field when user starts typing
        if (clientErrors[e.target.name]) {
            setClientErrors({
                ...clientErrors,
                [e.target.name]: null
            })
        }
    }

    return (
        <div className="w-full max-w-md mx-auto flex flex-col justify-center flex-grow">
            <h1 className="font-bold text-2xl mt-8 mb-4 text-center">Create your account</h1>

            <div className="w-full mt-4">
                <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="schoolName" className="block text-sm font-medium mb-1 text-gray-700">School Name</label>
                        <input
                            name="schoolName"
                            type="text"
                            value={formData.schoolName}
                            onChange={handleChange}
                            className="w-full text-sm border border-gray-300 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        {clientErrors.schoolName && (
                            <p className="text-red-600 text-xs mt-1">{clientErrors.schoolName}</p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="schoolAddress" className="block text-sm font-medium mb-1 text-gray-700">Address</label>
                        <input
                            name="schoolAddress"
                            type="text"
                            value={formData.schoolAddress}
                            onChange={handleChange}
                            className="w-full text-sm border border-gray-300 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        {clientErrors.schoolAddress && (
                            <p className="text-red-600 text-xs mt-1">{clientErrors.schoolAddress}</p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="profileName" className="block text-sm font-medium mb-1 text-gray-700">Your Name</label>
                        <input
                            name="profileName"
                            type="text"
                            value={formData.profileName}
                            onChange={handleChange}
                            className="w-full text-sm border border-gray-300 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        {clientErrors.profileName && (
                            <p className="text-red-600 text-xs mt-1">{clientErrors.profileName}</p>
                        )}
                    </div>
                    <div className="w-full flex items-center gap-4">
                        <div className="w-1/2">
                            <label htmlFor="schoolType" className="block text-sm font-medium mb-1 text-gray-700">School Type</label>
                            <select 
                                name="schoolType" 
                                className="w-full text-sm border border-gray-300 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" 
                                value={formData.schoolType} 
                                onChange={handleChange}
                            >
                                <option value="">Select School Type</option>
                                {schoolTypes.map((type) => (
                                    <option value={type.value} key={type.value}>{type.label}</option>
                                ))}
                            </select>

                            {clientErrors.schoolType && (
                                <p className="text-red-600 text-xs mt-1">{clientErrors.schoolType}</p>
                            )}
                        </div>

                        <div className="w-1/2">
                            <label htmlFor="mobileNo" className="block text-sm font-medium mb-1 text-gray-700">Mobile No</label>
                            <input
                                name="mobileNo"
                                type='tel'
                                pattern='[0-9]{10}'
                                value={formData.mobileNo}
                                onChange={handleChange}
                                className="w-full text-sm border border-gray-300 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            />

                            {clientErrors.mobileNo && (
                                <p className="text-red-600 text-xs mt-1">{clientErrors.mobileNo}</p>
                            )}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="emailUserName" className="block text-sm font-medium mb-1 text-gray-700">Email</label>
                        <input 
                            name="emailUserName" 
                            type="email"
                            value={formData.emailUserName} 
                            onChange={handleChange} 
                            className="w-full text-sm border border-gray-300 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" 
                        />
                        {clientErrors.emailUserName && (
                            <p className="text-red-600 text-xs mt-1">{clientErrors.emailUserName}</p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-gray-700 mb-1 text-sm font-medium">Password</label>
                        <input
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full text-sm border border-gray-300 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
                        />
                        {clientErrors.password && (
                            <p className="text-red-600 text-xs mt-1">{clientErrors.password}</p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1 text-gray-700">Confirm Password</label>
                        <input 
                            name="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="w-full text-sm border border-gray-300 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
                        />
                        {clientErrors.confirmPassword && (
                            <p className="text-red-600 text-xs mt-1">{clientErrors.confirmPassword}</p>
                        )}
                    </div>

                    {state?.error && (
                        <div className="text-red-700 text-sm text-center">
                            {state.error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="primary-btn w-full rounded-full py-2"
                    >
                        {pending ? (
                            <span className="flex justify-center items-center gap-2">
                                <Spinner size={12} bgColor='white' />
                                <h6>Signing up...</h6>
                            </span>
                        ) : "Sign up"}
                    </button>
                </form>
            </div>
            
            <div className="mt-4 relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative w-full text-center text-sm">
                    <span className="z-10 text-gray-700 bg-white px-2">Already have an account?</span>
                </div>
            </div>

            <div className="mt-4 w-full">
                <Link href='/login' className="w-full flex justify-center primary-btn py-2 rounded-full bg-white text-black hover:bg-gray-100 border border-gray-300 shadow-sm" >
                    Log in
                </Link>
            </div>
        </div>
    )
}
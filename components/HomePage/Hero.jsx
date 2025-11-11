'use client'
import { Pencil, Star } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useRef } from "react"

export default function Hero() {
    const terms = ['Faster', 'Easier', 'More Secure']
    const [termIndex, setTermIndex] = useState(0)
    const spanRef = useRef(null)
    const [width, setWidth] = useState(0)

    useEffect(() => {
        // Measure width of current term
        if (spanRef.current) {
            setWidth(spanRef.current.offsetWidth)
        }
    }, [termIndex])

    useEffect(() => {
        const autoTermChange = setInterval(() => {
            setTermIndex((prev) => prev === terms.length - 1 ? 0 : prev + 1);
        }, 5000)

        return () => clearInterval(autoTermChange)
    }, [])

    return (
        <div className="w-full relative max-w-7xl flex flex-col items-center gap-8 p-2 md:gap-12">
            <div className="mt-16 flex flex-col items-center gap-4">
                <h1 className="text-4xl lg:text-5xl font-bold">Manage Educational Fees</h1>
                <h1 className="text-4xl lg:text-5xl font-bold flex items-center justify-center">
                    <span 
                        className="inline-block overflow-hidden transition-[width] duration-700 ease-in-out"
                        style={{ width: `${width}px` }}
                    >
                        <span 
                            ref={spanRef}
                            key={termIndex} 
                            className="text-primary inline-block whitespace-nowrap animate-fade-word" 
                        >
                            {terms[termIndex]}
                        </span>
                    </span>
                    <span className="ml-2">Than Ever</span>
                </h1>
            </div>

            <p className="w-full px-2 max-w-3xl text-center lg:text-lg text-gray-900">
                Easily manage student data and fee collection — perfectly aligned with your academic structure, with custom features for schools, coaching centres and colleges.
            </p>
        
            <div className="flex items-center gap-4 md:gap-8">
                <Link href='/signup' className="primary-btn rounded-full text-lg px-6 py-2" >
                    Try for Free
                </Link>

                <Link href='/contact' className="primary-btn bg-white text-gray-900 hover:bg-gray-100 border border-gray-300 shadow-xs rounded-full text-lg px-6 py-2" >
                    Get a demo
                </Link>
            </div>

            <div className="w-full px-2 max-w-3xl flex items-center justify-center gap-1 text-sm font-medium text-gray-700">
                <Star className="w-4 h-4" />
                <p>Trusted by 50+ schools and coaching centres.</p>
            </div>
        </div>
    )
}
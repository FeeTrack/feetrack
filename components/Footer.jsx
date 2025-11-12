import Link from "next/link"

import { UilLinkedin } from '@iconscout/react-unicons'
import { UilGlobe } from '@iconscout/react-unicons'

export default function Footer() {
    const socials = [
        { 
            icon: <UilGlobe className='text-gray-700' size='24px' />,
            href: 'https://krishnaupadhyay.vercel.app',
            label: 'FeeTrack Makers Website'
        },
        { 
            icon: <UilLinkedin className='text-gray-700' size='24px' />,
            href: 'https://www.linkedin.com/in/krishnaupadhyay11',
            label: 'FeeTrack LinkedIn'
        }
    ]    

    return (
        <div className="w-full bg-gray-50 mt-16 flex justify-center">
            <div className="w-full max-w-5xl flex flex-col md:flex-row items-center justify-between gap-8 px-4 py-8">
                <h1 className="text-4xl font-bold text-gray-900 italic">FeeTrack</h1>

                <div className="flex items-center justify-center gap-4">
                    {socials.map((social, index) => (
                        <Link key={index} href={social.href} aria-label={social.label}>
                            {social.icon}
                        </Link>
                    ))}
                    <Link href='https://x.com/feetrack.official' className='text-gray-700 w-5 h-5' >
                        <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <title>X</title>
                            <path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"/>
                        </svg>
                    </Link>
                </div>
                
                <p className="text-gray-700 text-sm">© 2025 FeeTrack.</p>
            </div>
        </div>
    )
}
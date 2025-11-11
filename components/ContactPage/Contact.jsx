import {UilTelegramAlt} from '@iconscout/react-unicons';
import {UilWhatsapp} from '@iconscout/react-unicons';

export default function Contact() {
    return (
        <div className="w-full max-w-7xl flex flex-col items-center mt-8 gap-8 py-2 px-4 min-h-[calc(100vh-200px)]">
            <h1 className="text-4xl font-bold text-center mb-2">Contact us</h1>

            <div className="w-full max-w-3xl flex flex-col gap-8 items-center">
                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
                    <div className="flex items-center gap-1 text-gray-900">
                        <UilTelegramAlt className="w-5 h-5"/> 
                        <h2 className='text-2xl font-medium'>Drop an email</h2>
                    </div>

                    <a aria-label="Mail to FeeTrack" href="mailto:contact.feetrack@gmail.com" className="text-gray-700 decoration-0 text-2xl">
                        contact.feetrack@gmail.com
                    </a>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
                    <div className="flex items-center gap-1 text-gray-900">
                        <UilWhatsapp className="w-5 h-5" /> 
                        <h2 className='text-2xl font-medium'>WhatsApp</h2>
                    </div>

                    <a aria-label="Chat on WhatsApp" href="https://wa.me/917906592161" className='text-gray-700 decoration-0 text-2xl'>
                        +91-7906592161
                    </a>
                </div>
            </div>
        </div>
    )
}
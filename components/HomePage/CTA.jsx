import Link from "next/link";

export default function CTA() {
    return (
        <div className="w-full max-w-7xl mt-8 flex flex-col items-center gap-8 py-2 px-4">
            <h1 className="text-4xl font-bold text-center">Ready to simplify fee management?</h1>

            <div className="flex items-center gap-4 md:gap-8">
                <Link href='/signup' className="primary-btn rounded-full text-lg px-6 py-2" >
                    Try for Free
                </Link>

                <Link href='/contact' className="primary-btn bg-white text-gray-900 hover:bg-gray-100 border border-gray-300 shadow-xs rounded-full text-lg px-6 py-2" >
                    Get a demo
                </Link>
            </div>
        </div>
    )
}
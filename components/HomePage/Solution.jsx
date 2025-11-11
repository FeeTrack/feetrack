import { CheckCircle } from "lucide-react"

export default function Solution() {
    const features = [
        "Free 7-day trial and affordable plans based on number of students.",
        "Easy fee collection and tracking, featuruing late fee and discounts.",
        "Modern, comprehensive and shareable payment receipts.",
        "Custom features for schools, coaching centres and colleges.",
        "User-friendly dashboard and modern UI.",        
    ]

    return (
        <div className="w-full max-w-7xl mt-8 flex flex-col items-center gap-8 py-2 px-4" id="features">
            <h2 className="text-4xl font-bold text-center">How We Solve It</h2>
            
            <div className="w-full max-w-2xl rounded-md bg-gray-50 border border-gray-200 shadow-sm p-4 mt-2 flex flex-col items-start gap-4">
                {features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-900 ">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <p className="font-medium">{feature}</p>
                    </div>
                ))}
            </div>

        </div>
    )
}
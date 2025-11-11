export default function Problem() {
    const problems = [
        {
            avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Jack&radius=50&backgroundColor=d1d4f9',
            heading: 'Affordability',
            desc: "The fee management softare's pricing is half of monthly revenue!"
        },
        {
            avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Liliana&radius=50&backgroundColor=ffdfdc',
            heading: 'Complexity',
            desc: "I find it difficult to use the complex ERPs."
        },
        {
            avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Nolan&radius=50&backgroundColor=c0aede',
            heading: 'Outdated',
            desc: "Most of the existing ERPs feel like 90s UI."
        },

    ]

    return (
        <div className="w-full max-w-7xl mt-8 flex flex-col items-center gap-8 py-2 px-4">
            <h2 className="text-4xl font-bold text-center"><span>Your Problem</span> <br/> <span>Our Solution</span></h2>

            <p className="w-full px-2 max-w-3xl text-center text-gray-900 font-medium">
                Many schools and most of the tuition centres do not get access to digital tools for managing fee.
            </p>

            <div className="w-full max-w-xl flex flex-col items-start gap-6 p-2">
                {problems.map((problem, index) => (
                    <div key={index} className="flex items-start gap-1 w-full">
                        <img src={problem.avatar} alt="Sample User Avatar" className="w-10 h-10 rounded-full" />

                        <div className="w-full rounded-b-lg rounded-tr-lg flex flex-col items-start gap-1 text-gray-900 bg-gray-50 border border-gray-200 shadow-sm p-2">
                            <h4 className="font-medium">{problem.heading}</h4>
                            <p className="text-sm">{problem.desc}</p>
                        </div>

                    </div>
                ))}
            </div>
        </div>
    )
}
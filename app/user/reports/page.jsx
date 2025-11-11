import { Hourglass } from "lucide-react";
import UserLayout from "../UserLayout";

export default async function ReportsPage() {
    return (
        <UserLayout pageName='Reports'>
            <div className="w-full h-full flex justify-center items-center">
                <div className="flex items-center gap-2">
                    <Hourglass className="h-6 w-6" />
                    <h2 className="font-bold">Coming Soon...</h2>
                </div>
            </div>
        </UserLayout>
    )
}
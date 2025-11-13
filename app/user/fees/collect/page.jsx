import UserLayout from "../../UserLayout";
import CollectFeesClient from "./CollectFeesClient";

export const metadata = {
    title: 'Collect Fee | FeeTrack',
    description: 'The page to collect student fee.'
}

export default async function CollectFeesPage() {
    return (
        <UserLayout pageName='Collect Fees'>
            <CollectFeesClient />
        </UserLayout>
    )
}
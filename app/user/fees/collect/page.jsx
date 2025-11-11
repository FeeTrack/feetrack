'use server'

import UserLayout from "../../UserLayout";
import CollectFeesClient from "./CollectFeesClient";

export default async function CollectFeesPage() {
    return (
        <UserLayout pageName='Collect Fees'>
            <CollectFeesClient />
        </UserLayout>
    )
}
import NormalHeader from "@/components/NormalHeader";
import Contact from "@/components/ContactPage/Contact";
import Footer from "@/components/Footer";

export const metadata = {
    title: 'Contact | FeeTrack',
    description: 'The contact page of FeeTrack'
}

export default function ContactPage() {
    return (
        <div className="w-full flex flex-col items-center">
            <NormalHeader />
            <Contact />
            <Footer />
        </div>
    )
}
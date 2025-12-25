import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "FeeTrack - Fee Management App for Schools, Coaching Centres and Colleges",
  description: "FeeTrack is a modern, complete, and user-friendly solution to manage student data and fee collection - with custom features for schools, coaching centres and colleges.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Toaster
          position="top-right"
          toastOptions={{
            style: {  
              marginTop: "24px",
              marginRight: "24px",
            },
            success: {
              duration: 5000,
              style: {
                backgroundColor: "#faf5ff",
                border: "1px solid #7c3aed",
              }
            },
            loading: {
              duration: 5000,
              style: {
                backgroundColor: "#faf5ff",
                border: "1px solid #7c3aed",
              }
            },
            error: {
              duration: 8000,
              style: {
                backgroundColor: "#fef2f2",
                border: "1px solid #fb2c36",
              }
            }
          }}
        />
        {children}
      </body>
    </html>
  );
}

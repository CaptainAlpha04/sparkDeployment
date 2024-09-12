import "./globals.css"; // Global CSS styles
import { ReactNode } from "react";
import localFont from 'next/font/local';
import {Poppins, Josefin_Sans, Audiowide} from 'next/font/google';
import Header from "./components/Header";
import Footer from "./components/Footer";

const poppins = Poppins({ subsets: ["latin"], variable: "--font-poppins",
  weight: ["100", "200", "300", "400", "500", "600", "700"] });

const josefin = Josefin_Sans({ subsets: ["latin"], variable: "--font-josefin", 
  weight: ["100", "200", "300", "400", "500", "600", "700"] });

const audiowide = Audiowide({ subsets: ["latin"], variable: "--font-audiowide",
  weight: ["400"] });

const Azonix = localFont(
  {
    src: [
      {
        path: "../public/fonts/Azonix.otf",
        style: "normal",
        weight: "400 700",  
      }
    ]
  }
);

export const metadata = {
  title: "Spark Web",
  description: "A web app for spark updates",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={josefin.className}>
        <Header />
        <main className="text-base-content overflow-x-hidden w-screen bg-base-300">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

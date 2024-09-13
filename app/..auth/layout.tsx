import "../globals.css"; // Global CSS styles
import { ReactNode } from "react";
import React from "react";


    export const metadata = {
    title: "Spark Web",
    description: "A web app for spark updates",
    };

    export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <div>
            {children}
        </div>
    );
    }

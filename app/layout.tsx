// app/layout.tsx
import "./globals.css"; // Global CSS styles
import { ReactNode } from "react";

export const metadata = {
  title: "Spark Web",
  description: "A web app for spark updates",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-100 text-gray-900">
        <header className="bg-blue-600 text-white shadow-md">
          <nav className="max-w-7xl mx-auto px-4 py-3">
            <ul className="flex space-x-4">
              <li>
                <a
                  href="/"
                  className="hover:bg-blue-700 px-3 py-2 rounded transition duration-300"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="/events"
                  className="hover:bg-blue-700 px-3 py-2 rounded transition duration-300"
                >
                  Events
                </a>
              </li>
              <li>
                <a
                  href="/register"
                  className="hover:bg-blue-700 px-3 py-2 rounded transition duration-300"
                >
                  Register
                </a>
              </li>
              <li>
                <a
                  href="/admin"
                  className="hover:bg-blue-700 px-3 py-2 rounded transition duration-300"
                >
                  Admin
                </a>
              </li>
            </ul>
          </nav>
        </header>
        <main className="py-8 px-4">
          {children}
        </main>
      </body>
    </html>
  );
}

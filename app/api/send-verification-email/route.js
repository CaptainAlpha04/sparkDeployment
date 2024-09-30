//app/api/send-verification-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";

// Configure nodemailer
const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// API Route for sending verification email
export async function POST(request) {
    try {
        const { email, token } = await request.json();

        const baseUrl =
            process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

        const verificationUrl = `${baseUrl}/api/verify-email?token=${token}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Verify Your Email",
            html: `<p>Click <a href="${verificationUrl}">here</a> to verify your email address.</p>`,
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json({ message: "Verification email sent" });
    } catch (error) {
        console.error("Error sending email:", error);
        return NextResponse.json(
            { error: "Error sending email" },
            { status: 500 }
        );
    }
}

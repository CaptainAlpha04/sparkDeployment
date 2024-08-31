"use client";
import { useRouter } from 'next/navigation';

export default function SuccessPage() {
  const router = useRouter();

  const handleHomeRedirect = () => {
    router.push('/');
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh', // Full viewport height
        textAlign: 'center',
        padding: '20px',

      }}
    >
      <div>
        <h1>Email Verified Successfully!</h1>
        <p>Your email address has been verified. You can now return to the home page.</p>
        <button onClick={handleHomeRedirect}>Go to Home</button>
      </div>
    </div>
  );
}

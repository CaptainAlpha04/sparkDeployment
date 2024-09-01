"use client";
import { useRouter } from 'next/navigation';

export default function SuccessPage() {
  const router = useRouter();

  const handleHomeRedirect = () => {
    router.push('/auth/login');
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
        <h1 className='text-2xl flex gap-2 justify-center'>Email Verified Successfully!
        <i className="fi fi-ss-badge-check text-emerald-500"></i>
        </h1>
        <p>Your email address has been verified. You can now Log in.</p>
        <button onClick={handleHomeRedirect} className='btn btn-neutral mt-2'>Login Now</button>
      </div>
    </div>
  );
}

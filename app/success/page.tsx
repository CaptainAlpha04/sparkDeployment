// app/success/page.tsx
import { useRouter } from 'next/navigation';

export default function SuccessPage() {
  const router = useRouter();

  const handleHomeRedirect = () => {
    router.push('/');
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Email Verified Successfully!</h1>
      <p>Your email address has been verified. You can now return to the home page.</p>
      <button onClick={handleHomeRedirect}>Go to Home</button>
    </div>
  );
}

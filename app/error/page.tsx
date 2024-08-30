import React from 'react';
export default function ErrorPage() {
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
        <h1>Error Verifying Email</h1>
        <p>There was an issue verifying your email address. Please try again or contact support.</p>
      </div>
    </div>
    );
  }
  
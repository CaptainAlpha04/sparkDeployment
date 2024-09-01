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
        <h1 className='text-2xl flex gap-2 justify-center'>
          Error Verifying Email
          <i className="fi fi-ss-cross-circle text-rose-500"></i>
          </h1>
        <p>There was an issue verifying your email address. <br /> Please try again or contact support.</p>
      </div>
    </div>
    );
  }
  
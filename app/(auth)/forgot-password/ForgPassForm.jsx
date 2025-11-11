//UpdatePasswordPage.jsx

// import { useEffect, useState } from 'react';
// import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// export default function UpdatePasswordPage() {
//   const supabase = createClientComponentClient();
//   const [password, setPassword] = useState('');
//   const [message, setMessage] = useState('');

//   // Restore the session from the recovery link
//   useEffect(() => {
//     const hash = window.location.hash;
//     if (hash.includes('type=recovery')) {
//       supabase.auth
//         .getSessionFromUrl({ storeSession: true })
//         .then(({ data, error }) => {
//           if (error) console.error('Error restoring session:', error);
//         });
//     }
//   }, [supabase]);

//   const handleUpdatePassword = async (e) => {
//     e.preventDefault();
//     const { data, error } = await supabase.auth.updateUser({ password });
//     if (error) {
//       setMessage(`Error: ${error.message}`);
//     } else {
//       setMessage('✅ Password updated successfully!');
//     }
//   };

//OR no state.error
if (!error) {
  setMessage('Password updated successfully!');
  setTimeout(() => {
    window.location.href = '/login';
  }, 1500);
}


//   return (
//     <div style={{ maxWidth: 400, margin: '50px auto' }}>
//       <h2>Reset Your Password</h2>
//       <form onSubmit={handleUpdatePassword}>
//         <input
//           type="password"
//           placeholder="New password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           style={{ width: '100%', padding: 8, marginBottom: 10 }}
//         />
//         <button type="submit">Update Password</button>
//       </form>
//       {message && <p>{message}</p>}
//     </div>
//   );
// }


//ForgotPassword
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: 'http://localhost:3000/update-password',
});


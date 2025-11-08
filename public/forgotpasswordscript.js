import { auth, sendPasswordResetEmail } from './firebaseauth.js';

const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const emailInput = document.getElementById('email');
const messageDiv = document.getElementById('resetMessage');
const submitButton = document.getElementById('submitReset');


// Helper to show messages
function showMessage(message, isError = true) {
    messageDiv.textContent = message;
    messageDiv.style.backgroundColor = isError ? '#f8d7da' : '#d4edda';
    messageDiv.style.color = isError ? '#721c24' : '#155724';
    messageDiv.style.display = 'block';
}

forgotPasswordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    if (!email) {
        showMessage('Please enter your email address.');
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';

    // This URL is where Firebase will redirect the user *after* they click the email link.
    // It *must* be your live website URL.
    const actionCodeSettings = {
        url: 'https://trial-flame-eta.vercel.app/reset-password.html', // <-- IMPORTANT
        handleCodeInApp: true,
    };

    sendPasswordResetEmail(auth, email, actionCodeSettings)
        .then(() => {
            showMessage('Password reset email sent! Check your inbox.', false);
            forgotPasswordForm.style.display = 'none'; // Hide form on success
        })
        .catch((error) => {
            if (error.code === 'auth/user-not-found') {
                showMessage('No account found with that email address.');
            } else {
                showMessage('Error sending reset email. Please try again.');
            }
            console.error("Password Reset Error:", error);
            submitButton.disabled = false;
            submitButton.textContent = 'Send Reset Link';
        });
});

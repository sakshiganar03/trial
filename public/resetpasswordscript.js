import { auth, confirmPasswordReset, verifyPasswordResetCode } from './firebaseauth.js';

// Get elements
const resetPasswordForm = document.getElementById('resetPasswordForm');
const newPasswordInput = document.getElementById('newPassword');
const messageDiv = document.getElementById('resetMessage');
const loadingMessage = document.getElementById('loadingMessage');
const signInLink = document.getElementById('signInLink');
const submitButton = document.getElementById('submitNewPassword');

// Helper to show messages
function showMessage(message, isError = true) {
    messageDiv.textContent = message;
    messageDiv.style.backgroundColor = isError ? '#f8d7da' : '#d4edda';
    messageDiv.style.color = isError ? '#721c24' : '#155724';
    messageDiv.style.display = 'block';
}

// 1. Get the reset code from the URL
const urlParams = new URLSearchParams(window.location.search);
const oobCode = urlParams.get('oobCode'); // This is the reset code

if (!oobCode) {
    loadingMessage.textContent = 'Invalid or missing reset code.';
    loadingMessage.style.color = 'var(--error-color)';
    signInLink.style.display = 'block';
} else {
    // 2. Verify the code is valid
    verifyPasswordResetCode(auth, oobCode)
        .then((email) => {
            // Code is valid, show the form
            loadingMessage.style.display = 'none';
            resetPasswordForm.style.display = 'block';
            
            // Add email to a message if you want
            showMessage(`You are resetting the password for ${email}.`, false);
            messageDiv.style.display = 'none'; // Or hide it
        })
        .catch((error) => {
            // Code is invalid or expired
            loadingMessage.textContent = 'This link is invalid or has expired. Please try again.';
            loadingMessage.style.color = 'var(--error-color)';
            signInLink.style.display = 'block';
            console.error("Verify Code Error:", error);
        });
}

// 3. Handle the new password submission
resetPasswordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newPassword = newPasswordInput.value;
    
    if (newPassword.length < 6) {
        showMessage('Password must be at least 6 characters long.');
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Saving...';

    // 4. Confirm the new password with Firebase
    confirmPasswordReset(auth, oobCode, newPassword)
        .then(() => {
            showMessage('Password has been reset successfully!', false);
            resetPasswordForm.style.display = 'none'; // Hide form
            signInLink.style.display = 'block'; // Show sign in link
        })
        .catch((error) => {
            showMessage('Error resetting password. The link may have expired.');
            console.error("Confirm Reset Error:", error);
            submitButton.disabled = false;
            submitButton.textContent = 'Save New Password';
        });
});
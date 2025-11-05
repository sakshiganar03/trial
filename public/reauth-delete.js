import {
    auth, onAuthStateChanged,
    db, collection, doc, getDocs, deleteDoc,
    provider, EmailAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup, deleteUser
} from './firebaseauth.js';

// Get elements
const messageDiv = document.getElementById('message');
const loadingMessage = document.getElementById('loading-message');
const passwordForm = document.getElementById('password-form');
const googleForm = document.getElementById('google-form');
const passwordInput = document.getElementById('password');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const googleReauthBtn = document.getElementById('google-reauth-btn');
const confirmDeleteGoogleBtn = document.getElementById('confirm-delete-google-btn');
const cancelLink = document.getElementById('cancel-link');

// Helper to show messages
function showMessage(message, isError = true) {
    messageDiv.textContent = message;
    messageDiv.style.backgroundColor = isError ? '#f8d7da' : '#d4edda';
    messageDiv.style.color = isError ? '#721c24' : '#155724';
    messageDiv.style.display = 'block';
}

// This is the main function that deletes everything
async function deleteUserAndData(user) {
    const uid = user.uid;
    showMessage('Deleting your data... Please wait.', false);
    cancelLink.style.display = 'none'; // Prevent navigating away

    try {
        // Step 1: Delete all chat documents in the subcollection
        const chatsCollectionRef = collection(db, 'users', uid, 'chats');
        const chatsSnapshot = await getDocs(chatsCollectionRef);
        const deletePromises = [];
        chatsSnapshot.forEach(chatDoc => {
            deletePromises.push(deleteDoc(chatDoc.ref));
        });
        await Promise.all(deletePromises);
        
        // Step 2: Delete the user's profile document
        const userDocRef = doc(db, 'users', uid);
        await deleteDoc(userDocRef);
        
        // Step 3: Delete the user from Firebase Auth
        await deleteUser(user);
        
        alert("Account deleted successfully.");
        window.location.href = 'login.html'; // Redirect to login page

    } catch (error) {
        showMessage("An error occurred. We could not delete your account. Please sign out and sign back in to try again.");
        console.error("Delete account error:", error);
        cancelLink.style.display = 'block';
    }
}

// Check auth state on page load
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // Not logged in, send to login page
        window.location.href = 'login.html';
        return;
    }

    // User is logged in, check their provider
    const providerId = user.providerData[0].providerId;
    loadingMessage.style.display = 'none'; // Hide loading

    if (providerId === 'password') {
        // Show password form
        passwordForm.style.display = 'block';

        // Add listener for password form
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = passwordInput.value;
            if (!password) {
                showMessage("Please enter your password.");
                return;
            }

            confirmDeleteBtn.disabled = true;
            confirmDeleteBtn.textContent = 'Verifying...';

            try {
                // 1. Get credential
                const credential = EmailAuthProvider.credential(user.email, password);
                // 2. Re-authenticate
                await reauthenticateWithCredential(user, credential);
                
                // 3. Re-auth successful, proceed to deletion
                confirmDeleteBtn.textContent = 'Deleting...';
                await deleteUserAndData(user);

            } catch (error) {
                if (error.code === 'auth/wrong-password') {
                    showMessage("Wrong password. Please try again.");
                } else {
                    showMessage("An error occurred. Please try again.");
                }
                console.error("Password Re-auth error:", error);
                confirmDeleteBtn.disabled = false;
                confirmDeleteBtn.textContent = 'Confirm & Delete Account';
            }
        });

    } else if (providerId === 'google.com') {
        // Show Google re-auth form
        googleForm.style.display = 'block';

        // Listener for Google Re-auth button
        googleReauthBtn.addEventListener('click', async () => {
            googleReauthBtn.disabled = true;
            googleReauthBtn.textContent = 'Opening popup...';
            try {
                // 1. Re-authenticate with Google
                await reauthenticateWithPopup(user, provider);
                
                // 2. Re-auth successful, unlock the delete button
                showMessage("Authentication successful. You can now delete your account.", false);
                confirmDeleteGoogleBtn.disabled = false;
                googleReauthBtn.style.display = 'none'; // Hide re-auth button

            } catch (error) {
                if (error.code !== 'auth/cancelled-popup-request') {
                     showMessage("An error occurred during re-authentication.");
                }
                console.error("Google Re-auth error:", error);
                googleReauthBtn.disabled = false;
                googleReauthBtn.textContent = 'Confirm with Google';
            }
        });

        // Listener for the final "Delete" button (for Google users)
        confirmDeleteGoogleBtn.addEventListener('click', async () => {
            confirmDeleteGoogleBtn.disabled = true;
            confirmDeleteGoogleBtn.textContent = 'Deleting...';
            await deleteUserAndData(user);
        });

    } else {
        // Other providers (Facebook, etc.) not supported
        loadingMessage.textContent = `Account deletion for ${providerId} is not supported.`;
        loadingMessage.style.display = 'block';
    }
});
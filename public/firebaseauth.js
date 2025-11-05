import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    // --- NEW IMPORTS ---
    EmailAuthProvider,
    reauthenticateWithCredential,
    reauthenticateWithPopup,
    deleteUser
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
// --- MODIFIED ---
// Import all the Firestore functions we will need
import {
    getFirestore, setDoc, doc, getDoc,
    collection, getDocs, updateDoc, deleteDoc, query, where, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// IMPORTANT: Replace with your actual Firebase config object
const firebaseConfig = {
    apiKey: "AIzaSyCMeEts04ZPLHBxttSanASoalkISCHi-S4",
    authDomain: "edith-d0711.firebaseapp.com",
    projectId: "edith-d0711",
    storageBucket: "edith-d0711.appspot.com",
    messagingSenderId: "944958171489",
    appId: "1:944958171489:web:12abea4291ee7291efbd20",
    measurementId: "G-ZHGTEKXT9Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore(); // db is already initialized, we just need to export it
const provider = new GoogleAuthProvider();


// --- Helper Functions ---
function showMessage(elementId, message, isError = true) {
    const messageElement = document.getElementById(elementId);
    if (!messageElement) return;
    messageElement.textContent = message;
    messageElement.style.backgroundColor = isError ? '#f8d7da' : '#d4edda';
    messageElement.style.color = isError ? '#721c24' : '#155724';
    messageElement.style.display = 'block';
}

function redirectToChat(username) {
    // This is a more robust way to save the username
    if (username) {
        localStorage.setItem('edith_username', username);
    }
    window.location.href = 'index.html';
}

// --- Sign Up Logic ---
const submitSignUp = document.getElementById('submitSignUp');
if (submitSignUp) {
    submitSignUp.addEventListener('click', (event) => {
        event.preventDefault();
        const email = document.getElementById('rEmail').value;
        const password = document.getElementById('rPassword').value;
        const firstName = document.getElementById('fName').value;
        const lastName = document.getElementById('lName').value;

        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                const userData = {
                    firstName: firstName,
                    lastName: lastName,
                    email: email
                };
                // We create the user's profile doc here
                return setDoc(doc(db, "users", user.uid), userData)
                    .then(() => {
                        showMessage('signUpMessage', 'Account Created Successfully!', false);
                        setTimeout(() => redirectToChat(firstName), 1000);
                    });
            })
            .catch((error) => {
                if (error.code === 'auth/email-already-in-use') {
                    showMessage('signUpMessage', 'Email Address Already Exists!');
                } else {
                    showMessage('signUpMessage', 'Unable to create account. Please try again.');
                }
            });
    });
}

// --- Sign In Logic ---
const submitSignIn = document.getElementById('submitSignIn');
if (submitSignIn) {
    submitSignIn.addEventListener('click', (event) => {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        signInWithEmailAndPassword(auth, email, password)
            .then(async (userCredential) => {
                const user = userCredential.user;
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);

                let username = 'User';
                if (docSnap.exists()) {
                    username = docSnap.data().firstName;
                }

                showMessage('signInMessage', 'Login is successful!', false);
                setTimeout(() => redirectToChat(username), 1000);
            })
            .catch((error) => {
                if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                    showMessage('signInMessage', 'Incorrect Email or Password.');
                } else {
                    showMessage('signInMessage', 'Unable to sign in. Please try again.');
                }
            });
    });
}

// --- Google Sign-In Logic ---
const googleSignInBtn = document.getElementById('googleSignIn');
const googleSignUpBtn = document.getElementById('googleSignUp');

const signInWithGoogle = () => {
    signInWithPopup(auth, provider)
        .then((result) => {
            const user = result.user;
            const firstName = user.displayName.split(' ')[0];
            redirectToChat(firstName);
        })
        .catch((error) => {
            console.error("Google Sign-In Error:", error);
            // This is the error you are seeing. It's likely because the domain is not authorized.
            showMessage('signInMessage', 'Could not sign in with Google. Please try again.');
        });
};

if (googleSignInBtn) googleSignInBtn.addEventListener('click', signInWithGoogle);
if (googleSignUpBtn) googleSignUpBtn.addEventListener('click', signInWithGoogle);


// --- NEW: Forgot Password Logic ---
const forgotPasswordLink = document.getElementById('forgot-password-link');
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (event) => {
        event.preventDefault();
        const email = prompt("Please enter your email address to reset your password:");
        
        if (email) {
            sendPasswordResetEmail(auth, email)
                .then(() => {
                    showMessage('signInMessage', 'Password reset email sent! Check your inbox.', false);
                })
                .catch((error) => {
                    if (error.code === 'auth/user-not-found') {
                        showMessage('signInMessage', 'No account found with that email address.');
                    } else {
                        showMessage('signInMessage', 'Error sending reset email. Please try again.');
                    }
                    console.error("Password Reset Error:", error);
                });
        }
    });
}

// --- NEW: Function to get user profile data ---
// This function will be exported so other scripts can use it.
async function getUserProfileData() {
    const user = auth.currentUser;
    if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data();
        } else if (user.displayName) {
            // Fallback for Google sign-in users
            return {
                firstName: user.displayName.split(' ')[0],
                lastName: user.displayName.split(' ').slice(1).join(' '),
                email: user.email
            };
        } else {
            // Fallback if no data at all
            return {
                firstName: "User",
                lastName: "",
                email: user.email
            };
        }
    }
    return null; // No user is signed in
}

// --- EXPORTS (MODIFIED) ---
// We export the necessary services and functions for other scripts to use.
export {
    auth,
    db, 
    provider, // <-- NEW EXPORT
    onAuthStateChanged,
    signOut,
    getUserProfileData,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    sendPasswordResetEmail, // (This was from last time)
    // --- NEW EXPORTS ---
    EmailAuthProvider,
    reauthenticateWithCredential,
    reauthenticateWithPopup,
    deleteUser
};

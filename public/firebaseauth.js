import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, setDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
const db = getFirestore();

// --- Helper Functions ---
function showMessage(elementId, message, isError = true) {
    const messageElement = document.getElementById(elementId);
    messageElement.textContent = message;
    messageElement.style.backgroundColor = isError ? '#f8d7da' : '#d4edda';
    messageElement.style.color = isError ? '#721c24' : '#155724';
    messageElement.style.display = 'block';
}

function redirectToChat(username) {
    // Save the username for the main chat page
    localStorage.setItem('edith_username', username);
    // Redirect to the main chat page
    window.location.href = 'index.html';
}

// --- Sign Up Logic ---
const submitSignUp = document.getElementById('submitSignUp');
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
            return setDoc(doc(db, "users", user.uid), userData)
                .then(() => {
                    showMessage('signUpMessage', 'Account Created Successfully!', false);
                    setTimeout(() => redirectToChat(firstName), 1000); // Redirect after a short delay
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

// --- Sign In Logic ---
const submitSignIn = document.getElementById('submitSignIn');
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
            setTimeout(() => redirectToChat(username), 1000); // Redirect after a short delay
        })
        .catch((error) => {
            if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                showMessage('signInMessage', 'Incorrect Email or Password.');
            } else {
                showMessage('signInMessage', 'Unable to sign in. Please try again.');
            }
        });
});

// --- Google Sign-In Logic ---
const googleSignInBtn = document.getElementById('googleSignIn');
const googleSignUpBtn = document.getElementById('googleSignUp');
const provider = new GoogleAuthProvider();

const signInWithGoogle = () => {
    signInWithPopup(auth, provider)
        .then((result) => {
            const user = result.user;
            const firstName = user.displayName.split(' ')[0];
            redirectToChat(firstName);
        })
        .catch((error) => {
            console.error("Google Sign-In Error:", error);
            showMessage('signInMessage', 'Could not sign in with Google. Please try again.');
        });
};

if (googleSignInBtn) googleSignInBtn.addEventListener('click', signInWithGoogle);
if (googleSignUpBtn) googleSignUpBtn.addEventListener('click', signInWithGoogle);

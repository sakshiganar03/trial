const signUpButton = document.getElementById('signUpButton');
const signInButton = document.getElementById('signInButton');
const signInForm = document.getElementById('signIn');
const signUpForm = document.getElementById('signup');

if (signUpButton) {
    signUpButton.addEventListener('click', function(){
        signInForm.style.display = "none";
        signUpForm.style.display = "block";
    });
}

if (signInButton) {
    signInButton.addEventListener('click', function(){
        signInForm.style.display = "block";
        signUpForm.style.display = "none";
    });
}

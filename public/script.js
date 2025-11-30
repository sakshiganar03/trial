// --- Firebase Imports (MODIFIED) ---
import {
    auth, onAuthStateChanged, signOut, getUserProfileData,
    db, collection, doc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, 
    onSnapshot, // <-- ADDED onSnapshot
    query, orderBy,
    provider, EmailAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup, deleteUser
} from './firebaseauth.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- UI Element References ---
    // (This section is unchanged)
    const sidebar = document.getElementById('sidebar');
    const openSidebarBtn = document.getElementById('open-sidebar-btn');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    const aboutUsModal = document.getElementById('about-us-modal');
    const aboutUsBtn = document.getElementById('about-us-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const newChatBtn = document.getElementById('new-chat-btn');
    const chatHistoryContainer = document.getElementById('chat-history-container');
    const queryForm = document.getElementById('query-form');
    const queryInput = document.getElementById('query-input');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');
    const chatContainer = document.getElementById('chat-container');
    const welcomeMessage = document.getElementById('welcome-message');
    const mainHeading = document.querySelector('.main-heading');
    const signInBtn = document.getElementById('sign-in-btn');
    const profileAvatarBtn = document.getElementById('profile-avatar-btn');
    const settingsPage = document.getElementById('settings-page');
    const settingsBackBtn = document.getElementById('settings-back-btn');
    const editProfilePage = document.getElementById('edit-profile-page');
    const profileBackBtn = document.getElementById('profile-back-btn');
    const editProfileLink = document.getElementById('edit-profile-link');
    const aboutLink = document.getElementById('about-link');
    const signOutBtn = document.getElementById('sign-out-btn');
    const profileFirstNameDisplay = document.getElementById('profile-firstname');
    const profileLastNameDisplay = document.getElementById('profile-lastname');
    const profileEmailDisplay = document.getElementById('profile-email');
    // --- NEW: Delete Modal UI References ---
    const deleteChatModal = document.getElementById('delete-chat-modal');
    const deleteModalText = document.getElementById('delete-modal-text');
    const deleteModalCancelBtn = document.getElementById('delete-modal-cancel-btn');
    const deleteModalConfirmBtn = document.getElementById('delete-modal-confirm-btn');
    // --- NEW: Delete Account Button ---
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    // --- NEW: Delete ACCOUNT Modal UI References ---
    const deleteAccountModal = document.getElementById('delete-account-modal');
    const deleteAccountMessage = document.getElementById('delete-account-message');
    const deletePasswordForm = document.getElementById('delete-password-form');
    const deleteGoogleForm = document.getElementById('delete-google-form');
    const deleteAccountPassword = document.getElementById('delete-account-password');
    const deleteAccountConfirmBtn = document.getElementById('delete-account-confirm-btn');
    const deleteGoogleReauthBtn = document.getElementById('delete-google-reauth-btn');
    const deleteAccountCancelBtn = document.getElementById('delete-account-cancel-btn');

// --- State Management ---
    let allChats = []; // Holds all chat sessions {id, title, messages}
    let currentChatId = null; // The ID of the currently active chat
    let chatToDeleteId = null; // --- NEW: Stores the chat ID being confirmed for deletion
    // --- Icon Definitions ---
    // (This section is unchanged)
    const iconSend = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`;
    const iconProcessing = `<div class="spinner"></div>`;
    if(submitBtn && btnText){
        if(submitBtn.querySelector('svg, .spinner')) submitBtn.querySelector('svg, .spinner').remove();
        submitBtn.insertAdjacentHTML('afterbegin', iconSend);
        btnText.textContent = 'Send';
    }

    // --- Sidebar & Modal Functionality ---
    // (This section is unchanged)
    const openSidebar = () => sidebar.classList.remove('-translate-x-full');
    const closeSidebar = () => sidebar.classList.add('-translate-x-full');
    if (openSidebarBtn) openSidebarBtn.addEventListener('click', openSidebar);
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
    const openModal = () => aboutUsModal.classList.remove('hidden');
    const closeModal = () => aboutUsModal.classList.add('hidden');
    if (aboutUsBtn) aboutUsBtn.addEventListener('click', openModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (aboutUsModal) aboutUsModal.addEventListener('click', (e) => {
        if (e.target === aboutUsModal) closeModal();
    });

    
    // --- Settings and Profile Page Navigation ---
    // (This section is unchanged)
    const showPage = (page) => { if (page) page.classList.remove('translate-x-full'); };
    const hidePage = (page) => { if (page) page.classList.add('translate-x-full'); };
    if (profileAvatarBtn) {
        profileAvatarBtn.addEventListener('click', () => {
            loadProfileData();
            showPage(settingsPage);
        });
    }
    if (settingsBackBtn) {
        settingsBackBtn.addEventListener('click', () => {
            hidePage(settingsPage);
            hidePage(editProfilePage);
        });
    }
    if (editProfileLink) {
        editProfileLink.addEventListener('click', (e) => {
            e.preventDefault();
            loadProfileData();
            showPage(editProfilePage);
        });
    }
    if (profileBackBtn) {
        profileBackBtn.addEventListener('click', () => hidePage(editProfilePage));
    }

    // --- NEW: Device Page Navigation ---
    if(deviceLink) deviceLink.addEventListener('click', (e) => { e.preventDefault(); showPage(devicePage); });
    if(deviceBackBtn) deviceBackBtn.addEventListener('click', () => hidePage(devicePage));
    
    // --- Authentication and Profile Data Logic (MODIFIED) ---
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // User is signed in
            const userProfile = await getUserProfileData();
            updateUIForLoggedInUser(userProfile);
            // --- MODIFIED ---
            // Load chats from Firestore instead of localStorage
            await loadChatsFromFirestore(); 
            renderChatHistoryList();
        } else {
            // User is signed out
            updateUIForLoggedOutUser();
            // --- NEW ---
            // Clear local data on sign-out
            allChats = [];
            currentChatId = null;
            renderChatHistoryList(); // Clears the sidebar
            startNewChat(); // Resets the main chat window
        }
    });
    
    // (updateUIForLoggedInUser function is unchanged)
    function updateUIForLoggedInUser(profile) {
        if (!profile) return;
        const firstName = profile.firstName || 'User';
        const initial = firstName.charAt(0).toUpperCase();
        if(signInBtn) signInBtn.classList.add('hidden');
        if(profileAvatarBtn) {
            profileAvatarBtn.classList.remove('hidden');
            profileAvatarBtn.textContent = initial;
        }
        if(mainHeading) mainHeading.textContent = `Hello, ${firstName}`;
        document.querySelectorAll('.profile-name').forEach(el => el.textContent = firstName);
        document.querySelectorAll('.profile-avatar').forEach(el => el.textContent = initial);
    }

    // (updateUIForLoggedOutUser function is unchanged)
    function updateUIForLoggedOutUser() {
        if(signInBtn) signInBtn.classList.remove('hidden');
        if(profileAvatarBtn) profileAvatarBtn.classList.add('hidden');
        if(mainHeading) mainHeading.textContent = `Hello, Guest`;
        if(profileFirstNameDisplay) profileFirstNameDisplay.textContent = 'Not set';
        if(profileLastNameDisplay) profileLastNameDisplay.textContent = 'Not set';
        if(profileEmailDisplay) profileEmailDisplay.textContent = 'Not set';
        document.querySelectorAll('.profile-name').forEach(el => el.textContent = 'User');
        document.querySelectorAll('.profile-avatar').forEach(el => el.textContent = 'S');
    }

    // (loadProfileData function is unchanged)
    const loadProfileData = async () => {
        const userProfile = await getUserProfileData();
        if(userProfile) {
            if(profileFirstNameDisplay) profileFirstNameDisplay.textContent = userProfile.firstName || 'Not set';
            if(profileLastNameDisplay) profileLastNameDisplay.textContent = userProfile.lastName || 'Not set';
            if(profileEmailDisplay) profileEmailDisplay.textContent = userProfile.email || 'Not set';
        }
    };

    // (handleSignOut function is unchanged)
    const handleSignOut = () => {
        signOut(auth).catch((error) => console.error("Sign Out Error:", error));
    };
    if (signOutBtn) signOutBtn.addEventListener('click', () => {
        hidePage(editProfilePage);
        hidePage(settingsPage);
        handleSignOut();
    });
   // Fix for Top-Right Sign In Button
    if (signInBtn) {
        signInBtn.addEventListener('click', () => {
            window.location.href = 'login.html';
        });
    }
    

    // --- Chat History Logic (MODIFIED) ---

    /**
     * --- NEW FUNCTION ---
     * Loads all chat data from the user's 'chats' subcollection in Firestore.
     * We will store chats in users/{userId}/chats/{chatId}
     */
    const loadChatsFromFirestore = async () => {
        const user = auth.currentUser;
        if (!user) return;

        // Create a reference to the user's 'chats' subcollection
        // We order by 'id' (which is Date.now()) to get newest chats first
        const chatsCollectionRef = collection(db, 'users', user.uid, 'chats');
        const q = query(chatsCollectionRef, orderBy('id', 'desc'));

        try {
            const querySnapshot = await getDocs(q);
            allChats = []; // Clear local cache
            querySnapshot.forEach((doc) => {
                // doc.data() is the chat object: {id, title, messages, ...}
                allChats.push(doc.data());
            });
        } catch (error) {
            console.error("Error loading chats from Firestore:", error);
            allChats = []; // Reset on error
        }
    };


    // We no longer need saveChatsToStorage or the old loadChatsFromStorage
    // const saveChatsToStorage = () => { ... }
    // const loadChatsFromStorage = () => { ... }


    /**
     * --- MODIFIED: Chat Action Functions ---
     * All these functions are now 'async' and write to Firestore.
     */
// --- NEW: Helper function to save an inline rename ---
    const saveRename = async (chatId, inputElement, originalLinkElement) => {
        const newTitle = inputElement.value.trim();
        const chat = allChats.find(c => c.id === chatId);
        
        // Restore the original link element in the UI
        originalLinkElement.textContent = (newTitle || chat.title).length > 20 ? (newTitle || chat.title).substring(0, 17) + '...' : (newTitle || chat.title);
        inputElement.replaceWith(originalLinkElement);

        if (newTitle && newTitle !== chat.title) {
            chat.title = newTitle; // Update local state

            // Update Firestore
            const user = auth.currentUser;
            if (user) {
                try {
                    const chatDocRef = doc(db, 'users', user.uid, 'chats', String(chatId));
                    await updateDoc(chatDocRef, { title: newTitle });
                } catch (error) {
                    console.error("Error renaming chat:", error);
                    // (Optional: revert title if save fails)
                }
            }
        }
    };

    // --- MODIFIED: handleRenameChat now creates an inline input ---
    const handleRenameChat = (chatId) => {
        const chat = allChats.find(c => c.id === chatId);
        if (!chat) return;

        // Find the specific link element in the sidebar
        const chatLink = document.querySelector(`.chat-history-link[data-id="${chat.id}"]`);
        if (!chatLink) return;

        // Create an input element
        const input = document.createElement('input');
        input.type = 'text';
        input.value = chat.title;
        input.className = 'chat-history-rename-input'; // Use new CSS class
        input.spellcheck = false;

        // Replace the link with the input
        chatLink.replaceWith(input);
        input.focus(); // Focus the input
        input.select(); // Select all text

        // Add listeners to save the new name
        input.addEventListener('blur', () => {
            saveRename(chatId, input, chatLink);
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                input.blur(); // Save on Enter
            } else if (e.key === 'Escape') {
                // On Escape, just revert without saving
                input.value = chat.title; // Reset value
                input.blur(); // And trigger the blur to revert
            }
        });
    };


// --- MODIFIED: handleDeleteChat now opens the modal ---
    const handleDeleteChat = (chatId) => {
        const chat = allChats.find(c => c.id === chatId);
        if (!chat) return;

        // Store the ID and show the modal
        chatToDeleteId = chatId;
        deleteModalText.textContent = `This will permanently delete "${chat.title}".`;
        deleteChatModal.classList.remove('hidden');
    };

    // --- NEW: Add event listeners for the delete modal ---
    deleteModalCancelBtn.addEventListener('click', () => {
        deleteChatModal.classList.add('hidden');
        chatToDeleteId = null; // Clear the ID
    });

    deleteModalConfirmBtn.addEventListener('click', async () => {
        if (!chatToDeleteId) return;

        const chatId = chatToDeleteId; // Get the stored ID
        chatToDeleteId = null; // Clear the ID

        // --- This is the logic from your old handleDeleteChat ---
        const user = auth.currentUser;
        if (user) {
            try {
                const chatDocRef = doc(db, 'users', user.uid, 'chats', String(chatId));
                await deleteDoc(chatDocRef);
            } catch (error) {
                console.error("Error deleting chat:", error);
            }
        }

        allChats = allChats.filter(c => c.id !== chatId); // Update local state
        renderChatHistoryList(); // Update the UI
        
        if (currentChatId === chatId) {
            startNewChat(); // Reset main window if active chat was deleted
        }
        
        deleteChatModal.classList.add('hidden'); // Hide the modal
    });
    // (This click listener is unchanged)
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.chat-history-item-container')) {
            document.querySelectorAll('.chat-options-menu').forEach(menu => {
                menu.classList.add('hidden');
            });
        }
    });

// --- MODIFIED: Render the list of chats in the sidebar ---
    const renderChatHistoryList = () => {
        if (!chatHistoryContainer) return;
        chatHistoryContainer.innerHTML = '';
        
        const activeChats = allChats.filter(chat => !chat.isArchived); // Archive filter remains, just in case

        activeChats.forEach(chat => {
            const container = document.createElement('div');
            container.className = 'chat-history-item-container';

            const chatLink = document.createElement('a');
            chatLink.href = '#';
            chatLink.className = 'chat-history-link';
            chatLink.textContent = chat.title.length > 20 ? chat.title.substring(0, 17) + '...' : chat.title;
            chatLink.dataset.id = chat.id;
            chatLink.addEventListener('click', (e) => {
                e.preventDefault();
                // --- NEW: Prevent loading if an input is active ---
                if (e.target.tagName === 'INPUT') return;
                loadChat(chat.id);
            });

            const optionsBtn = document.createElement('button');
            optionsBtn.className = 'chat-options-btn';
            optionsBtn.innerHTML = '...';
            optionsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                document.querySelectorAll('.chat-options-menu').forEach(m => m.remove());

                const menu = document.createElement('div');
                menu.className = 'chat-options-menu';
                
                // --- MODIFIED: Removed "Archive" option ---
                menu.innerHTML = `
                    <a href="#" class="chat-options-item" data-action="rename">Rename</a>
                    <a href="#" class="chat-options-item delete" data-action="delete">Delete</a>
                `;
                container.appendChild(menu);
                
                menu.addEventListener('click', (menuEvent) => {
                    menuEvent.preventDefault();
                    menuEvent.stopPropagation();
                    const action = menuEvent.target.dataset.action;
                    if (action === 'rename') handleRenameChat(chat.id);
                    // --- (REMOVED) Archive action ---
                    if (action === 'delete') handleDeleteChat(chat.id);
                    menu.remove();
                });
            });

            container.appendChild(chatLink);
            container.appendChild(optionsBtn);
            chatHistoryContainer.appendChild(container);
        });
    };

    // (loadChat function is unchanged)
    const loadChat = (id) => {
        const chat = allChats.find(c => c.id === id);
        if (!chat) return;

        currentChatId = id;
        chatContainer.innerHTML = '';
        welcomeMessage.style.display = 'none';

        chat.messages.forEach(message => {
            const html = createMessageHtml(message.role, message.parts[0].text);
            chatContainer.insertAdjacentHTML('beforeend', html);
        });
        chatContainer.scrollTop = chatContainer.scrollHeight;
        if(window.innerWidth < 768) closeSidebar();
    };

    // (startNewChat function is unchanged)
    const startNewChat = () => {
        currentChatId = null;
        chatContainer.innerHTML = '';
        // Check if welcomeMessage exists before appending
        if (welcomeMessage && !chatContainer.contains(welcomeMessage)) {
             chatContainer.appendChild(welcomeMessage);
        }
        if (welcomeMessage) welcomeMessage.style.display = 'block';
        queryInput.value = '';
    };

    newChatBtn.addEventListener('click', startNewChat);

    
    // (createMessageHtml function is unchanged)
    const createMessageHtml = (role, content) => {
        // ... (this function is unchanged)
        if (role === 'user') {
            return `
                <div class="response-section">
                    <div class="response-header">You:</div>
                    <div class="response-content" style="border-left-color: #5A67D8; background: rgba(90, 103, 216, 0.1);">
                        ${content}
                    </div>
                </div>`;
        } else { // model or error
            return `
                <div class="response-section">
                    <div class="response-header">
                        <div class="response-indicator" style="background: #68D391;"></div>
                        EDITH Response:
                    </div>
                    <div class="response-content">
                        ${content}
                    </div>
                </div>`;
        }
    };
    

    // --- Core Chat Logic (MODIFIED) ---
    queryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // --- NEW: Check for user ---
        const user = auth.currentUser;
        if (!user) {
            alert("Please sign in to start chatting.");
            window.location.href = 'login.html';
            return;
        }

        const query = queryInput.value.trim();
        if (!query) return;

        let isFirstMessage = false;
        if (currentChatId === null) {
            isFirstMessage = true;
            currentChatId = Date.now(); // Use timestamp as unique ID
            const newChat = {
                id: currentChatId,
                title: query, // Use the first query as the title
                messages: [],
                isArchived: false
                // We'll add userId when saving to Firestore
            };
            allChats.unshift(newChat); // Add to the beginning of our local list

            // --- NEW: Create new chat in Firestore ---
            try {
                // Use String(currentChatId) as the document ID
                const chatDocRef = doc(db, 'users', user.uid, 'chats', String(currentChatId));
                // Add the userId to the object before saving
                await setDoc(chatDocRef, { ...newChat, userId: user.uid });
            } catch (error) {
                console.error("Error creating new chat in Firestore:", error);
            }
        }

        // (This part is unchanged)
        if (welcomeMessage) welcomeMessage.style.display = 'none';
        const userQueryHtml = createMessageHtml('user', query);
        chatContainer.insertAdjacentHTML('beforeend', userQueryHtml);
        
        const currentChat = allChats.find(c => c.id === currentChatId);
        currentChat.messages.push({ role: 'user', parts: [{ text: query }] });
        
        chatContainer.scrollTop = chatContainer.scrollHeight;
        queryInput.value = '';

        // (Set loading state - unchanged)
        submitBtn.disabled = true;
        btnText.textContent = 'Processing';
        if(submitBtn.querySelector('svg, .spinner')) submitBtn.querySelector('svg, .spinner').remove();
        submitBtn.insertAdjacentHTML('afterbegin', iconProcessing);
        const responseId = `response-${Date.now()}`;
        const responsePlaceholderHtml = `
            <div id="${responseId}" class="response-section">
                <div class="response-header">
                    <div class="response-indicator"></div>
                    Edith is typing...
                </div>
            </div>`;
        chatContainer.insertAdjacentHTML('beforeend', responsePlaceholderHtml);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        try {
            const res = await fetch(`${window.location.origin}/api/gemini`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: query,
                    history: currentChat.messages.slice(0, -1)
                }),
            });

            const responseElement = document.getElementById(responseId);
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'An unknown error occurred.');
            }
            
            const data = await res.json();
            
            // Add model response to the current chat's message list
            currentChat.messages.push({ role: 'model', parts: [{ text: data.response }] });

            // --- MODIFIED: Update Firestore with new message ---
            // We update the 'messages' array in the existing doc
            try {
                const chatDocRef = doc(db, 'users', user.uid, 'chats', String(currentChatId));
                await updateDoc(chatDocRef, {
                    messages: currentChat.messages
                });
            } catch (error) {
                console.error("Error saving message to Firestore:", error);
            }
            
            // --- (REMOVED) saveChatsToStorage(); ---
            
            if (isFirstMessage) {
                renderChatHistoryList(); // Update the sidebar if it was a new chat
            }
            
            responseElement.innerHTML = createMessageHtml('model', data.response);

        } catch (error) {
            console.error('Fetch Error:', error);
            const responseElement = document.getElementById(responseId);
            responseElement.innerHTML = `
                <div class="response-header error-header">System Alert:</div>
                <div class="response-content error-content">${error.message}</div>`;
        } finally {
            // (Reset loading state - unchanged)
            submitBtn.disabled = false;
            btnText.textContent = 'Send';
            if(submitBtn.querySelector('svg, .spinner')) submitBtn.querySelector('svg, .spinner').remove();
            submitBtn.insertAdjacentHTML('afterbegin', iconSend);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    });

    // (Auto-resize textarea - unchanged)
    queryInput.addEventListener('input', () => {
        queryInput.style.height = 'auto';
        queryInput.style.height = (queryInput.scrollHeight) + 'px';
    });


    // --- NEW: DELETE ACCOUNT FUNCTIONALITY ---

    // This is the main function that deletes all data
    const handleDeleteAccount = async (user) => {
        const uid = user.uid;
        showMessage('delete-account-message', 'Deleting your data... Please wait.', false);
        
        try {
            // --- Step 1: Delete all chat documents in the subcollection ---
            const chatsCollectionRef = collection(db, 'users', uid, 'chats');
            const chatsSnapshot = await getDocs(chatsCollectionRef);
            const deletePromises = [];
            chatsSnapshot.forEach(chatDoc => {
                deletePromises.push(deleteDoc(chatDoc.ref));
            });
            await Promise.all(deletePromises);
            
            // --- Step 2: Delete the user's profile document ---
            const userDocRef = doc(db, 'users', uid);
            await deleteDoc(userDocRef);
            
            // --- Step 3: Delete the user from Firebase Auth ---
            await deleteUser(user);
            
            alert("Account deleted successfully.");
            window.location.href = 'login.html'; // Redirect to login
            
        } catch (error) {
            showMessage('delete-account-message', "An error occurred. We could not delete your account. Please sign out and sign back in to try again.", true);
            console.error("Delete account error:", error);
        }
    };

    // --- MODIFIED: Event listener for the "Delete Account" link ---
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            if (!user) return;

            // Reset modal state
            deleteAccountMessage.style.display = 'none';
            deletePasswordForm.style.display = 'none';
            deleteGoogleForm.style.display = 'none';
            deleteAccountPassword.value = '';

            // Check provider and show the correct form
            const providerId = user.providerData[0].providerId;
            if (providerId === 'password') {
                deletePasswordForm.style.display = 'block';
            } else if (providerId === 'google.com') {
                deleteGoogleForm.style.display = 'block';
            } else {
                showMessage('delete-account-message', "Account deletion for this sign-in method is not supported.", true);
            }
            
            // Show the modal
            deleteAccountModal.classList.remove('hidden');
        });
    }

    // --- NEW: Listeners for the Delete Account Modal ---

    // Close modal button
    if (deleteAccountCancelBtn) {
        deleteAccountCancelBtn.addEventListener('click', () => {
            deleteAccountModal.classList.add('hidden');
        });
    }

    // Password form submission
    if (deletePasswordForm) {
        deletePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            const password = deleteAccountPassword.value;
            if (!user || !password) {
                showMessage('delete-account-message', "Please enter your password.", true);
                return;
            }

            deleteAccountConfirmBtn.disabled = true;
            deleteAccountConfirmBtn.textContent = 'Verifying...';

            try {
                // 1. Get credential & Re-authenticate
                const credential = EmailAuthProvider.credential(user.email, password);
                await reauthenticateWithCredential(user, credential);
                
                // 2. Re-auth successful, proceed to deletion
                deleteAccountConfirmBtn.textContent = 'Deleting...';
                await handleDeleteAccount(user);

            } catch (error) {
                if (error.code === 'auth/wrong-password') {
                    showMessage('delete-account-message', "Wrong password. Please try again.", true);
                } else {
                    showMessage('delete-account-message', "An error occurred. Please try again.", true);
                }
                console.error("Password Re-auth error:", error);
                deleteAccountConfirmBtn.disabled = false;
                deleteAccountConfirmBtn.textContent = 'Confirm & Delete Account';
            }
        });
    }

    // Google re-auth button
    if (deleteGoogleReauthBtn) {
        deleteGoogleReauthBtn.addEventListener('click', async () => {
            const user = auth.currentUser;
            if (!user) return;

            deleteGoogleReauthBtn.disabled = true;
            deleteGoogleReauthBtn.textContent = 'Opening popup...';

            try {
                // 1. Re-authenticate with Google
                await reauthenticateWithPopup(user, provider);
                
                // 2. Re-auth successful, proceed to deletion
                deleteGoogleReauthBtn.textContent = 'Deleting...';
                await handleDeleteAccount(user);

            } catch (error) {
                if (error.code !== 'auth/cancelled-popup-request') {
                     showMessage('delete-account-message', "An error occurred during re-authentication.", true);
                }
                console.error("Google Re-auth error:", error);
                deleteGoogleReauthBtn.disabled = false;
                deleteGoogleReauthBtn.textContent = 'Confirm with Google';
            }
        });
    }

    // ==========================================
    // GENERAL SETTINGS & UTILITIES
    // ==========================================

    // 1. General Page Navigation
    const generalPage = document.getElementById('general-page');
    const generalLink = document.getElementById('general-link');
    const generalBackBtn = document.getElementById('general-back-btn');

    if (generalLink) generalLink.addEventListener('click', (e) => { e.preventDefault(); showPage(generalPage); });
    if (generalBackBtn) generalBackBtn.addEventListener('click', () => hidePage(generalPage));

    // 2. Report Issue Logic (Save to Firebase)
    const reportIssueBtn = document.getElementById('report-issue-btn');
    const reportModal = document.getElementById('report-modal');
    const reportForm = document.getElementById('report-form');
    const reportCancelBtn = document.getElementById('report-cancel-btn');
    const reportSendBtn = document.getElementById('report-send-btn');
    const reportSuccessMsg = document.getElementById('report-success-msg');
    const reportDoneBtn = document.getElementById('report-done-btn');

    if (reportIssueBtn) {
        reportIssueBtn.addEventListener('click', (e) => {
            e.preventDefault(); 
            reportModal.classList.remove('hidden');
            reportForm.classList.remove('hidden');
            reportSuccessMsg.classList.add('hidden');
            reportForm.reset();
        });
    }
    if (reportCancelBtn) reportCancelBtn.addEventListener('click', () => reportModal.classList.add('hidden'));
    
    if (reportForm) {
        reportForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const subject = document.getElementById('report-subject').value;
            const description = document.getElementById('report-description').value;
            const user = auth.currentUser;

            reportSendBtn.textContent = 'Sending...';
            reportSendBtn.disabled = true;

            try {
                await addDoc(collection(db, "reports"), {
                    subject: subject,
                    description: description,
                    userId: user ? user.uid : "anonymous",
                    userEmail: user ? user.email : "anonymous",
                    timestamp: new Date(),
                    status: "new"
                });
                reportForm.classList.add('hidden');
                reportSuccessMsg.classList.remove('hidden');
            } catch (error) {
                console.error("Error reporting:", error);
                alert("Could not send report.");
            } finally {
                reportSendBtn.textContent = 'Send';
                reportSendBtn.disabled = false;
            }
        });
    }
    if (reportDoneBtn) reportDoneBtn.addEventListener('click', () => reportModal.classList.add('hidden'));


    // 3. Export Data Logic (Select & Download)
    const exportDataBtn = document.getElementById('export-data-btn');
    const exportModal = document.getElementById('export-modal');
    const exportChatList = document.getElementById('export-chat-list');
    const exportSelectAll = document.getElementById('export-select-all');
    const exportCancelBtn = document.getElementById('export-cancel-btn');
    const exportConfirmBtn = document.getElementById('export-confirm-btn');

    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', () => {
            exportModal.classList.remove('hidden');
            exportChatList.innerHTML = '';
            if (exportSelectAll) exportSelectAll.checked = false;

            if (!allChats || allChats.length === 0) {
                exportChatList.innerHTML = '<p class="text-center text-red-500 text-sm py-4">No chats found.</p>';
                exportConfirmBtn.disabled = true;
                return;
            }
            exportConfirmBtn.disabled = false;

            allChats.forEach(chat => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'export-chat-item';
                const displayTitle = chat.title.length > 25 ? chat.title.substring(0, 22) + '...' : chat.title;
                const date = new Date(chat.id).toLocaleDateString();

                itemDiv.innerHTML = `
                    <input type="checkbox" class="export-checkbox" value="${chat.id}" id="chk-${chat.id}">
                    <label for="chk-${chat.id}">
                        <div class="font-medium">${displayTitle}</div>
                        <div class="text-xs text-gray-400">${date}</div>
                    </label>
                `;
                exportChatList.appendChild(itemDiv);
            });
        });
    }

    if (exportSelectAll) {
        exportSelectAll.addEventListener('change', (e) => {
            document.querySelectorAll('.export-checkbox').forEach(cb => cb.checked = e.target.checked);
        });
    }
    if (exportCancelBtn) exportCancelBtn.addEventListener('click', () => exportModal.classList.add('hidden'));

    if (exportConfirmBtn) {
        exportConfirmBtn.addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('.export-checkbox:checked');
            if (checkboxes.length === 0) {
                alert("Select at least one chat.");
                return;
            }
            const selectedIds = Array.from(checkboxes).map(cb => cb.value);
            const selectedChats = allChats.filter(chat => selectedIds.includes(String(chat.id)));

            exportConfirmBtn.textContent = "Downloading...";
            setTimeout(() => {
                const dataStr = JSON.stringify(selectedChats, null, 2);
                const blob = new Blob([dataStr], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `edith_chats_${new Date().toISOString().slice(0,10)}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                exportModal.classList.add('hidden');
                exportConfirmBtn.textContent = "Download";
            }, 800);
        });
    }

    // ==========================================
    // NEW: MY DEVICE LOGIC (PASSIVE DASHBOARD)
    // ==========================================

    // --- NEW: My Device UI References ---
    const devicePage = document.getElementById('device-page');
    const deviceLink = document.getElementById('device-link');     // <--- THIS IS CRITICAL
    const deviceBackBtn = document.getElementById('device-back-btn');
    
    const updateDeviceStatus = (data) => {
        const isConnected = data && data.bluetoothConnected === true; 
        const batteryLevel = data ? data.batteryLevel : 0;

        if (isConnected) {
            connectionText.innerHTML = '<span class="text-green-500">● Connected</span>';
            btIconBg.classList.remove('bg-gray-100', 'text-gray-400');
            btIconBg.classList.add('bg-blue-50', 'text-[#5A67D8]');
            if(connectionPulse) connectionPulse.classList.remove('hidden');
            if(batterySection) batterySection.classList.remove('opacity-50'); 
            
            if(batteryPercentEl) batteryPercentEl.textContent = `${batteryLevel}%`;
            if(batteryBar) batteryBar.style.width = `${batteryLevel}%`;
            
            let colorClass = 'bg-green-500';
            if (batteryLevel < 20) colorClass = 'bg-red-500';
            else if (batteryLevel < 50) colorClass = 'bg-yellow-500';
            if(batteryBar) batteryBar.className = `h-3 rounded-full transition-all duration-500 ${colorClass}`;

            const totalMinutes = (batteryLevel / 100) * 240; 
            const hours = Math.floor(totalMinutes / 60);
            const mins = Math.floor(totalMinutes % 60);
            if(runtimeText) runtimeText.textContent = `${hours}h ${mins}m`;

        } else {
            connectionText.innerHTML = '<span class="text-gray-400">○ Disconnected</span>';
            btIconBg.classList.remove('bg-blue-50', 'text-[#5A67D8]');
            btIconBg.classList.add('bg-gray-100', 'text-gray-400');
            if(connectionPulse) connectionPulse.classList.add('hidden');
            if(batterySection) batterySection.classList.add('opacity-50'); 
            
            if(batteryPercentEl) batteryPercentEl.textContent = "--%";
            if(batteryBar) batteryBar.style.width = "0%";
            if(runtimeText) runtimeText.textContent = "--";
        }
    };

    const initDeviceListener = () => {
        const user = auth.currentUser;
        if (!user) return;
        const docRef = doc(db, 'users', user.uid, 'device', 'status');
        onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) updateDeviceStatus(docSnap.data());
            else updateDeviceStatus(null);
        }, (error) => console.error("Device listener error:", error));
    };

    // --- Initial Load (MODIFIED) ---
    // We no longer call the functions here,
    // onAuthStateChanged will handle loading chats when the user logs in.
    // loadChatsFromStorage(); 
    // renderChatHistoryList();
});

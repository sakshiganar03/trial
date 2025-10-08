// --- NEW: Firebase Imports ---
// This imports the necessary functions from your firebaseauth.js file.
import { auth, onAuthStateChanged, signOut, getUserProfileData } from './firebaseauth.js';
document.addEventListener('DOMContentLoaded', () => {
    // --- UI Element References ---
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

    // --- Authentication UI References ---
    const signInBtn = document.getElementById('sign-in-btn');
    const profileAvatarBtn = document.getElementById('profile-avatar-btn');

    // --- State Management ---
    let allChats = []; // Holds all chat sessions {id, title, messages}
    let currentChatId = null; // The ID of the currently active chat

    // --- Icon Definitions ---
    const iconSend = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`;
    const iconProcessing = `<div class="spinner"></div>`;
    
    if(submitBtn && btnText){
        if(submitBtn.querySelector('svg, .spinner')) submitBtn.querySelector('svg, .spinner').remove();
        submitBtn.insertAdjacentHTML('afterbegin', iconSend);
        btnText.textContent = 'Send';
    }

    // --- Sidebar & Modal Functionality ---
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

    // --- Settings and Profile Page References ---
    const settingsPage = document.getElementById('settings-page');
    const settingsBackBtn = document.getElementById('settings-back-btn');
    const editProfilePage = document.getElementById('edit-profile-page');
    const profileBackBtn = document.getElementById('profile-back-btn');
    const editProfileLink = document.getElementById('edit-profile-link');
    const aboutLink = document.getElementById('about-link');
    
    // --- UPDATED: Profile Page Element References ---
    const signOutBtn = document.getElementById('sign-out-btn');
    const profileFirstNameDisplay = document.getElementById('profile-firstname');
    const profileLastNameDisplay = document.getElementById('profile-lastname');
    const profileEmailDisplay = document.getElementById('profile-email');

    const showPage = (page) => {
        if (page) page.classList.remove('translate-x-full');
    };
    const hidePage = (page) => {
        if (page) page.classList.add('translate-x-full');
    };
    
    if (profileAvatarBtn) {
        profileAvatarBtn.addEventListener('click', () => showPage(settingsPage));
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
            showPage(editProfilePage);
        });
    }
    if (profileBackBtn) {
        profileBackBtn.addEventListener('click', () => hidePage(editProfilePage));
    }
    if (aboutLink) {
        aboutLink.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
    }

// --- REPLACED: Authentication and Profile Data Logic ---
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userProfile = await getUserProfileData();
            updateUIForLoggedInUser(userProfile);
        } else {
            updateUIForLoggedOutUser();
        }
    });
    
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

    function updateUIForLoggedOutUser() {
        if(signInBtn) signInBtn.classList.remove('hidden');
        if(profileAvatarBtn) profileAvatarBtn.classList.add('hidden');
        if(mainHeading) mainHeading.textContent = `Hello, Guest`;
        if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
            window.location.href = 'login.html';
        }
    }

    const loadProfileData = async () => {
        const userProfile = await getUserProfileData();
        if(userProfile) {
            if(profileFirstNameDisplay) profileFirstNameDisplay.textContent = userProfile.firstName || 'Not set';
            if(profileLastNameDisplay) profileLastNameDisplay.textContent = userProfile.lastName || 'Not set';
            if(profileEmailDisplay) profileEmailDisplay.textContent = userProfile.email || 'Not set';
        }
    };

    const handleSignOut = () => {
        signOut(auth).catch((error) => console.error("Sign Out Error:", error));
    };

    if (signOutBtn) signOutBtn.addEventListener('click', handleSignOut);
    if (signInBtn) signInBtn.addEventListener('click', () => { window.location.href = 'login.html'; });


    
    // --- Chat History Logic ---
    const loadChatsFromStorage = () => {
        const storedChats = localStorage.getItem('edith_all_chats');
        if (storedChats) {
            allChats = JSON.parse(storedChats);
        }
    };

    const saveChatsToStorage = () => {
        localStorage.setItem('edith_all_chats', JSON.stringify(allChats));
    };

    const renderChatHistoryList = () => {
        if (!chatHistoryContainer) return;
        chatHistoryContainer.innerHTML = '';
        allChats.forEach(chat => {
            const chatLink = document.createElement('a');
            chatLink.href = '#';
            chatLink.className = 'chat-history-link';
            chatLink.textContent = chat.title.length > 25 ? chat.title.substring(0, 22) + '...' : chat.title;
            chatLink.dataset.id = chat.id;

            chatLink.addEventListener('click', (e) => {
                e.preventDefault();
                loadChat(chat.id);
            });

            chatHistoryContainer.appendChild(chatLink);
        });
    };

    const loadChat = (id) => {
        const chat = allChats.find(c => c.id === id);
        if (!chat) return;

        currentChatId = id;
        chatContainer.innerHTML = '';
        if(welcomeMessage) welcomeMessage.style.display = 'none';

        chat.messages.forEach(message => {
            const html = createMessageHtml(message.role, message.parts[0].text);
            chatContainer.insertAdjacentHTML('beforeend', html);
        });
        chatContainer.scrollTop = chatContainer.scrollHeight;
        if(window.innerWidth < 768) closeSidebar();
    };

    const startNewChat = () => {
        currentChatId = null;
        if(chatContainer) chatContainer.innerHTML = '';
        if(chatContainer && welcomeMessage) chatContainer.appendChild(welcomeMessage);
        if(welcomeMessage) welcomeMessage.style.display = 'block';
        if(queryInput) queryInput.value = '';
    };

    if (newChatBtn) newChatBtn.addEventListener('click', startNewChat);

    const createMessageHtml = (role, content) => {
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
    
    // --- Core Chat Logic ---
    if (queryForm) {
        queryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const query = queryInput.value.trim();
            if (!query) return;

            let isFirstMessage = false;
            if (currentChatId === null) {
                isFirstMessage = true;
                currentChatId = Date.now();
                const newChat = {
                    id: currentChatId,
                    title: query,
                    messages: []
                };
                allChats.unshift(newChat);
            }

            if (welcomeMessage) welcomeMessage.style.display = 'none';

            const userQueryHtml = createMessageHtml('user', query);
            chatContainer.insertAdjacentHTML('beforeend', userQueryHtml);
            
            const currentChat = allChats.find(c => c.id === currentChatId);
            currentChat.messages.push({ role: 'user', parts: [{ text: query }] });
            
            chatContainer.scrollTop = chatContainer.scrollHeight;
            queryInput.value = '';

            submitBtn.disabled = true;
            btnText.textContent = 'Processing';
            if(submitBtn.querySelector('svg, .spinner')) submitBtn.querySelector('svg, .spinner').remove();
            submitBtn.insertAdjacentHTML('afterbegin', iconProcessing);

            const responseId = `response-${Date.now()}`;
            const responsePlaceholderHtml = `...`; // Placeholder HTML
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
                
                currentChat.messages.push({ role: 'model', parts: [{ text: data.response }] });

                if (isFirstMessage) {
                    renderChatHistoryList();
                }
                saveChatsToStorage();
                
                responseElement.innerHTML = createMessageHtml('model', data.response);

            } catch (error) {
                console.error('Fetch Error:', error);
                const responseElement = document.getElementById(responseId);
                responseElement.innerHTML = `...`; // Error HTML
            } finally {
                submitBtn.disabled = false;
                btnText.textContent = 'Send';
                if(submitBtn.querySelector('svg, .spinner')) submitBtn.querySelector('svg, .spinner').remove();
                submitBtn.insertAdjacentHTML('afterbegin', iconSend);
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        });
    }

    // --- Auto-resize textarea ---
    if(queryInput) {
        queryInput.addEventListener('input', () => {
            queryInput.style.height = 'auto';
            queryInput.style.height = (queryInput.scrollHeight) + 'px';
        });
    }

    // --- Initial Load ---
    updateAuthUI();
    loadChatsFromStorage();
    renderChatHistoryList();
    loadProfileData();
});


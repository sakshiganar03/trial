// --- Firebase Imports ---
// This ensures the script can communicate with your firebaseauth.js file.
import {
    auth,
    onAuthStateChanged,
    signOut,
    getUserProfileData,
    loadChatsFromFirestore,
    saveNewChatToFirestore,
    updateChatInFirestore,
    deleteChatFromFirestore
} from './firebaseauth.js';

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

    // --- State Management ---
    let allChats = [];
    let currentChatId = null; // Will store the Firestore document ID

    // --- Authentication Logic ---
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userProfile = await getUserProfileData();
            updateUIForLoggedInUser(userProfile);
            allChats = await loadChatsFromFirestore();
            renderChatHistoryList();
        } else {
            updateUIForLoggedOutUser();
        }
    });

    function updateUIForLoggedInUser(profile) {
        if (!profile) return;
        const firstName = profile.firstName || 'User';
        const initial = firstName.charAt(0).toUpperCase();
        if (signInBtn) signInBtn.classList.add('hidden');
        if (profileAvatarBtn) {
            profileAvatarBtn.classList.remove('hidden');
            profileAvatarBtn.textContent = initial;
        }
        if (mainHeading) mainHeading.textContent = `Hello, ${firstName}`;
        document.querySelectorAll('.profile-name').forEach(el => el.textContent = firstName);
        document.querySelectorAll('.profile-avatar').forEach(el => el.textContent = initial);
    }

    function updateUIForLoggedOutUser() {
        if (signInBtn) signInBtn.classList.remove('hidden');
        if (profileAvatarBtn) profileAvatarBtn.classList.add('hidden');
        if (mainHeading) mainHeading.textContent = `Hello, Guest`;
    }

    const handleSignOut = () => {
        signOut(auth).then(() => {
            window.location.href = 'login.html';
        }).catch((error) => console.error("Sign Out Error:", error));
    };

    // --- Page Navigation & UI Event Listeners ---
    const showPage = (page) => { if (page) page.classList.remove('translate-x-full'); };
    const hidePage = (page) => { if (page) page.classList.add('translate-x-full'); };

    if (signInBtn) signInBtn.addEventListener('click', () => { window.location.href = 'login.html'; });
    if (signOutBtn) signOutBtn.addEventListener('click', handleSignOut);
    if (openSidebarBtn) openSidebarBtn.addEventListener('click', () => sidebar.classList.remove('-translate-x-full'));
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', () => sidebar.classList.add('-translate-x-full'));
    if (aboutUsBtn) aboutUsBtn.addEventListener('click', () => aboutUsModal.classList.remove('hidden'));
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => aboutUsModal.classList.add('hidden'));

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
    
    async function loadProfileData() {
        const userProfile = await getUserProfileData();
        if(userProfile) {
            if(profileFirstNameDisplay) profileFirstNameDisplay.textContent = userProfile.firstName || 'Not set';
            if(profileLastNameDisplay) profileLastNameDisplay.textContent = userProfile.lastName || 'Not set';
            if(profileEmailDisplay) profileEmailDisplay.textContent = userProfile.email || 'Not set';
        }
    };
    
    // --- Chat History Actions ---
    const handleRenameChat = (chatId, chatLinkElement) => {
        const chat = allChats.find(c => c.docId === chatId);
        if (!chat) return;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = chat.title;
        input.className = 'chat-history-rename-input';
        chatLinkElement.replaceWith(input);
        input.focus();
        input.select();
        const saveRename = async () => {
            const newTitle = input.value.trim();
            if (newTitle && newTitle !== chat.title) {
                chat.title = newTitle;
                await updateChatInFirestore(chatId, { title: newTitle });
            }
            renderChatHistoryList();
        };
        input.addEventListener('blur', saveRename);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveRename(); });
    };

    const handleDeleteChat = async (chatId) => {
        if (confirm("Are you sure you want to permanently delete this chat?")) {
            await deleteChatFromFirestore(chatId);
            allChats = allChats.filter(c => c.docId !== chatId);
            renderChatHistoryList();
            if (currentChatId === chatId) startNewChat();
        }
    };
    
    // --- UI Rendering ---
    const renderChatHistoryList = () => {
        if (!chatHistoryContainer) return;
        chatHistoryContainer.innerHTML = '';
        allChats.forEach(chat => {
            const container = document.createElement('div');
            container.className = 'chat-history-item-container';
            const chatLink = document.createElement('a');
            chatLink.href = '#';
            chatLink.className = 'chat-history-link';
            chatLink.textContent = chat.title.length > 20 ? chat.title.substring(0, 17) + '...' : chat.title;
            chatLink.dataset.id = chat.docId;
            const optionsBtn = document.createElement('button');
            optionsBtn.className = 'chat-options-btn';
            optionsBtn.innerHTML = '...';

            chatLink.addEventListener('click', (e) => { e.preventDefault(); loadChat(chat.docId); });
            optionsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.chat-options-menu').forEach(m => m.remove());
                const menu = document.createElement('div');
                menu.className = 'chat-options-menu';
                menu.innerHTML = `<a href="#" class="chat-options-item" data-action="rename">Rename</a><a href="#" class="chat-options-item delete" data-action="delete">Delete</a>`;
                container.appendChild(menu);
                menu.addEventListener('click', (menuEvent) => {
                    menuEvent.stopPropagation();
                    const action = menuEvent.target.dataset.action;
                    if (action === 'rename') handleRenameChat(chat.docId, chatLink);
                    if (action === 'delete') handleDeleteChat(chat.docId);
                    menu.remove();
                });
            });
            container.appendChild(chatLink);
            container.appendChild(optionsBtn);
            chatHistoryContainer.appendChild(container);
        });
    };

    const loadChat = (docId) => {
        const chat = allChats.find(c => c.docId === docId);
        if (!chat) return;
        currentChatId = docId;
        if(chatContainer) chatContainer.innerHTML = '';
        if (welcomeMessage) welcomeMessage.style.display = 'none';
        if (chat.messages) {
            chat.messages.forEach(message => {
                const html = createMessageHtml(message.role, message.parts[0].text);
                if(chatContainer) chatContainer.insertAdjacentHTML('beforeend', html);
            });
        }
        if(chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
        if (window.innerWidth < 768 && sidebar) sidebar.classList.add('-translate-x-full');
    };

    const createMessageHtml = (role, content) => {
        const roleDisplay = role === 'user' ? 'You' : 'EDITH Response';
        const style = role === 'user' ? 'style="border-left-color: #5A67D8; background: rgba(90, 103, 216, 0.1);"' : '';
        const indicator = role === 'model' ? '<div class="response-indicator" style="background: #68D391;"></div>' : '';
        return `<div class="response-section"><div class="response-header">${indicator}${roleDisplay}:</div><div class="response-content" ${style}>${content}</div></div>`;
    };

    const startNewChat = () => {
        currentChatId = null;
        if (chatContainer) chatContainer.innerHTML = '';
        if (chatContainer && welcomeMessage) chatContainer.appendChild(welcomeMessage);
        if (welcomeMessage) welcomeMessage.style.display = 'block';
        if (queryInput) queryInput.value = '';
    };

    if (newChatBtn) newChatBtn.addEventListener('click', startNewChat);

    // --- Core Chat Logic ---
    if (queryForm) {
        queryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const query = queryInput.value.trim();
            if (!query) return;

            let isNewChat = false;
            let activeChat;

            if (currentChatId === null) {
                isNewChat = true;
                const newChatData = { title: query, messages: [] };
                const newDocId = await saveNewChatToFirestore(newChatData);
                if (!newDocId) { alert("Error: Could not create a new chat."); return; }
                currentChatId = newDocId;
                activeChat = { docId: newDocId, ...newChatData };
                allChats.unshift(activeChat);
            } else {
                activeChat = allChats.find(c => c.docId === currentChatId);
            }

            if (welcomeMessage) welcomeMessage.style.display = 'none';
            chatContainer.insertAdjacentHTML('beforeend', createMessageHtml('user', query));
            activeChat.messages.push({ role: 'user', parts: [{ text: query }] });
            queryInput.value = '';

        // Set loading state
        submitBtn.disabled = true;
        btnText.textContent = 'Processing';
        if(submitBtn.querySelector('svg, .spinner')) submitBtn.querySelector('svg, .spinner').remove();
        submitBtn.insertAdjacentHTML('afterbegin', iconProcessing);

        // Create a placeholder for the response
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
                    history: currentChat.messages.slice(0, -1) // Send history *before* this user message
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

            // --- NEW: Update and Save History ---
            if (isFirstMessage) {
                renderChatHistoryList(); // Update the sidebar if it was a new chat
            }
            saveChatsToStorage(); // Save all chats to local storage
            
            // Display successful response
            responseElement.innerHTML = createMessageHtml('model', data.response);

        } catch (error) {
            console.error('Fetch Error:', error);
            const responseElement = document.getElementById(responseId);
            responseElement.innerHTML = `
                <div class="response-header error-header">System Alert:</div>
                <div class="response-content error-content">${error.message}</div>`;
        } finally {
            // Reset loading state
            submitBtn.disabled = false;
            btnText.textContent = 'Send';
            if(submitBtn.querySelector('svg, .spinner')) submitBtn.querySelector('svg, .spinner').remove();
            submitBtn.insertAdjacentHTML('afterbegin', iconSend);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    });

    // Auto-resize textarea
    queryInput.addEventListener('input', () => {
        queryInput.style.height = 'auto';
        queryInput.style.height = (queryInput.scrollHeight) + 'px';
    });

    // --- Initial Load ---
    //updateAuthUI(); // Check login status on page load
    loadChatsFromStorage(); // Assuming this is in your full file
    renderChatHistoryList(); // Assuming this is in your full file
    //loadProfileData(); // Assuming this is in your full file
});

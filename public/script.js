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

    // --- State Management ---
    let allChats = []; // Holds all chat sessions {id, title, messages}
    let currentChatId = null; // The ID of the currently active chat

    // --- Icon Definitions ---
    const iconSend = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`;
    const iconProcessing = `<div class="spinner"></div>`;
    
    // Set initial button icon
    if(submitBtn.querySelector('svg, .spinner')) submitBtn.querySelector('svg, .spinner').remove();
    submitBtn.insertAdjacentHTML('afterbegin', iconSend);
    btnText.textContent = 'Send';

    // --- Sidebar Toggle Functionality ---
    const openSidebar = () => sidebar.classList.remove('-translate-x-full');
    const closeSidebar = () => sidebar.classList.add('-translate-x-full');
    if (openSidebarBtn) openSidebarBtn.addEventListener('click', openSidebar);
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);

    // --- About Us Modal Functionality ---
    const openModal = () => aboutUsModal.classList.remove('hidden');
    const closeModal = () => aboutUsModal.classList.add('hidden');
    if (aboutUsBtn) aboutUsBtn.addEventListener('click', openModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (aboutUsModal) aboutUsModal.addEventListener('click', (e) => {
        if (e.target === aboutUsModal) closeModal();
    });

    // --- Settings and Profile Page Logic ---
    const settingsBtn = document.getElementById('settings-btn');
    const settingsPage = document.getElementById('settings-page');
    const settingsBackBtn = document.getElementById('settings-back-btn');
    const editProfilePage = document.getElementById('edit-profile-page');
    const profileBackBtn = document.getElementById('profile-back-btn');
    const editProfileLink = document.getElementById('edit-profile-link');
    const aboutLink = document.getElementById('about-link');
    
    // --- NEW: Profile Page Element References ---
    const saveProfileBtn = document.getElementById('save-profile-btn');
    const profileNameDisplay = document.getElementById('profile-name-display');
    const profileAvatarDisplay = document.getElementById('profile-avatar-display');
    const profileUsernameInput = document.getElementById('profile-username');
    const profileGenderSelect = document.getElementById('profile-gender');
    const profilePhoneInput = document.getElementById('profile-phone');
    const profileEmailInput = document.getElementById('profile-email');
    const profileDobInput = document.getElementById('profile-dob');

    const showPage = (page) => {
        if (page) page.classList.remove('translate-x-full');
    };
    const hidePage = (page) => {
        if (page) page.classList.add('translate-x-full');
    };

    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => showPage(settingsPage));
    }
    if (settingsBackBtn) {
        settingsBackBtn.addEventListener('click', () => {
            hidePage(settingsPage);
            hidePage(editProfilePage); // Also hide profile page if it was open
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

    // --- NEW: Profile Data Save/Load Logic ---
    const saveProfileData = () => {
        const userProfile = {
            username: profileUsernameInput.value,
            gender: profileGenderSelect.value,
            phone: profilePhoneInput.value,
            email: profileEmailInput.value,
            dob: profileDobInput.value,
        };
        localStorage.setItem('edith_user_profile', JSON.stringify(userProfile));
        alert('Profile saved!'); // Simple confirmation
        loadProfileData(); // Reload data to update display
        hidePage(editProfilePage); // Close the page after saving
    };

    const loadProfileData = () => {
        const storedProfile = localStorage.getItem('edith_user_profile');
        if (storedProfile) {
            const userProfile = JSON.parse(storedProfile);
            profileUsernameInput.value = userProfile.username || '';
            profileGenderSelect.value = userProfile.gender || '';
            profilePhoneInput.value = userProfile.phone || '';
            profileEmailInput.value = userProfile.email || '';
            profileDobInput.value = userProfile.dob || '';

            // Update the display name and avatar in the profile header
            const displayName = userProfile.username || 'User';
            const displayAvatar = displayName.charAt(0).toUpperCase() || 'S';
            
            // Update all instances of the name and avatar
            document.querySelectorAll('.profile-name').forEach(el => el.textContent = displayName);
            document.querySelectorAll('.profile-avatar').forEach(el => el.textContent = displayAvatar);
        }
    };
    
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', saveProfileData);
    }
    
    // --- Chat History Logic ---
    const loadChatsFromStorage = () => {
        const storedChats = localStorage.getItem('edith_all_chats');
        if (storedChats) {
            allChats = JSON.parse(storedChats);
        }
    };

    // Save chats to browser's local storage
    const saveChatsToStorage = () => {
        localStorage.setItem('edith_all_chats', JSON.stringify(allChats));
    };

    // Render the list of chats in the sidebar
    const renderChatHistoryList = () => {
        chatHistoryContainer.innerHTML = ''; // Clear existing list
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

    // Load a specific chat into the main window
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

    // Start a new chat session
    const startNewChat = () => {
        currentChatId = null;
        chatContainer.innerHTML = '';
        chatContainer.appendChild(welcomeMessage);
        welcomeMessage.style.display = 'block';
        queryInput.value = '';
    };

    newChatBtn.addEventListener('click', startNewChat);

    // Helper to create the HTML for a message bubble
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
    
    // --- Core Chat Logic (Modified) ---
    queryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = queryInput.value.trim();
        if (!query) return;

        // --- NEW: History Naming Logic ---
        let isFirstMessage = false;
        if (currentChatId === null) {
            // This is the first message of a new chat
            isFirstMessage = true;
            currentChatId = Date.now();
            const newChat = {
                id: currentChatId,
                title: query, // Use the first query as the title
                messages: []
            };
            allChats.unshift(newChat); // Add to the beginning of our list
        }

        // Hide welcome message
        if (welcomeMessage) welcomeMessage.style.display = 'none';

        // Display user's query
        const userQueryHtml = createMessageHtml('user', query);
        chatContainer.insertAdjacentHTML('beforeend', userQueryHtml);
        
        // Add user message to the current chat's message list
        const currentChat = allChats.find(c => c.id === currentChatId);
        currentChat.messages.push({ role: 'user', parts: [{ text: query }] });
        
        chatContainer.scrollTop = chatContainer.scrollHeight;
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
    loadChatsFromStorage();
    renderChatHistoryList(); // This may already exist in your full file
    loadProfileData(); // Load user profile data when the app starts
});

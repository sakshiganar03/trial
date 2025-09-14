// FILE: public/script.js
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
    let chatHistoryList = []; // For the sidebar list of chats
    // --- CHANGED ---
    // This new array will store the messages for the CURRENT active conversation
    let currentConversation = []; 

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

    // --- Chat History Functionality ---
    const renderChatHistory = () => {
        chatHistoryContainer.innerHTML = ''; // Clear existing history
        chatHistoryList.forEach(chat => {
            const chatLink = document.createElement('a');
            chatLink.href = '#';
            chatLink.className = 'chat-history-link';
            chatLink.textContent = chat.title;
            chatLink.dataset.id = chat.id;
            chatHistoryContainer.appendChild(chatLink);
        });
    };

    newChatBtn.addEventListener('click', () => {
        const now = new Date();
        const newChat = {
            id: Date.now(),
            title: `Chat ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`
        };
        chatHistoryList.unshift(newChat);
        renderChatHistory();
        
        // --- CHANGED ---
        // Clear the active conversation's memory
        currentConversation = []; 
        
        // Clear the main chat window and show welcome message
        chatContainer.innerHTML = '';
        if (welcomeMessage) {
            chatContainer.appendChild(welcomeMessage);
            welcomeMessage.style.display = 'block';
        }
        queryInput.value = '';
    });
    
    // --- Core Chat Logic ---
    queryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = queryInput.value.trim();
        if (!query) return;

        // Hide welcome message on first query
        if (welcomeMessage) welcomeMessage.style.display = 'none';

        // Display user's query
        const userQueryHtml = `
            <div class="response-section">
                <div class="response-header">You:</div>
                <div class="response-content" style="border-left-color: #5A67D8; background: rgba(90, 103, 216, 0.1);">
                    ${query}
                </div>
            </div>`;
        chatContainer.insertAdjacentHTML('beforeend', userQueryHtml);

        // --- ADDED ---
        // Add the user's message to our conversation history state
        currentConversation.push({ role: 'user', parts: [{ text: query }] });
        
        chatContainer.scrollTop = chatContainer.scrollHeight; // Scroll to bottom
        queryInput.value = ''; // Clear input

        // --- Set loading state ---
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
            // --- Send request to our own backend proxy ---
            const res = await fetch(`${window.location.origin}/api/gemini`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // --- CHANGED ---
                // Send the query AND the conversation history
                body: JSON.stringify({
                    query: query,
                    // Send history *before* this user message for context
                    history: currentConversation.slice(0, -1)
                }),
            });

            const responseElement = document.getElementById(responseId);

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'An unknown error occurred.');
            }
            
            const data = await res.json();

            // --- ADDED ---
            // Add the model's response to our conversation history state
            currentConversation.push({ role: 'model', parts: [{ text: data.response }] });
            
            // --- Display successful response ---
            responseElement.innerHTML = `
                <div class="response-header">
                    <div class="response-indicator" style="background: #68D391;"></div>
                    EDITH Response:
                </div>
                <div class="response-content">
                    ${data.response}
                </div>`;

        } catch (error) {
            // --- Display error message ---
            console.error('Fetch Error:', error);
            const responseElement = document.getElementById(responseId);
            responseElement.innerHTML = `
                <div class="response-header error-header">System Alert:</div>
                <div class="response-content error-content">${error.message}</div>`;
        } finally {
            // --- Reset loading state ---
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

    // Initial render of chat history sidebar
    renderChatHistory();
});

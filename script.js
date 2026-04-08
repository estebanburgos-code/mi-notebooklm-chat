document.addEventListener('DOMContentLoaded', () => {
    // --- Reveal Elements on Scroll ---
    const revealElements = document.querySelectorAll('[data-reveal]');
    
    const revealOnScroll = () => {
        for (let i = 0; i < revealElements.length; i++) {
            const windowHeight = window.innerHeight;
            const elementTop = revealElements[i].getBoundingClientRect().top;
            const elementVisible = 150;
            
            if (elementTop < windowHeight - elementVisible) {
                revealElements[i].classList.add('revealed');
            }
        }
    };

    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // Initial check

    // --- Chatbot Toggle ---
    const openChatBtn = document.getElementById('open-chat');
    const closeChatBtn = document.getElementById('close-chat');
    const chatContainer = document.getElementById('chat-container');

    if (openChatBtn && chatContainer) {
        openChatBtn.addEventListener('click', () => {
            chatContainer.classList.remove('hidden');
            if (window.innerWidth < 768) {
                chatContainer.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    if (closeChatBtn && chatContainer) {
        closeChatBtn.addEventListener('click', () => {
            chatContainer.classList.add('hidden');
        });
    }

    // --- Chatbot Logic (NotebookLM Integration via Proxy) ---
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-chat');
    const chatMessages = document.getElementById('chat-messages');
    
    // Recuperar el ID de conversación del almacenamiento local si existe
    let conversationId = localStorage.getItem('notebooklm_conv_id') || null;

    function addMessage(text, sender) {
        if (!text) return;
        const msgDiv = document.createElement('div');
        msgDiv.className = sender === 'user' ? 'user-msg' : 'bot-msg';
        
        if (sender === 'bot') {
            // Renderizamos el Markdown usando la librería Marked.js
            // Esto permite ver listas, negritas y links como en NotebookLM
            msgDiv.innerHTML = marked.parse(text);
        } else {
            msgDiv.textContent = text;
        }
        
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.id = 'typing';
        indicator.innerHTML = '<span></span><span></span><span></span>';
        chatMessages.appendChild(indicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function hideTypingIndicator() {
        const indicator = document.getElementById('typing');
        if (indicator) indicator.remove();
    }

    async function handleSend() {
        const text = chatInput.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        chatInput.value = '';

        showTypingIndicator();
        
        try {
            // Apuntamos a la API local (que luego desplegarás en Render)
            const response = await fetch('/api/query', { // Usamos path relativo para Render
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: text,
                    conversation_id: conversationId
                }),
            });

            const data = await response.json();
            
            hideTypingIndicator();

            if (data.status === 'success') {
                addMessage(data.answer, 'bot');
                // Guardamos el ID para mantener la memoria del chat
                conversationId = data.conversation_id;
                localStorage.setItem('notebooklm_conv_id', conversationId);
            } else {
                addMessage("Lo siento, hubo un error al consultar al experto: " + (data.error || "Desconocido"), 'bot');
            }
        } catch (error) {
            hideTypingIndicator();
            console.error('Error fetching from proxy:', error);
            addMessage("Parece que el servidor del experto está desconectado. Por favor, asegúrate de que el backend esté corriendo.", 'bot');
        }
    }

    if (sendBtn) {
        sendBtn.addEventListener('click', handleSend);
    }

    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSend();
        });
    }

    // --- Interactive Hover Effect for Mini-cards ---
    const miniCards = document.querySelectorAll('.mini-card');
    miniCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px) scale(1.05)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });

    console.log('%c RAG & MCP Expert System Finalized ', 'background: #7c4dff; color: #fff; font-weight: bold; padding: 5px; border-radius: 5px;');
});

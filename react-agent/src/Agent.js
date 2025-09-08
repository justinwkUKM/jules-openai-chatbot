import React, { useState } from 'react';

const Agent = () => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [streamingResponse, setStreamingResponse] = useState('');

    const handleInputChange = (e) => {
        setInput(e.target.value);
    };

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const newMessages = [...messages, { type: 'user', text: input }];
        setMessages(newMessages);
        setInput('');
        setStreamingResponse('...'); // Indicate that the agent is thinking

        try {
            const response = await fetch('http://localhost:8000/chat/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // The backend expects a list of message objects
                body: JSON.stringify(newMessages.map(msg => ({ role: msg.type, content: msg.text }))),
            });

            if (!response.body) return;

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullResponse = '';
            setStreamingResponse(''); // Clear the "thinking" indicator

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                // SSE sends data in "data: ..." format. We need to parse it.
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.substring(6);
                        fullResponse += data;
                        setStreamingResponse(fullResponse);
                    }
                }
            }

            setMessages(prev => [...prev, { type: 'agent', text: fullResponse }]);
            setStreamingResponse('');
        } catch (error) {
            console.error("Error streaming response:", error);
            setStreamingResponse('');
            setMessages(prev => [...prev, { type: 'agent', text: "Sorry, I encountered an error connecting to the backend." }]);
        }
    };

    return (
        <div>
            <div style={{ height: '400px', overflowY: 'scroll', border: '1px solid #ccc', padding: '10px' }}>
                {messages.map((msg, index) => (
                    <div key={index} style={{ textAlign: msg.type === 'user' ? 'right' : 'left' }}>
                        <p><strong>{msg.type === 'user' ? 'You' : 'Agent'}:</strong> {msg.text}</p>
                    </div>
                ))}
                {streamingResponse && (
                    <div style={{ textAlign: 'left' }}>
                        <p><strong>Agent:</strong> {streamingResponse}</p>
                    </div>
                )}
            </div>
            <input
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                style={{ width: '80%', padding: '10px' }}
            />
            <button onClick={handleSendMessage} style={{ width: '19%', padding: '10px' }}>
                Send
            </button>
        </div>
    );
};

export default Agent;

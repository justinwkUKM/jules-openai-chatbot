import React, { useState } from 'react';
import { ChatOpenAI } from "@langchain/openai";
import { StateGraph } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";

const Agent = () => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [streamingResponse, setStreamingResponse] = useState('');

    // Define the state for our graph
    const graphState = {
        messages: {
            value: (x, y) => x.concat(y),
            default: () => [],
        },
    };

    // Define the graph
    const workflow = new StateGraph({
        channels: graphState,
    });

    const apiKey = process.env.REACT_APP_OPENAI_API_KEY || "YOUR_OPENAI_API_KEY";

    // Define the model
    const model = new ChatOpenAI({
        apiKey: apiKey,
        streaming: true,
    });

    // Define the function that calls the model
    const callModel = async (state) => {
        const { messages } = state;
        const response = await model.invoke(messages);
        return { messages: [response] };
    };

    // Add the node to the workflow
    workflow.addNode("model", callModel);

    // Set the entrypoint
    workflow.setEntryPoint("model");

    // Set the finish point
    workflow.setFinishPoint("model");

    // Compile the graph
    const app = workflow.compile();

    const handleInputChange = (e) => {
        setInput(e.target.value);
    };

    const handleSendMessage = async () => {
        if (!input.trim() || apiKey === "YOUR_OPENAI_API_KEY") return;

        const userMessage = new HumanMessage(input);
        setMessages([...messages, { type: 'user', text: input }]);
        setInput('');

        try {
            const stream = await app.stream({ messages: [userMessage] });
            let fullResponse = '';
            for await (const chunk of stream) {
                if (chunk.model && chunk.model.messages) {
                    // This logic might need adjustment based on the exact structure of the streaming chunks
                    const message_chunk = chunk.model.messages[chunk.model.messages.length - 1];
                    if (message_chunk && message_chunk.content) {
                         const content = message_chunk.content;
                        if (content) {
                            fullResponse += content;
                            setStreamingResponse(fullResponse);
                        }
                    }
                }
            }
            setMessages(prev => [...prev, { type: 'agent', text: fullResponse }]);
            setStreamingResponse('');
        } catch (error) {
            console.error("Error streaming response:", error);
            setMessages(prev => [...prev, { type: 'agent', text: "Sorry, I encountered an error." }]);
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
            {apiKey === "YOUR_OPENAI_API_KEY" && (
                <p style={{ color: 'red' }}>
                    Please set your OpenAI API key in a .env file (REACT_APP_OPENAI_API_KEY) to use the chat.
                </p>
            )}
            <input
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                style={{ width: '80%', padding: '10px' }}
                disabled={apiKey === "YOUR_OPENAI_API_KEY"}
            />
            <button
                onClick={handleSendMessage}
                style={{ width: '19%', padding: '10px' }}
                disabled={apiKey === "YOUR_OPENAI_API_KEY"}
            >
                Send
            </button>
        </div>
    );
};

export default Agent;

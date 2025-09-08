import os
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from langchain.agents import AgentExecutor
from langgraph.graph import StateGraph, END
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Define the state for our graph
class AgentState(dict):
    messages: list

# Initialize the model
# Make sure your OPENAI_API_KEY is set in your .env file
model = ChatOpenAI(streaming=True)

# Define the graph
workflow = StateGraph(AgentState)

# Define the function that calls the model
def call_model(state: AgentState):
    messages = state['messages']
    response = model.invoke(messages)
    # We return a list, because this will get added to the existing list
    return {"messages": [response]}

# Add the node to the workflow
workflow.add_node("agent", call_model)

# Set the entrypoint
workflow.set_entry_point("agent")

# Set the finish point
workflow.add_edge("agent", END)

# Compile the graph
app_graph = workflow.compile()

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware to allow requests from the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allows the React app to make requests
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/chat/stream")
async def stream_chat(messages: list):
    async def event_generator():
        # The input to the graph is a dictionary with a "messages" key
        graph_input = {"messages": [HumanMessage(content=msg["content"]) for msg in messages]}

        # Stream the response from the graph
        async for chunk in app_graph.astream(graph_input):
            # Check if the chunk contains the agent's response
            if "agent" in chunk:
                agent_response = chunk["agent"]["messages"][-1]
                if agent_response.content:
                    yield f"data: {agent_response.content}\n\n"
            await asyncio.sleep(0.02) # A small delay to prevent overwhelming the client

    return EventSourceResponse(event_generator())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

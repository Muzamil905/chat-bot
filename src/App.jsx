import { useState } from 'react'
import { Chatbot } from 'supersimpledev';
import { ChatMessage } from './Components/ChatMessage';
import { ChatMessages } from './Components/ChatMessages';
import { ChatInput } from './Components/ChatInput';
import './App.css'



function App(){
          const [chatMessages , setChatMessage] = useState([])
          return(
          <div className ="app-container">
            <ChatMessages chatMessages = {chatMessages} setChatMessage={setChatMessage} />
            <ChatInput chatMessages = {chatMessages} setChatMessage={setChatMessage}/>

          </div>
        )
        }
export default App

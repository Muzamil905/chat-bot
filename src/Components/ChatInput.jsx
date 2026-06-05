import { useState } from "react";
import { Chatbot } from "supersimpledev";



// Chat Input Component 
export    function ChatInput({chatMessages , setChatMessage}){
          const [savedInput, setSavedInput] = useState("");
          const [isLoading, setIsLoading] = useState(false);
          
          function enterMessage(event){
            event.key === "Enter" ? sendMessage () : null ;
          }
          
          function handleChange(){
            setSavedInput(event.target.value);
          }
          
        async function sendMessage(){
          if (isLoading) return; // prevent multiple clicks
          setIsLoading(true);

          const newChatMessages = [
            ...chatMessages,
            { message: savedInput, sender: "user", key: crypto.randomUUID() }
          ];

            // add "Loading..." message
          const loadingMessage = {
            message: "Loading...",
            sender: "robot",
            key: crypto.randomUUID()
          };
          setSavedInput("");
        setChatMessage([...newChatMessages, loadingMessage]);
        const response = await Chatbot.getResponseAsync(savedInput);

  // replace Loading with real response
        setChatMessage([
          ...newChatMessages,
          { message: response, sender: "robot", key: crypto.randomUUID() }
        ]);

          setIsLoading(false);
        }
          
          return(
            <div className = "chat-input-container">
              <input type="text" 
                    placeholder="Send a message to chatbot"   
                    size="30"   
                    onChange={handleChange}   
                    value={savedInput}
                    onKeyDown={enterMessage}
                    className="chat-input"  
              />
              
              <button 
                    onClick={sendMessage} 
                    className = "send-btn"> Send
              </button>
            </div>
          )
        }



import RobotProfilePicture from '../assets/robot.png'
import UserProfilePicture from '../assets/user.png'


        // Chat Messages Component
export function ChatMessage({message , sender }){
          return (
            <div className={
              sender === "user" 
              ? "chat-input-user" 
              : "chat-input-robot"
            }>
            
              {sender === "robot" && <img src={RobotProfilePicture} alt="" className="chat-message-profile"/>}
              <div className="chat-message-text">
                {message}
              </div>
              {sender === "user" && <img src={UserProfilePicture} alt="" className="chat-message-profile"/>}
            </div>
          );
        }

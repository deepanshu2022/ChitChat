import { useContext, useEffect, useRef, useState } from "react"
import Avatar from "./Avatar";
import Logo from "./Logo";
import { UserContext } from "./UserContext";
import uniqBY from 'lodash/uniqBy';
import axios from "axios";
import Contact from "./Contact";

export default function Chat(){
    const [ws, setWs] = useState(null);
    const [onlinePeople, setOnlinePeople] = useState({});
    const [offlinePeople, setOfflinePeople] = useState({});
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [newMessages, setNewMessages] = useState({});
    const [newMessageText, setNewMessageText] = useState('');
    const [messages,setMessages] = useState([]);
    const {username, id, setId, setUsername} = useContext(UserContext);
    const autoScrollToBottom = useRef();


    useEffect(() => {
        connectToWs();
    }, [selectedUserId]);

    
    function connectToWs(){
        const ws = new WebSocket('ws://localhost:3000');
        setWs(ws); 
        ws.addEventListener('message', handleMessage);
        ws.addEventListener('close', () => {
            setTimeout(() =>{
                connectToWs(); 
            },1000);
        });
    }

    function showOnlinePeople(peopleArray){
        const people = {};
        peopleArray.forEach(({userId, username}) => {
            people[userId] = username;
        });
        setOnlinePeople(people);
    }

    function handleMessage(ev){
        const messageData = JSON.parse(ev.data);
        if ('online' in messageData){
            showOnlinePeople(messageData.online);
        } else if('text' in messageData){
            if(messageData.sender === selectedUserId){
                setMessages(prev => ([...prev, messageData]));
            } else {
                setNewMessages(prev => ({
                    ...prev,
                    [messageData.sender]: (prev[messageData.sender] || 0) + 1,
                }));
            }
        }
    }

    function logout() {
        axios.post('/logout').then(() => {
            setWs(null);
            setId(null);
            setUsername(null);
            window.location.reload();
        });
    }

    function sendMessage(ev, file){
        if(ev) {
            ev.preventDefault();
        }
        ws.send(JSON.stringify({
            recipient: selectedUserId,
            text: newMessageText,
            file,
        }));
        
        if(file){
            axios.get('/messages/' + selectedUserId).then(res => {
                setMessages(res.data); 
            });
        } else{
            setNewMessages(prevNewMessages => ({
                ...prevNewMessages,
                [selectedUserId]: 0, // Reset new messages for recipient user
            }));
            setNewMessageText('');
            setMessages(prev => ([...prev, {
                text: newMessageText, 
                sender: id, 
                recipient: selectedUserId,
                _id: Date.now(),
            }]));
        }
    }

    function sendFile(ev){
        const file = ev.target.files[0];
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            sendMessage(null, {
                name: file.name,
                data: reader.result,
            });
        }
    }

    useEffect(() => {
        if (selectedUserId) {
            setNewMessages(prevNewMessages => ({
                ...prevNewMessages,
                [selectedUserId]: 0, // Reset new messages for selected user
            }));
        }
    }, [selectedUserId]);

    useEffect(() => {
        if(autoScrollToBottom.current){
            autoScrollToBottom.current.scrollIntoView({ behavior:'smooth'});
        }
    }, [messages]);

    useEffect(() => {
        axios.get('/people').then(res => {
            const offlinePeopleArr = res.data
                .filter(p => p._id !== id)
                .filter(p => !Object.keys(onlinePeople).includes(p._id));

                const offlinePeople = {};
                offlinePeopleArr.forEach(p => {
                    offlinePeople[p._id] = p;     
                });
                setOfflinePeople(offlinePeople);
        })
    }, [onlinePeople]);


    useEffect(() => {
        if(selectedUserId){
            axios.get('/messages/' + selectedUserId).then(res => {
                setMessages(res.data); 
            })
        }
    }, [selectedUserId]);


    const onlinePeopleExclOurself = {...onlinePeople};
    delete onlinePeopleExclOurself[id];

    const messagesWithoutDupes = uniqBY(messages, '_id');
    

    return (
        <div className="flex h-screen">
            <div className="bg-white w-1/3 p-2 flex flex-col">
                <div className="flex-grow">
                    <Logo />
                    {Object.keys(onlinePeopleExclOurself).map(userId => (  
                        <Contact 
                            key={userId}
                            id={userId} 
                            username={onlinePeopleExclOurself[userId]} 
                            onClick={() => setSelectedUserId(userId)}
                            selected={userId === selectedUserId}
                            online={true}
                            newMessages={newMessages[userId] || 0}
                        />
                    ))}    
                    {Object.keys(offlinePeople).map(userId => (
                        <Contact 
                            key={userId}
                            id={userId} 
                            username={offlinePeople[userId].username}
                            onClick={() => setSelectedUserId(userId)}
                            selected={userId === selectedUserId}
                            online={false}
                            newMessages={newMessages[userId] || 0}
                        />
                    ))}
                </div>
                <div className="p-2 flex gap-7 items-center justify-center">
                    <div className="flex gap-1 items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-8 border border-blue-100 rounded-full ">
                            <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                        </svg>

                        {username}
                    </div>
                    <button
                     onClick={logout}
                     className="text-sm text-gray-400 bg-blue-100 py-1 px-2 border rounded-sm hover:shadow-md hover:bg-blue-200 hover:text-gray-600">Logout</button>
                </div>
            </div>
            <div className="flex flex-col bg-blue-100 w-2/3">
                {selectedUserId && (
                    <div className="h-14 bg-blue-200">
                        <div className="flex items-center gap-2 p-2">
                            <Avatar
                                userId={selectedUserId} 
                                username={onlinePeople[selectedUserId] || offlinePeople[selectedUserId]?.username} 
                                online={onlinePeople[selectedUserId] ? true : false} />
                            <span className="text-md text-gray-800">
                                {onlinePeople[selectedUserId] ? onlinePeople[selectedUserId] : offlinePeople[selectedUserId]?.username}
                            </span>
                        </div>
                    </div>
                )}
                <div className="flex-grow">
                    {!selectedUserId && (
                        <div className="flex flex-grow h-full items-center justify-center">
                            <div className=" text-gray-400 text-xl font-semibold">&larr; Select a user to chat</div>
                        </div>
                    )}    

                    {selectedUserId && (
                        <div className=" relative h-full">
                            <div className="p-2 overflow-y-scroll overflow-x-hidden absolute top-0 left-0 right-0 bottom-2">
                                {messagesWithoutDupes.map(message => (
                                    <div key={message._id} className={(message.sender === id ? 'text-right' : 'text-left')}>
                                        <div className={"text-left inline-block p-1.5 my-2 text-sm max-w-screen-sm " +(message.sender === id ? 'bg-blue-500 text-white rounded-l-md rounded-br-md':'bg-white text-gray-500 rounded-r-md rounded-bl-md')}>
                                            {message.text}
                                            {message.file && (
                                                 <div className="">
                                                     <a className="flex items-center gap-0.5 border-b" href={axios.defaults.baseURL + '/uploads/' + message.file} target="_blank">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                                                        </svg>
                                                        {message.file}
                                                     </a>
                                                 </div>
 
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <div ref={autoScrollToBottom}></div>
                            </div>
                        </div>
                    )}

                </div>
                
                {selectedUserId && (
                    <form className="flex items-center gap-2 mx-2 mb-2" onSubmit={sendMessage}>
                        <input type="text"
                            value={newMessageText}
                            onChange={ev => setNewMessageText(ev.target.value)}
                            placeholder="Type your message here" 
                            className="bg-white p-2 border flex-grow rounded-sm" 
                        />
                        <label className="py-2 text-gray-600 rounded-sm cursor-pointer">
                            <input type="file" className="hidden" onChange={sendFile}/>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                            </svg>
                        </label>
                        <button type="submit" className="bg-blue-500 p-2 text-white rounded-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                            </svg >
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
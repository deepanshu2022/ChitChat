import Avatar from "./Avatar";

export default function Contact({id, username, onClick, selected, online, newMessages}){
    return (
        <div key={id} onClick={() => {onClick(id)}} 
                className={"border-y border-gray-100 flex gap-2 items-center cursor-pointer hover:bg-gray-100 "+(selected ? 'bg-blue-200' : '')}>
        
            {selected && ( 
                <div className="w-1 bg-blue-500 h-12 rounded-r-md"></div>
            )}
            
            <div className="flex gap-2 items-center py-2 pl-4">
                <Avatar online={online} userId={id} username={username} />
                <span className=" text-lg text-gray-800">{username}</span>
            </div>
            {newMessages > 0 && (
                <div className=" flex items-center justify-center w-5 h-5 p-2 rounded-full bg-green-500 text-white text-sm">
                    <span>{newMessages}</span>
                </div>
            )}

        </div>
    )
}
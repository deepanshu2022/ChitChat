import axios from "axios";
import { useContext, useState } from "react"
import { UserContext } from "./UserContext";

export default function RegisterAndLoginForm() {

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoginOrRegister, setIsLoginOrRegister] = useState('login');
    const [errorMessage, setErrorMessage] = useState('');
    const {setUsername:setLoggedInUsername, setId} = useContext(UserContext);

    async function handleSubmit(ev) {
        ev.preventDefault();
        const url = isLoginOrRegister === 'register' ? 'register' : 'login';
        try {
          const { data } = await axios.post(url, { username, password });
          setLoggedInUsername(username);
          setId(data.id);
        } catch (error) {
          // Check if the error response contains a message indicating wrong password
          if (error.response && error.response.data && error.response.data.message === 'Wrong password') {
            // Show a notification saying wrong password
            setErrorMessage('Wrong password');

          } else if (error.response && error.response.status === 409) {
            // User already exists, show a notification saying user already exists
            setErrorMessage('User already exists');

          }else {
            // Handle other errors
            console.error(error);
          }
        }
      }
    
    return (
        <div className="bg-blue-50 h-screen flex flex-col justify-center items-center">
            <img src="/logo.png" className=" w-64 mb-7" />
            <form className="w-64 mb-24" onSubmit={handleSubmit}>
                <input value={username}
                onChange={ev => setUsername(ev.target.value)}
                 type="text"
                 className="block w-full rounded-sm p-2 mb-2 border"
                 placeholder="Username" />
                <input value={password}
                 onChange={ev => setPassword(ev.target.value)} 
                 type="password"
                 className="block w-full rounded-sm p-2 mb-2 border" 
                 placeholder="Password" />

                {errorMessage && <div className="text-red-500 text-sm mb-2">{errorMessage}. Try Logging in.</div>}
                 
                <button className="bg-blue-500 text-white p-2 block w-full rounded-sm">
                    {isLoginOrRegister ==='register'? 'Register' : 'Login'}
                </button>
                <div>
                    {isLoginOrRegister === 'register' && (
                        <div className="flex justify-between text-sm mt-1">
                            <span>Already a member?</span>
                            <button onClick={() => {setIsLoginOrRegister('login');}} 
                            className="hover:text-black text-blue-500">Login here</button>
                        </div>
                    )}
                    {isLoginOrRegister === 'login' && (
                        <div className="flex justify-between text-sm mt-1">
                        <span>Don't have an account?</span>
                        <button onClick={() => {setIsLoginOrRegister('register');}} 
                        className="hover:text-black text-blue-500">Register here</button>
                    </div>
                    )}
                </div>
            </form>
        </div>
    )
}
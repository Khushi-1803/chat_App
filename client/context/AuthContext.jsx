import { createContext,useState  } from "react";
import axios from 'axios'
import toast from "react-hot-toast";
import { useEffect } from "react";
import {io} from "socket.io-client"
import { useNavigate } from 'react-router-dom'

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl


export const AuthContext = createContext();

export const AuthProvider = ({children}) =>{
    const[token,setToken] = useState(localStorage.getItem("token"))
    const [authUser,setAuthUser] = useState(null);
    const [onlineUsers,setOnlineUser] = useState([]);
    const [socket,setSocket] = useState(null);
    const navigate = useNavigate()

    //check if the user is authenticated and if so, set the user data and connect the socket
    
    const checkAuth = async () => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("No token found. Please log in.");
      return;
    }

    const { data } = await axios.get("/api/auth/check", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (data.success) {
      setAuthUser(data.user);
      connectSocket(data.user);
    }
  } catch (error) {
    toast.error(error.response?.data?.message || error.message);
  }
};


    

    //login function to handle user authentication and socket connection
    const login = async(state,credentials)=>{
        try {
            const {data} = await axios.post(`/api/auth/${state}`,credentials)
            if (data.success) {
                setAuthUser(data.userData);
                connectSocket(data.userData);
                axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
                setToken(data.token);
                localStorage.setItem("token",data.token)
                toast.success(data.message)
                navigate("/")
                
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    //logout function to handle user logout and socket disconnection
    const logout = async ()=>{
        localStorage.removeItem("token");
        setToken(null);
        setAuthUser(null);
        setOnlineUser([]);
        axios.defaults.headers.common["token"] = null;
        toast.success("Logged out sucessfully");
        socket.disconnect();
        
    }
   
    const updateProfile = async (body)=>{
        try {
           const {data} = await axios.put("/api/auth/update-profile",body);
           if (data.success) {
            setAuthUser(data.user);
            toast.success("Profile updated sucessfully")
           } 
        } catch (error) {
            toast.error(error.message)
        }
    }

//     const updateProfile = async (body) => {
//   try {
//     const token = localStorage.getItem("token"); // ensure token is sent

//     const { data } = await axios.put("/api/auth/update-profile", body, {
//       headers: {
//         token, // or 'Authorization': `Bearer ${token}` if that's how your backend expects it
//       },
//     });

//     if (data.success) {
//       setAuthUser(data.user); // update user context
//       toast.success("Profile updated successfully");
//       return true; // indicate success to caller
//     } else {
//       toast.error(data.message || "Failed to update profile");
//       return false;
//     }
//   } catch (error) {
//     console.error("Update Profile Error:", error);
//     toast.error(error.response?.data?.message || error.message);
//     return false;
//   }
// };

   


    //connect socket function to handle socket connection and online users updates
    const connectSocket = (userData) =>{
        if (!userData || socket?.connected)  {
        console.log("Socket not connected: Invalid userData", userData);
        return;
    }
        const newSocket = io(backendUrl,{
            query: {
      userId: userData._id, // 
    },
        });
        newSocket.connect();
        setSocket(newSocket);

        newSocket.on("getOnlineUsers",(userIds)=>{
            setOnlineUser(userIds)
        })
    }
    useEffect(()=>{
        if (token) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            checkAuth();
        }
        
    },[])

    const value = {
        axios,
        authUser,
        onlineUsers,
        socket,
        login,
        logout,
        updateProfile
    }
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
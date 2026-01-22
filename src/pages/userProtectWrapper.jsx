import React, { useContext, useEffect, useState } from 'react'
import { UserDataContext } from '../context/UserContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const UserProtectWrapper = ({ children }) => {
    const userToken = localStorage.getItem('userToken')
    const navigate = useNavigate()
    const { setUser } = useContext(UserDataContext)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!userToken) {
            navigate('/user-login')
            return 
        }

        const fetchUserProfile = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/users/profile`, {
                    headers: { Authorization: `Bearer ${userToken}` }
                })
                
                if (response.status === 200) {
                    setUser(response.data.user)
                    setIsLoading(false)
                }
            } catch (err) {
                console.error("Session expired or invalid")
                localStorage.removeItem('userToken')
                navigate('/user-login')
            }
        }

        fetchUserProfile()
    }, [userToken, navigate, setUser])

    if (isLoading) {
        return <div className="h-screen flex items-center justify-center">Loading...</div>
    }

    return <>{children}</>
}

export default UserProtectWrapper;
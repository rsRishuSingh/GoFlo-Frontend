import React from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export const UserLogout = () => {

    const userToken = localStorage.getItem('userToken')
    const navigate = useNavigate()

    axios.get(`${import.meta.env.VITE_API_URL}/users/logout`, {
        headers: {
            Authorization: `Bearer ${userToken}`
        }
    }).then((response) => {
        if (response.status === 200) {
            localStorage.removeItem('userToken')
            navigate('/login')
        }
    })

    return (
        <div>UserLogout</div>
    )
}

export default UserLogout
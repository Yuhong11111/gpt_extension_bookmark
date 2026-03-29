import React from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import useNavigate from '../../hooks/useNavigate';

// dashboard page only accessible to authenticated users, shows the authenticated user info and a logout button, if the user is not authenticated, they will be redirected to the login page by the ProtectedRoute component
function Dashboard({ authenticatedUser }) {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
        } finally {
            navigate('/log-in');
        }
    };

    return (
        <div>
            <h1>Dashboard</h1>
            <p>Welcome back, {authenticatedUser?.fullName || 'user'}.</p>
            <p>Your email is {authenticatedUser?.email}.</p>
            {authenticatedUser?.company ? <p>Company: {authenticatedUser.company}</p> : null}
            <button type='button' onClick={handleLogout}>Log out</button>
            <p><Link to='/'>Back to home</Link></p>
        </div>
    );
}

export default Dashboard;

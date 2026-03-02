import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-[#FFF9F0]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#3DBDB4] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[#2D3748] font-bold animate-pulse">Initializing Linaw...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/auth" />;
    }

    return children;
};

export default ProtectedRoute;

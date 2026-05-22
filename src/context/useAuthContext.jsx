import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MENU_ITEMS, filterMenuByPermission } from "../constants/menu";

const AuthContext = createContext(undefined);

export function useAuthContext() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
}

const authSessionKey = '_UBOLD_AUTH_KEY_';

export function AuthProvider({ children }) {
    const navigate = useNavigate();
    
    const [permissions, setPermissions] = useState([]);
    const [filteredMenu, setFilteredMenu] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // 🔹 Fungsi untuk mengambil session dari localStorage
    const getSession = useCallback(() => {
        // console.log('🔄 AuthProvider - Getting session from localStorage...');
        
        try {
            const stored = localStorage.getItem(authSessionKey);
            
            if (!stored) {
                console.log('❌ No session found in localStorage');
                return null;
            }
            
            const parsed = JSON.parse(stored);
            // console.log('✅ Session found in localStorage:', {
            //     id: parsed.id,
            //     name: parsed.name,
            //     email: parsed.email,
            //     permissionsCount: parsed.permissions?.length || 0
            // });
            
            // Extract permissions
            const userPermissions = parsed.permissions || [];
            setPermissions(userPermissions);
            
            // Filter menu
            if (userPermissions.length > 0) {
                const filtered = filterMenuByPermission(MENU_ITEMS, userPermissions);
                setFilteredMenu(filtered);
                // console.log('✅ Menu filtered:', filtered.length, 'items');
            } else {
                setFilteredMenu([]);
            }
            
            return parsed;
            
        } catch (error) {
            console.error('❌ Error parsing session from localStorage:', error);
            // Jika data corrupt, hapus
            localStorage.removeItem(authSessionKey);
            return null;
        }
    }, []);

    // 🔹 Effect untuk load session saat pertama kali
    useEffect(() => {
        // console.log('🚀 AuthProvider - Initializing...');
        const session = getSession();
        setUser(session);
        setLoading(false);
    }, [getSession]);

    // 🔹 Effect untuk update menu ketika permissions berubah
    useEffect(() => {
        if (permissions.length > 0) {
            const filtered = filterMenuByPermission(MENU_ITEMS, permissions);
            setFilteredMenu(filtered);
        } else {
            setFilteredMenu([]);
        }
    }, [permissions]);

    // 🔹 SIMPLE SAVE SESSION - hanya localStorage
    const saveSession = (userData) => {
        // console.log('💾 Saving session to localStorage:', userData);
        
        // Pastikan ada permissions
        const userWithPermissions = {
            ...userData,
            permissions: userData.permissions || [],
            savedAt: new Date().toISOString() // Tambah timestamp
        };
        
        try {
            // Simpan ke localStorage
            localStorage.setItem(authSessionKey, JSON.stringify(userWithPermissions));
            
            // Update state
            setUser(userWithPermissions);
            setPermissions(userWithPermissions.permissions);
            
            // console.log('✅ Session saved successfully to localStorage');
            // console.log('Stored data:', {
            //     id: userWithPermissions.id,
            //     name: userWithPermissions.name,
            //     tokenExists: !!userWithPermissions.token,
            //     permissionsCount: userWithPermissions.permissions?.length || 0
            // });
            
        } catch (error) {
            console.error('❌ Failed to save session to localStorage:', error);
            throw new Error('Failed to save session: ' + error.message);
        }
    };

    // 🔹 REMOVE SESSION - hapus dari localStorage
    const removeSession = () => {
        // console.log('🗑️ Removing session from localStorage...');
        
        try {
            // Hapus dari localStorage
            localStorage.removeItem(authSessionKey);
            
            // Hapus juga token jika ada di tempat lain
            localStorage.removeItem('authToken');
            localStorage.removeItem('role');
            
            // Clear state
            setUser(null);
            setPermissions([]);
            setFilteredMenu([]);
            
            // Clear axios header
            delete axios.defaults.headers.common['Authorization'];
            
            // console.log('✅ Session removed from localStorage');
            
            // Navigate to login
            navigate('/auth/login');
            
        } catch (error) {
            // console.error('❌ Failed to remove session:', error);
        }
    };

    // 🔹 Update permissions saja
    const updatePermissions = (newPermissions) => {
        setPermissions(newPermissions);
        
        // Update juga di user data di localStorage
        if (user) {
            const updatedUser = {
                ...user,
                permissions: newPermissions,
                updatedAt: new Date().toISOString()
            };
            
            try {
                localStorage.setItem(authSessionKey, JSON.stringify(updatedUser));
                setUser(updatedUser);
                // console.log('✅ Permissions updated in localStorage');
            } catch (error) {
                console.error('❌ Failed to update permissions:', error);
            }
        }
    };

    // 🔹 Check permissions
    const hasPermission = (requiredPermission) => {
        if (!requiredPermission) return true;
        if (!permissions || permissions.length === 0) return false;
        return permissions.includes(requiredPermission);
    };

    const hasAnyPermission = (requiredPermissions) => {
        if (!requiredPermissions || requiredPermissions.length === 0) return true;
        if (!permissions || permissions.length === 0) return false;
        return requiredPermissions.some(perm => permissions.includes(perm));
    };

    const hasAllPermissions = (requiredPermissions) => {
        if (!requiredPermissions || requiredPermissions.length === 0) return true;
        if (!permissions || permissions.length === 0) return false;
        return requiredPermissions.every(perm => permissions.includes(perm));
    };

    // 🔹 Function untuk validate session (cek token masih valid)
    const validateSession = async () => {
        if (!user?.token) {
            console.log('❌ No token found in session');
            return false;
        }
        
        try {
            // Coba hit endpoint yang protected untuk cek token validity
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/user`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            });
            
            // console.log(' Session token is valid');
            return true;
            
        } catch (error) {
            // console.log(' Session token is invalid or expired:', error.response?.status);
            removeSession(); // Auto logout jika token invalid
            return false;
        }
    };

    // 🔹 Loading state
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                flexDirection: 'column'
            }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Memuat sesi...</p>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{
            user,
            setUser,
            isAuthenticated: !!user, // Cek apakah user ada
            permissions,
            filteredMenu,
            saveSession,
            removeSession,
            updatePermissions,
            hasPermission,
            hasAnyPermission,
            hasAllPermissions,
            validateSession
        }}>
            {children}
        </AuthContext.Provider>
    );
}
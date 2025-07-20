import { useContext, createContext, useState, useEffect } from 'react';
import { Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { account } from '../lib/appwriteConfig.js';

const AuthContext = createContext({
    session: null,
    user: null,
    loading: true,
    login: ({ email, password }) => {},
    register: ({ email, password, name }) => {},
    logout: () => {}
});

const AuthProvider = ({ children }) => {
    const [loading, setLoading] = useState(true) // This is for initial app load only
    const [session, setSession] = useState(null)
    const [user, setUser] = useState(null)
    const [isAuthenticating, setIsAuthenticating] = useState(false)

    useEffect(() => {
        if (!isAuthenticating) {
            checkAuth();
        }
    }, [isAuthenticating]);

    const checkAuth = async () => {
        try {
            const responseSession = await account.getSession('current');
            
            if (responseSession && responseSession.provider === 'anonymous') {
                setSession(null);
                setUser(null);
                setLoading(false);
                return;
            }
            
            const responseUser = await account.get();
            
            setSession(responseSession);
            setUser(responseUser);
            
        } catch (error) {
            setSession(null);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    const register = async ({ email, password, name }) => {
        // Don't set global loading for register
        try {
            const response = await account.create(
                'unique()',
                email,
                password,
                name
            );
            
            return { success: true, user: response };
        } catch (error) {
            console.error('Registration error in AuthContext:', error);
            throw error;
        }
    };

    const login = async ({ email, password }) => {
        // FIXED: Don't set global loading during login attempts
        try {
            console.log('AuthContext: Attempting login...');
            
            const responseSession = await account.createEmailPasswordSession(
                email,
                password
            );
            
            console.log('AuthContext: Session created successfully');
            setSession(responseSession);
            
            const responseUser = await account.get();
            console.log('AuthContext: User data retrieved');
            setUser(responseUser);
            
            if (typeof window !== 'undefined' && window.sessionStorage) {
                sessionStorage.setItem('justLoggedIn', 'true');
            }
            
            return { success: true, user: responseUser };
            
        } catch (error) {
            console.error('AuthContext login error:', error);
            
            // Clean up on error
            setSession(null);
            setUser(null);
            
            // Re-throw error so login component can handle it
            throw error;
        }
    };

    const logout = async () => {
        setLoading(true); // This is OK for logout since we're leaving
        try {
            await account.deleteSession('current');
        } catch (error) {
            console.error('Logout error:', error);
            // Continue with logout even if server call fails
        }
        
        setSession(null);
        setUser(null);
        setLoading(false);
    }

    const contextData = { session, user, loading, login, register, logout };
    
    return (
        <AuthContext.Provider value={contextData}>
            {loading ? (
                <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text>Loading...</Text>
                </SafeAreaView>
            ) : (
                children
            )}
        </AuthContext.Provider>
    )
}

const useAuth = () => {
    return useContext(AuthContext);
}

export { useAuth, AuthContext, AuthProvider };
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
    const [loading, setLoading] = useState(true)
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
        setLoading(true);
        try {
            const response = await account.create(
                'unique()',
                email,
                password,
                name
            );
            
            return { success: true, user: response };
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const login = async ({ email, password }) => {
        setLoading(true);
        try {
            const responseSession = await account.createEmailPasswordSession(
                email,
                password
            );
            
            setSession(responseSession);
            
            const responseUser = await account.get();
            setUser(responseUser);
            
            if (typeof window !== 'undefined' && window.sessionStorage) {
                sessionStorage.setItem('justLoggedIn', 'true');
            }
            
        } catch (error) {
            setSession(null);
            setUser(null);
            throw error;
        }
        setLoading(false);
    };

    const logout = async () => {
        setLoading(true);
        try {
            await account.deleteSession('current');
        } catch (error) {
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
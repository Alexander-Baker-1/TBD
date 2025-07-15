import { useContext, createContext, useState, useEffect, use } from 'react';
import { Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { account } from '../lib/appwriteConfig.js';

const AuthContext = createContext({
    session: false,
    user: null,
    login: ({ email, password }) => {},
    logout: () => {}
});

const AuthProvider = ({ children }) => {
    const [loading, setLoading] = useState(true)
    const [session, setSession] = useState(false)
    const [user, setUser] = useState(false)

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        checkAuth();
    }

    const checkAuth = async () => {
        try {
            const responseSession = await account.getSession('current');
            setSession(responseSession);

            const responseUser = await account.get();
            setUser(responseUser);
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    }

    const login = async ({ email, password }) => {
        setLoading(true);
        try {
            const responseSession = await account.createEmailPasswordSession(
                email,
                password
            );
            setSession(responseSession)
            const responseUser = await account.get()
            setUser(responseUser)
        } catch (error) {
            console.error(error);
        }
        setLoading(false)
    };
    const logout = async () => {}

    const contextData = {session, user, login, logout}
    return (
        <AuthContext.Provider value={contextData}>
        {
        loading ? (
            <SafeAreaView>
                <Text>Loading...</Text>
            </SafeAreaView>
         ) : (
            children
        )}
    </AuthContext.Provider>
    )
}

const useAuth = () => {
    return useContext(AuthContext)
}

export {useAuth, AuthContext, AuthProvider}
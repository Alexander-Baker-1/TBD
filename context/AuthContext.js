import {useContext, createContext, useState} from 'react';
import {Text, SafeAreaView} from 'react-native'

const AuthContext = createContext();

const AuthProvider = ({children}) => {
    const [loading, setLoading] = useState(false)
    const [session, setSession] = useState(false)
    const [user, setUser] = useState(false)
    const login = async () => {}
    const logout = async () => {}

    const contextData = {session, user, login, logout}
    return (
        <AuthContext.Provider value={contextData}>
        {
        loading ? (
            <SafeAreaView>
                <Text>Loading..</Text>
                </SafeAreaView>
         ) : (
            children
        )}
    </AuthContext.Provider>
    )
}

const useAuth = () => {return useContext(AuthContext)}

export {useAuth, AuthContext, AuthProvider}
import { Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import React from 'react'
import { useAuth } from '../context/AuthContext';
import { Redirect } from 'expo-router';

const login = () => {
    return (
        <SafeAreaView>
            <Text>Log In</Text>
        </SafeAreaView>
    )
}

export default login
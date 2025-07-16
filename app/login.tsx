import React, { useState } from 'react'
import { Text, View, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'expo-router'

function Login() {
    const { login: authLogin } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState(""); // Back to email for simplicity
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    
    const handleSubmit = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await authLogin({ email, password });
            // Navigation will be handled by your auth context/layout
        } catch (error: any) {
            console.error('Login error:', error);
            
            // Handle specific error messages
            let errorMessage = 'Something went wrong';
            
            if (error.message?.includes('Invalid `email` param')) {
                errorMessage = 'Please enter a valid email address';
            } else if (error.message?.includes('Invalid credentials')) {
                errorMessage = 'Invalid email or password';
            } else if (error.message?.includes('user_not_found')) {
                errorMessage = 'No account found with this email';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            Alert.alert('Login Failed', errorMessage, [
                {
                    text: 'OK',
                    onPress: () => {
                        // Clear the form and stay on login page
                        setEmail('');
                        setPassword('');
                    }
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.container}>
                <View>
                    <Text style={styles.headline}>Log In</Text>
                    <Text>Email:</Text>
                    <TextInput
                        placeholder="Enter your email..."
                        style={styles.input}
                        value={email}
                        onChangeText={(text) => setEmail(text)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    <Text>Password:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        value={password}
                        onChangeText={(text) => setPassword(text)}
                        secureTextEntry
                        autoCapitalize="none"
                    />
                    <TouchableOpacity 
                        style={[styles.button, loading && styles.buttonDisabled]} 
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>
                            {loading ? 'Logging in...' : 'Login'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.linkContainer}>
                <Text style={styles.linkText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/register')}>
                    <Text style={styles.link}>Sign Up</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: "center",
    },
    headline: {
        textAlign: "center",
        marginTop: -100,
        marginBottom: 50,
        fontWeight: "700",
        fontStyle: "italic",
        fontSize: 72,
    },
    input: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 10,
        marginTop: 10,
        marginBottom: 10,
        borderColor: "grey",
    },
    button: {
        backgroundColor: "black",
        padding: 12,
        borderRadius: 6,
        alignItems: "center",
        marginTop: 10,
    },
    buttonDisabled: {
        backgroundColor: "grey",
    },
    buttonText: {
        color: "white",
        fontSize: 18,
    },
    linkContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingBottom: 20,
    },
    linkText: {
        fontSize: 16,
        color: '#666',
    },
    link: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '600',
    },
});

export default Login;
import React, { useState } from 'react'
import { Text, View, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'expo-router'

function Login() {
    const { login: authLogin } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    const handleSubmit = async () => {
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError(''); // Clear previous errors
        
        try {
            const result = await authLogin({ email: email.toLowerCase().trim(), password });
            // If login is successful, loading will stay true until navigation happens
            console.log('Login successful:', result);
        } catch (error: any) {
            console.error('Login error:', error);
            
            // Ensure we stop loading on error
            setLoading(false);
            
            // Handle specific error messages with user-friendly text
            let errorMessage = 'Something went wrong. Please try again.';
            
            // More robust error checking
            const errorString = error?.message || error?.toString() || '';
            
            if (errorString.includes('Invalid `email` param') || errorString.includes('valid email address')) {
                errorMessage = 'Please enter a valid email address';
            } else if (errorString.includes('Invalid `password` param') || errorString.includes('Password must be between')) {
                errorMessage = 'Invalid credentials. Please check the email and password.';
            } else if (errorString.includes('Invalid credentials')) {
                errorMessage = 'Invalid credentials. Please check the email and password.';
            } else if (errorString.includes('user_not_found')) {
                errorMessage = 'No account found with this email address';
            } else if (errorString.includes('User (role: guests) missing scope')) {
                errorMessage = 'Account access restricted. Please contact support.';
            } else if (errorString.includes('Rate limit')) {
                errorMessage = 'Too many attempts. Please wait a moment and try again.';
            } else if (errorString.includes('AppwriteException')) {
                errorMessage = 'Invalid credentials. Please check the email and password.';
            }
            
            setError(errorMessage);
            
            // Prevent any potential crashes by ensuring we don't re-throw
            console.log('Error handled gracefully');
        }
        // Note: We don't use finally here because on successful login,
        // we want to keep loading=true until navigation completes
    };

    const clearError = () => {
        setError('');
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.container}>
                <View>
                    <Text style={styles.headline}>Log In</Text>
                    
                    {/* Error Message Display */}
                    {error ? (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}
                    
                    <Text>Email:</Text>
                    <TextInput
                        placeholder="Enter your email..."
                        style={[styles.input, error && styles.inputError]}
                        value={email}
                        onChangeText={(text) => {
                            setEmail(text);
                            clearError(); // Clear error when user starts typing
                        }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    <Text>Password:</Text>
                    <TextInput
                        style={[styles.input, error && styles.inputError]}
                        placeholder="Password"
                        value={password}
                        onChangeText={(text) => {
                            setPassword(text);
                            clearError(); // Clear error when user starts typing
                        }}
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
    errorContainer: {
        backgroundColor: '#fee2e2',
        borderColor: '#fecaca',
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    errorText: {
        color: '#dc2626',
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 10,
        marginTop: 10,
        marginBottom: 10,
        borderColor: "grey",
    },
    inputError: {
        borderColor: '#dc2626',
        backgroundColor: '#fef2f2',
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
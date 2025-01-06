import React from 'react';
import LoginForm from '../../components/auth/Login';
import styles from './Login.module.css';
const LoginPage: React.FC = () => {
    return (
        <div className={styles.loginPage}>
            <div className={styles.loginContainer}>
                <h1>Welcome to SkyChat</h1>
                <LoginForm />
            </div>
        </div>
    );
};

export default LoginPage; 
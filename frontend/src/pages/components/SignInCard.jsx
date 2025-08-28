import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MuiCard from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';
import { styled } from '@mui/material/styles';
import AuthService from '../../services/authService';
import { useAuth } from '../../hooks/useAuthContext';

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  border: '1px solid #000',
  borderRadius: theme.spacing(1),
  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
  [theme.breakpoints.up('sm')]: {
    width: '450px',
  },
  ...theme.applyStyles('dark', {
    border: '1px solid #333',
    backgroundColor: theme.palette.background.paper,
  }),
}));

const BlackButton = styled(Button)(() => ({
  backgroundColor: '#000',
  color: '#fff',
  border: '1px solid #000',
  '&:hover': {
    backgroundColor: '#333',
    borderColor: '#333',
  },
  '&:disabled': {
    backgroundColor: '#666',
    color: '#ccc',
  },
}));

const BlackOutlinedButton = styled(Button)(() => ({
  color: '#000',
  border: '1px solid #000',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderColor: '#000',
  },
}));

export default function SignInCard() {
  const { login } = useAuth();
  const navigate = useNavigate();
  // Form state management
  const [isSignUp, setIsSignUp] = React.useState(false);
  const [showEmailVerification, setShowEmailVerification] = React.useState(false);
  const [showVerifyEmailOnly, setShowVerifyEmailOnly] = React.useState(false);
  
  // Form data
  const [formData, setFormData] = React.useState({
    email: '',
    username: '',
    password: '',
    otp: ''
  });

  // UI state
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [showSnackbar, setShowSnackbar] = React.useState(false);

  // Validation state
  const [emailError, setEmailError] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState(false);
  const [usernameError, setUsernameError] = React.useState(false);

  // Handle input changes
  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation errors on input
    if (field === 'email') setEmailError(false);
    if (field === 'password') setPasswordError(false);
    if (field === 'username') setUsernameError(false);
    setError('');
  };

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    let hasErrors = false;

    if (!formData.email || !validateEmail(formData.email)) {
      setEmailError(true);
      hasErrors = true;
    }

    if (!showEmailVerification && !showVerifyEmailOnly && (!formData.password || formData.password.length < 6)) {
      setPasswordError(true);
      hasErrors = true;
    }

    if (isSignUp && (!formData.username || formData.username.length < 3)) {
      setUsernameError(true);
      hasErrors = true;
    }

    return !hasErrors;
  };

  // Handle sign in
  const handleSignIn = async () => {
    if (!validateForm()) {
      setError('Please fix the validation errors');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await login({
        email: formData.email,
        password: formData.password
      });

      if (response && response.success) {
        setSuccess('Login successful!');
        setShowSnackbar(true);
        
      }
    } catch (error) {
      setError(error.message || 'Login failed');
      setShowSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sign up
  const handleSignUp = async () => {
    if (!validateForm()) {
      setError('Please fix the validation errors');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await AuthService.register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });

      if (response.success) {
        setSuccess('Registration successful! Please check your email for verification.');
        setShowSnackbar(true);
        setShowEmailVerification(true);
      }
    } catch (error) {
      setError(error.message || 'Registration failed');
      setShowSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP verification
  const handleVerifyEmail = async () => {
    if (!formData.otp || formData.otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await AuthService.verifyEmail(formData.email, formData.otp);
      
      if (response.success) {
        setSuccess('Email verified successfully! You can now sign in.');
        setShowSnackbar(true);
        setShowEmailVerification(false);
        setShowVerifyEmailOnly(false);
        setIsSignUp(false);
        setFormData(prev => ({ ...prev, otp: '' }));
      }
    } catch (error) {
      setError(error.message || 'Email verification failed');
      setShowSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend OTP - for verify email only option
  const handleSendVerificationOTP = async () => {
    if (!formData.email || !validateEmail(formData.email)) {
      setError('Please enter a valid email address first');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await AuthService.resendEmailOTP(formData.email);
      
      if (response.success) {
        setSuccess('Verification code sent to your email');
        setShowSnackbar(true);
        setShowEmailVerification(true);
        setShowVerifyEmailOnly(false);
      }
    } catch (error) {
      setError(error.message || 'Failed to send verification code');
      setShowSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend OTP - for existing verification flow
  const handleResendOTP = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await AuthService.resendEmailOTP(formData.email);
      
      if (response.success) {
        setSuccess('Verification code resent to your email');
        setShowSnackbar(true);
      }
    } catch (error) {
      setError(error.message || 'Failed to resend verification code');
      setShowSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (event) => {
    event.preventDefault();
    
    if (showEmailVerification) {
      handleVerifyEmail();
    } else if (showVerifyEmailOnly) {
      handleSendVerificationOTP();
    } else if (isSignUp) {
      handleSignUp();
    } else {
      handleSignIn();
    }
  };

  const handleSnackClose = () => {
    setShowSnackbar(false);
    setError('');
    setSuccess('');
  };

  const getTitle = () => {
    if (showEmailVerification) return 'Verify Email';
    if (showVerifyEmailOnly) return 'Verify Email';
    if (isSignUp) return 'Sign up';
    return 'Sign in';
  };

  const getButtonText = () => {
    if (showEmailVerification) return 'Verify Email';
    if (showVerifyEmailOnly) return 'Send Verification Code';
    if (isSignUp) return 'Sign up';
    return 'Sign in';
  };

  return (
    <Card variant="outlined">
      <Typography
        component="h1"
        variant="h4"
        sx={{ 
          width: '100%', 
          fontSize: 'clamp(2rem, 10vw, 2.15rem)',
          color: '#000',
          fontWeight: 'bold'
        }}
      >
        {getTitle()}
      </Typography>
      
      <Box
        component="form"
        onSubmit={handleSubmit}
        noValidate
        sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 2 }}
      >
        {!showEmailVerification ? (
          <>
            <FormControl>
              <FormLabel htmlFor="email" sx={{ color: '#000', fontWeight: 'medium' }}>
                Email
              </FormLabel>
              <TextField
                error={emailError}
                helperText={emailError ? 'Please enter a valid email address' : ''}
                id="email"
                type="email"
                name="email"
                placeholder="your@email.com"
                autoComplete="email"
                autoFocus
                required
                fullWidth
                variant="outlined"
                value={formData.email}
                onChange={handleInputChange('email')}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#000',
                    },
                    '&:hover fieldset': {
                      borderColor: '#000',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#000',
                    },
                  },
                }}
              />
            </FormControl>

            {isSignUp && !showVerifyEmailOnly && (
              <FormControl>
                <FormLabel htmlFor="username" sx={{ color: '#000', fontWeight: 'medium' }}>
                  Username
                </FormLabel>
                <TextField
                  error={usernameError}
                  helperText={usernameError ? 'Username must be at least 3 characters' : ''}
                  id="username"
                  type="text"
                  name="username"
                  placeholder="username"
                  autoComplete="username"
                  required
                  fullWidth
                  variant="outlined"
                  value={formData.username}
                  onChange={handleInputChange('username')}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#000',
                      },
                      '&:hover fieldset': {
                        borderColor: '#000',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#000',
                      },
                    },
                  }}
                />
              </FormControl>
            )}

            {!showVerifyEmailOnly && (
              <FormControl>
                <FormLabel htmlFor="password" sx={{ color: '#000', fontWeight: 'medium' }}>
                  Password
                </FormLabel>
                <TextField
                  error={passwordError}
                  helperText={passwordError ? 'Password must be at least 6 characters' : ''}
                  name="password"
                  placeholder="••••••"
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  required
                  fullWidth
                  variant="outlined"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#000',
                      },
                      '&:hover fieldset': {
                        borderColor: '#000',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#000',
                      },
                    },
                  }}
                />
              </FormControl>
            )}
          </>
        ) : (
          <FormControl>
            <FormLabel htmlFor="otp" sx={{ color: '#000', fontWeight: 'medium' }}>
              Verification Code
            </FormLabel>
            <TextField
              id="otp"
              type="text"
              name="otp"
              placeholder="Enter 6-digit code"
              required
              fullWidth
              variant="outlined"
              value={formData.otp}
              onChange={handleInputChange('otp')}
              inputProps={{ maxLength: 6 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#000',
                  },
                  '&:hover fieldset': {
                    borderColor: '#000',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#000',
                  },
                },
              }}
            />
            <Typography variant="body2" sx={{ mt: 1, color: '#666' }}>
              Enter the verification code sent to {formData.email}
            </Typography>
          </FormControl>
        )}

        <BlackButton
          type="submit"
          fullWidth
          variant="contained"
          disabled={isLoading}
          sx={{ mt: 2 }}
        >
          {isLoading ? (
            <CircularProgress size={24} sx={{ color: '#fff' }} />
          ) : (
            getButtonText()
          )}
        </BlackButton>

        {showEmailVerification && (
          <BlackOutlinedButton
            onClick={handleResendOTP}
            disabled={isLoading}
            sx={{ mt: 1 }}
          >
            Resend Verification Code
          </BlackOutlinedButton>
        )}
      </Box>

      {!showEmailVerification && (
        <>
          <Divider sx={{ my: 2 }}>or</Divider>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <BlackOutlinedButton
              fullWidth
              onClick={() => {
                setShowVerifyEmailOnly(true);
                setIsSignUp(false);
                setFormData({ email: '', username: '', password: '', otp: '' });
                setError('');
              }}
            >
              Verify Email
            </BlackOutlinedButton>
          </Box>

          <Typography sx={{ textAlign: 'center', mt: 2 }}>
            {showVerifyEmailOnly ? (
              <>
                Want to sign in instead?{' '}
                <Button 
                  variant="text" 
                  sx={{ color: '#000', textDecoration: 'underline' }}
                  onClick={() => {
                    setShowVerifyEmailOnly(false);
                    setIsSignUp(false);
                    setFormData({ email: '', username: '', password: '', otp: '' });
                    setError('');
                  }}
                >
                  Sign in
                </Button>
              </>
            ) : isSignUp ? (
              <>
                Already have an account?{' '}
                <Button 
                  variant="text" 
                  sx={{ color: '#000', textDecoration: 'underline' }}
                  onClick={() => {
                    setIsSignUp(false);
                    setShowVerifyEmailOnly(false);
                    setFormData({ email: '', username: '', password: '', otp: '' });
                    setError('');
                  }}
                >
                  Sign in
                </Button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{' '}
                <Button 
                  variant="text" 
                  sx={{ color: '#000', textDecoration: 'underline' }}
                  onClick={() => {
                    setIsSignUp(true);
                    setShowVerifyEmailOnly(false);
                    setFormData({ email: '', username: '', password: '', otp: '' });
                    setError('');
                  }}
                >
                  Sign up
                </Button>
              </>
            )}
          </Typography>
        </>
      )}

      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={handleSnackClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackClose} 
          severity={error ? 'error' : 'success'}
          sx={{ 
            width: '100%',
            border: '1px solid #000',
            '& .MuiAlert-icon': {
              color: '#000',
            },
          }}
        >
          {error || success}
        </Alert>
      </Snackbar>
    </Card>
  );
}

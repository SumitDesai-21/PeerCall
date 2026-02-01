import { useState, useContext } from "react";
import {
    Box, Button, Card, CardContent, TextField, Typography, Tab, Tabs, Alert, CircularProgress, Container, CssBaseline,
    IconButton
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import VideocamIcon from "@mui/icons-material/Videocam";
import HomeIcon from "@mui/icons-material/Home";
import AuthContext from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const theme = createTheme({
    palette: {
        primary: {
            main: "#2563eb",
        },
    },
});

export default function Authentication() {
    const navigate = useNavigate();
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Form states
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const { handleLogin, handleRegister } = useContext(AuthContext);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        setError("");
        setSuccess("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            if (tabValue === 0) {
                // Login
                await handleLogin(email, password);
            } else {
                // Register
                const message = await handleRegister(name, email, password);
                setSuccess(message || "Registration successful! Please sign in.");
                setTabValue(0);
                setName("");
                setPassword("");
            }
        } catch (err) {
            setError(
                err.response?.data?.message || "Something went wrong. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };
    return (
        <ThemeProvider theme={theme}>

            <IconButton onClick={() => {
                navigate('/');
            }}>
                <HomeIcon /> <span style={{ fontSize: "1rem", color: "#555", paddingLeft: "5px", paddingTop: "3px" }}>Home</span>
            </IconButton>

            <CssBaseline />
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#f5f5f5",
                    py: 4,
                }}
            >
                <Container maxWidth="sm">
                    {/* Logo */}
                    <Box sx={{ textAlign: "center", mb: 3 }}>
                        <Box
                            sx={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 1,
                                color: "#2563eb",
                            }}
                        >
                            <VideocamIcon sx={{ fontSize: 32 }} />
                            <Typography variant="h5" fontWeight="bold">
                                PeerCall
                            </Typography>
                        </Box>
                    </Box>

                    {/* Auth Card */}
                    <Card sx={{ borderRadius: 3, boxShadow: 6 }}>
                        <CardContent sx={{ p: 4 }}>
                            {/* Tabs */}
                            <Tabs
                                value={tabValue}
                                onChange={handleTabChange}
                                variant="fullWidth"
                                sx={{ mb: 3 }}
                            >
                                <Tab label="Sign In" />
                                <Tab label="Sign Up" />
                            </Tabs>

                            {/* Alerts */}
                            {error && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {error}
                                </Alert>
                            )}
                            {success && (
                                <Alert severity="success" sx={{ mb: 2 }}>
                                    {success}
                                </Alert>
                            )}

                            {/* Form */}
                            <Box component="form" onSubmit={handleSubmit}>
                                {tabValue === 1 && (
                                    <TextField
                                        label="Name"
                                        fullWidth
                                        margin="normal"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        autoComplete="name"
                                    />
                                )}

                                <TextField
                                    label="Email"
                                    type="email"
                                    fullWidth
                                    margin="normal"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                />

                                <TextField
                                    label="Password"
                                    type="password"
                                    fullWidth
                                    margin="normal"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete={
                                        tabValue === 0 ? "current-password" : "new-password"
                                    }
                                    helperText={
                                        tabValue === 1
                                            ? "Password must be at least 6 characters"
                                            : ""
                                    }
                                />

                                <Button
                                    type="submit"
                                    variant="contained"
                                    fullWidth
                                    size="large"
                                    disabled={loading}
                                    sx={{ mt: 3, py: 1.5, borderRadius: 2 }}
                                >
                                    {loading ? (
                                        <CircularProgress size={24} color="inherit" />
                                    ) : tabValue === 0 ? (
                                        "Sign In"
                                    ) : (
                                        "Create Account"
                                    )}
                                </Button>
                            </Box>

                            {/* Footer text */}
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ textAlign: "center", mt: 3 }}
                            >
                                {tabValue === 0 ? (
                                    <>
                                        Don't have an account?{" "}
                                        <Box
                                            component="span"
                                            onClick={() => setTabValue(1)}
                                            sx={{
                                                color: "primary.main",
                                                cursor: "pointer",
                                                fontWeight: 600,
                                                "&:hover": { textDecoration: "underline" },
                                            }}
                                        >
                                            Sign Up
                                        </Box>
                                    </>
                                ) : (
                                    <>
                                        Already have an account?{" "}
                                        <Box
                                            component="span"
                                            onClick={() => setTabValue(0)}
                                            sx={{
                                                color: "primary.main",
                                                cursor: "pointer",
                                                fontWeight: 600,
                                                "&:hover": { textDecoration: "underline" },
                                            }}
                                        >
                                            Sign In
                                        </Box>
                                    </>
                                )}
                            </Typography>
                        </CardContent>
                    </Card>
                </Container>
            </Box>
        </ThemeProvider>
    );
}

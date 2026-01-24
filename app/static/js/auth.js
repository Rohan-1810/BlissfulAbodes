document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                let data;
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    data = await res.json();
                } else {
                    const text = await res.text();
                    console.error("Server Error Response:", text);
                    throw new Error("Server Error (Check terminal logs)");
                }
                
                if (res.ok) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('role', data.user.role);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    
                    showAlert('Login successful!', 'success');
                    
                    setTimeout(() => {
                        if (data.user.role === 'admin') window.location.href = '/admin/dashboard';
                        else if (data.user.role === 'staff') window.location.href = '/staff/dashboard';
                        else window.location.href = '/guest/dashboard';
                    }, 1000);
                } else {
                    showAlert(data.error || 'Login failed', 'error');
                }
            } catch (err) {
                console.error(err);
                showAlert(err.message || 'Network error', 'error');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });
                
                let data;
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    data = await res.json();
                } else {
                    // If not JSON, it's likely a server error page (HTML)
                    const text = await res.text();
                    console.error("Server Error Response:", text);
                    throw new Error("Server Error (Check terminal logs)");
                }

                if (res.ok) {
                    showAlert('Registration successful! Please login.', 'success');
                    setTimeout(() => window.location.href = '/login', 1500);
                } else {
                    showAlert(data.error || 'Registration failed', 'error');
                }
            } catch (err) {
                console.error(err);
                showAlert(err.message || 'Network error', 'error');
            }
        });
    }
});

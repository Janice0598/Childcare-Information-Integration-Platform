// auth.js
const API_BASE = 'http://localhost:3000/api';

document.getElementById('loginForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const selectedRole = document.getElementById('role').value;
    const inputEmail = document.getElementById('email').value;
    const inputPassword = document.getElementById('password').value;

    let apiUrl = '';
    let targetPage = '';

    if (selectedRole === 'parent') {
        apiUrl = `${API_BASE}/parent/login`;
        targetPage = 'user.html';
    } else if (selectedRole === 'admin') {
        apiUrl = `${API_BASE}/admin/login`;
        targetPage = 'admin.html';
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: inputEmail, password: inputPassword })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            alert('登入失敗：' + (result.error || '帳號或密碼錯誤'));
            return;
        }

        // 登入成功，儲存資訊
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('loggedInUserName', result.data.name);
        localStorage.setItem('userRole', selectedRole);

        if (selectedRole === 'parent') {
            localStorage.setItem('loggedInUserId', result.data.parent_id);
        } else {
            localStorage.setItem('loggedInUserId', result.data.centeraccount_id);
        }

        alert(`登入成功！即將跳轉至${selectedRole === 'parent' ? '會員中心' : '管理員後台'}...`);
        window.location.href = targetPage;

    } catch (err) {
        console.error('系統發生錯誤:', err);
        alert('無法連線到伺服器，請確認後端伺服器是否開啟。');
    }
});

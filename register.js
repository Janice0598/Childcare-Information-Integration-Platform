// register.js
const API_BASE = 'http://localhost:3000/api';

document.getElementById('registerForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const inputName = document.getElementById('name').value.trim();
    const inputPhone = document.getElementById('phone').value.trim();
    const inputEmail = document.getElementById('email').value.trim();
    const inputPassword = document.getElementById('password').value;
    const inputConfirm = document.getElementById('confirmPassword').value;

    if (inputPassword !== inputConfirm) {
        alert('兩次輸入的密碼不一致，請重新確認！');
        return;
    }

    if (inputPassword.length < 6) {
        alert('密碼長度至少需要 6 個字元！');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/parent/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: inputName,
                phone: inputPhone,
                email: inputEmail,
                password: inputPassword
            })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            alert('註冊失敗：' + (result.error || '請檢查資料格式是否正確'));
            return;
        }

        alert('✅ 註冊成功！系統將跳轉至登入頁面，請使用新帳號登入。');
        window.location.href = 'login.html';

    } catch (err) {
        console.error('系統發生錯誤:', err);
        alert('無法連線到伺服器，請確認後端伺服器是否開啟。');
    }
});

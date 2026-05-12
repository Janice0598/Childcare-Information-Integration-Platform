// 1. 初始化 Supabase (使用我們確認過沒問題的 JWT 金鑰)
const SUPABASE_URL = 'https://rfzavcliggzlpkqqcrzr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmemF2Y2xpZ2d6bHBrcXFjcnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNzY1NjUsImV4cCI6MjA5MjY1MjU2NX0.PAPu8svIFjvDXUfY91yXGIRmktBCKExsOnqxlYW0z_I'; 
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. 監聽註冊表單
document.getElementById('registerForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // 防止表單重整網頁

    // 取得使用者輸入的資料
    const inputName = document.getElementById('name').value;
    const inputPhone = document.getElementById('phone').value;
    const inputEmail = document.getElementById('email').value;
    const inputPassword = document.getElementById('password').value;
    const inputConfirm = document.getElementById('confirmPassword').value;

    // 簡單的資料驗證：確認兩次密碼輸入是否一致
    if (inputPassword !== inputConfirm) {
        alert('兩次輸入的密碼不一致，請重新確認！');
        return;
    }

    try {
        console.log('準備建立新帳號...');

        // 3. 向 Supabase 的 parent 資料表執行 INSERT 新增資料
        const { data, error } = await supabaseClient
            .from('parent')
            .insert([
                { 
                    name: inputName, 
                    phone: inputPhone, 
                    email: inputEmail, 
                    password: inputPassword 
                    // parent_id 跟 created_at 會由 Supabase 自動產生
                }
            ]);

        // 4. 判斷是否發生錯誤 (例如信箱重複)
        if (error) {
            console.error('註冊失敗:', error);
            // 檢查是否是資料庫回傳 Unique 限制錯誤 (代表信箱已存在)
            if (error.code === '23505') { 
                alert('這個電子郵件已經註冊過了，請直接登入！');
            } else {
                alert('註冊失敗，請檢查資料格式是否正確。');
            }
            return;
        }

        // 5. 註冊成功！
        alert('註冊成功！系統將跳轉至登入頁面，請使用新帳號登入。');
        window.location.href = 'login.html'; // 註冊完跳回登入頁面

    } catch (err) {
        console.error('系統發生錯誤:', err);
        alert('無法連線到資料庫，請稍後再試。');
    }
});
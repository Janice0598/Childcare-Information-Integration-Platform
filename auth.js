// auth.js

// 1. 初始化 Supabase 
// (注意：變數名稱我改成了 supabaseClient，這樣才不會跟官方套件衝突而導致白畫面)
const SUPABASE_URL = 'https://rfzavcliggzlpkqqcrzr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_48pF8e_sZQP5MQXKkeeTOQ_pfESdvZV'; 
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. 監聽登入表單
document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // 防止表單送出時重整網頁

    // 取得使用者選擇的身分與輸入的帳號密碼
    const selectedRole = document.getElementById('role').value; // 'parent' 或是 'admin'
    const inputEmail = document.getElementById('email').value;
    const inputPassword = document.getElementById('password').value;

    // 根據身分，決定要查詢的「資料表名稱」與「跳轉目標網頁」
    let tableName = '';
    let targetPage = '';

    if (selectedRole === 'parent') {
        tableName = 'parent';
        targetPage = 'user.html';  // 家長跳轉至家長後台
    } else if (selectedRole === 'admin') {
        tableName = 'administrator'; // 管理員資料表
        targetPage = 'admin.html';   // 管理員跳轉至管理員後台
    }

    try {
        console.log(`正在驗證 ${selectedRole === 'parent' ? '家長' : '管理員'} 帳號密碼...`);

        // 3. 向指定的資料表發送查詢比對帳密 (使用 supabaseClient)
        const { data, error } = await supabaseClient
            .from(tableName)
            .select('*')
            .eq('email', inputEmail)
            .eq('password', inputPassword)
            .single(); // 預期只會找到一筆完全符合的資料

        // 4. 判斷登入結果
        if (error || !data) {
            console.error('找不到該用戶或密碼錯誤:', error);
            alert('登入失敗：帳號或密碼錯誤！請重新確認。');
            return;
        }

        // 5. 登入成功處理
        console.log('登入成功！歡迎：', data.name);
        alert(`登入成功！即將跳轉至${selectedRole === 'parent' ? '會員中心' : '管理員後台'}...`);
        
        // 將使用者的重要資訊存入瀏覽器的 LocalStorage 中
        // 家長表主鍵是 parent_id，管理員表可能是 admin_id 或 id，這邊寫個判斷
        const userId = selectedRole === 'parent' ? data.parent_id : (data.admin_id || data.id); 
        
        localStorage.setItem('loggedInUserId', userId);
        localStorage.setItem('loggedInUserName', data.name);
        localStorage.setItem('userRole', selectedRole); // 記錄當前身分

        // 6. 執行畫面跳轉
        window.location.href = targetPage;

    } catch (err) {
        // 捕捉網路連線異常或其他非預期錯誤
        console.error('系統發生錯誤:', err);
        alert('無法連線到資料庫，請檢查網路狀態或系統設定。');
    }
});
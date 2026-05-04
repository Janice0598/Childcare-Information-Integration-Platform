// user.js
const SUPABASE_URL = 'https://rfzavcliggzlpkqqcrzr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmemF2Y2xpZ2d6bHBrcXFjcnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNzY1NjUsImV4cCI6MjA5MjY1MjU2NX0.PAPu8svIFjvDXUfY91yXGIRmktBCKExsOnqxlYW0z_I'; 
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function loadUserData() {
    // 1. 從 LocalStorage 拿出剛才登入的 ID
    const userId = localStorage.getItem('loggedInUserId');
    
    // 如果沒有 ID，代表他沒登入就偷跑進來，把他踢回登入頁面
    if (!userId) {
        alert('請先登入！');
        window.location.href = 'login.html';
        return;
    }

    try {
        // 2. 去 parent 表格抓取這個家長的詳細資料
        // 注意：這裡假設你的主鍵是 parent_id，如果你的欄位叫 id，請把 eq('parent_id') 改成 eq('id')
        const { data: parentData, error } = await supabaseClient
            .from('parent')
            .select('*')
            .eq('parent_id', userId)
            .single();

        if (error) throw error;

        // 3. 把資料顯示在畫面上！
        document.getElementById('user-name-display').innerText = `${parentData.name} 家長`;
        document.getElementById('user-email-display').innerText = parentData.email;

        // (進階) 如果你未來有 favorite_item 收藏表，可以像這樣抓數量：
        // const { count } = await supabaseClient.from('favorite_item').select('*', { count: 'exact' }).eq('parent_id', userId);
        // document.querySelector('.summary-number').innerText = count;

    } catch (error) {
        console.error('讀取資料失敗：', error);
    }
}

// 網頁一載入就執行這個函數
loadUserData();
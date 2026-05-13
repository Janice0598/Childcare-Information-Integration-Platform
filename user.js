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

        // 4. 去 favorite_item 資料表撈出這個家長的「收藏總數」
        const { count, error: countError } = await supabaseClient
            .from('favorite_item')
            .select('*', { count: 'exact', head: true }) 
            .eq('parent_id', userId);

        if (countError) {
            console.error('抓取收藏數量失敗：', countError);
        } else {
            // 把抓到的數字放到畫面上！
            document.getElementById('fav-count-display').innerText = count || 0;
        }

        // 5. 去 reviews 資料表撈出這個家長的「發布評鑑總數」
        const { count: reviewCount, error: reviewError } = await supabaseClient
            .from('reviews')
            .select('*', { count: 'exact', head: true }) 
            .eq('parent_id', userId);

        if (reviewError) {
            console.error('抓取評鑑數量失敗：', reviewError);
        } else {
            // 把抓到的數字放到剛剛設定的 id 畫面上！
            document.getElementById('review-count-display').innerText = reviewCount || 0;
        }
    } catch (error) {
        console.error('讀取資料失敗：', error);
    }
}

// 網頁一載入就執行這個函數
loadUserData();
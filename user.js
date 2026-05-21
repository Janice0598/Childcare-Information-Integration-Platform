// user.js
const SUPABASE_URL = 'https://rfzavcliggzlpkqqcrzr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmemF2Y2xpZ2d6bHBrcXFjcnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNzY1NjUsImV4cCI6MjA5MjY1MjU2NX0.PAPu8svIFjvDXUfY91yXGIRmktBCKExsOnqxlYW0z_I';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

async function loadUserData() {
    const userId = localStorage.getItem('loggedInUserId');
    const userRole = localStorage.getItem('userRole');

    if (!userId || userRole !== 'parent') {
        alert('請先登入家長帳號！');
        window.location.href = 'login.html';
        return;
    }

    const userName = localStorage.getItem('loggedInUserName');
    const navName = document.getElementById('nav-user-name');
    if (navName) navName.innerText = `👋 你好，${userName || '家長'}`;

    try {
        // 家長基本資料
        const { data: parentData, error } = await supabaseClient
            .from('parent')
            .select('name, email')
            .eq('parent_id', userId)
            .single();

        if (error) throw error;

        document.getElementById('user-name-display').innerText = `${parentData.name} 家長`;
        document.getElementById('user-email-display').innerText = parentData.email;

        // 收藏數量
        const { count: favCount } = await supabaseClient
            .from('favorite_item')
            .select('*', { count: 'exact', head: true })
            .eq('parent_id', userId);
        document.getElementById('fav-count-display').innerText = favCount || 0;

        // 評鑑數量
        const { count: reviewCount } = await supabaseClient
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('parent_id', userId);
        document.getElementById('review-count-display').innerText = reviewCount || 0;

    } catch (err) {
        console.error('讀取資料失敗：', err);
    }
}

loadUserData();

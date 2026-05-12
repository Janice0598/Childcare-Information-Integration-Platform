// admin.js
const SUPABASE_URL = 'https://rfzavcliggzlpkqqcrzr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmemF2Y2xpZ2d6bHBrcXFjcnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNzY1NjUsImV4cCI6MjA5MjY1MjU2NX0.PAPu8svIFjvDXUfY91yXGIRmktBCKExsOnqxlYW0z_I'; 
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function loadAdminData() {
    const adminId = localStorage.getItem('loggedInUserId');
    
    if (!adminId) {
        alert('請先登入管理員帳號！');
        window.location.href = 'login.html';
        return;
    }

    try {
        // 1. 抓取管理員的基本資料 (從 administrator 表)
        // 假設主鍵是 admin_id
        const { data: adminData, error: adminError } = await supabaseClient
            .from('administrator')
            .select('*')
            .eq('admin_id', adminId)
            .single();

        if (adminError) throw adminError;

        // 更新右上角的管理員名稱
        document.getElementById('admin-name-display').innerText = `👤 ${adminData.name} 您好`;

        // 2. 抓取他管理的托育中心名稱 (這裡做一個示範)
        // 假設 administrator 表裡面有一個欄位叫 center_id，我們拿這個 ID 去 childcare_center 表查名字
        if (adminData.center_id) {
            const { data: centerData, error: centerError } = await supabaseClient
                .from('childcare_center')
                .select('name')
                .eq('center_id', adminData.center_id)
                .single();

            if (!centerError && centerData) {
                document.getElementById('admin-center-display').innerHTML = `目前管理機構：<strong>${centerData.name}</strong>`;
            }
        } else {
            // 如果管理員還沒綁定中心
            document.getElementById('admin-center-display').innerHTML = `目前管理機構：<strong>尚未綁定機構</strong>`;
        }

    } catch (error) {
        console.error('讀取管理員資料失敗：', error);
    }
}

// 網頁一載入就執行這個函數
loadAdminData();
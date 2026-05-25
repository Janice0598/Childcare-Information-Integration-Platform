// admin.js
const SUPABASE_URL = 'https://rfzavcliggzlpkqqcrzr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmemF2Y2xpZ2d6bHBrcXFjcnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNzY1NjUsImV4cCI6MjA5MjY1MjU2NX0.PAPu8svIFjvDXUfY91yXGIRmktBCKExsOnqxlYW0z_I';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function loadAdminData() {
    const adminId = sessionStorage.getItem('loggedInUserId');

    if (!adminId) {
        alert('請先登入管理員帳號！');
        window.location.href = 'login.html';
        return;
    }

    try {
        const { data: adminData, error: adminError } = await supabaseClient
            .from('administrator')
            .select('*')
            .eq('admin_id', adminId)
            .single();

        if (adminError) throw adminError;

        document.getElementById('admin-name-display').innerText = `👤 ${adminData.name} 您好`;

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
            document.getElementById('admin-center-display').innerHTML = `目前管理機構：<strong>尚未綁定機構</strong>`;
        }

    } catch (error) {
        console.error('讀取管理員資料失敗：', error);
    }
}

loadAdminData();

// search.js

const SUPABASE_URL = 'https://rfzavcliggzlpkqqcrzr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmemF2Y2xpZ2d6bHBrcXFjcnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNzY1NjUsImV4cCI6MjA5MjY1MjU2NX0.PAPu8svIFjvDXUfY91yXGIRmktBCKExsOnqxlYW0z_I';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 套用篩選條件
document.getElementById('applyFilterBtn').addEventListener('click', async function () {

    const category  = document.getElementById('filter-category').value;
    const operation = document.getElementById('filter-operation').value;
    const district  = document.getElementById('filter-district').value;
    const ratio     = document.getElementById('filter-ratio').value;
    const openTime  = document.getElementById('filter-open-time').value;
    const closeTime = document.getElementById('filter-close-time').value;
    const capacity  = document.getElementById('filter-capacity').value;

    try {
        let query = supabaseClient.from('childcare_center').select('*');

        if (category  !== '不限') query = query.eq('category', category);
        if (operation !== '不限') query = query.eq('operation_type', operation);
        if (district  !== '不限') query = query.eq('district', district);

        // 師生比：資料庫是 double precision，例如 3.0 代表 1:3
        if (ratio !== '不限') {
            const ratioNum = parseFloat(ratio.replace('1:', ''));
            query = query.eq('teacher_student_ratio', ratioNum);
        }

        // 收托容量
        if (capacity !== '不限') {
            const [min, max] = capacity.split('-');
            query = query.gte('total_capacity', parseInt(min)).lte('total_capacity', parseInt(max));
        }

        // 營業時間：直接用資料庫的 open_time / close_time 欄位篩選
        if (openTime !== '不限') {
            query = query.lte('open_time', openTime + ':00');
        }
        if (closeTime !== '不限') {
            query = query.gte('close_time', closeTime + ':00');
        }

        const { data: centers, error } = await query;
        if (error) throw error;

        renderCenterCards(centers);

    } catch (err) {
        console.error('搜尋錯誤:', err);
        alert('搜尋發生錯誤，請檢查資料庫連線！');
    }
});

// 清除條件
document.getElementById('resetFilterBtn').addEventListener('click', function () {
    document.getElementById('filter-category').value   = '不限';
    document.getElementById('filter-operation').value  = '不限';
    document.getElementById('filter-district').value   = '不限';
    document.getElementById('filter-ratio').value      = '不限';
    document.getElementById('filter-open-time').value  = '不限';
    document.getElementById('filter-close-time').value = '不限';
    document.getElementById('filter-capacity').value   = '不限';
    document.getElementById('applyFilterBtn').click();
});

// 渲染卡片
function renderCenterCards(centers) {
    const resultsList = document.getElementById('results-list');
    const resultCount = document.getElementById('result-count');

    resultCount.innerText = centers.length;
    resultsList.innerHTML = '';

    if (centers.length === 0) {
        resultsList.innerHTML = `
            <div class="empty-state">
                找不到符合條件的機構，請嘗試放寬篩選條件！
            </div>`;
        return;
    }

    centers.forEach(center => {
        const openTime  = center.open_time  ? center.open_time.slice(0, 5)  : '-';
        const closeTime = center.close_time ? center.close_time.slice(0, 5) : '-';
        const hours     = (openTime !== '-' && closeTime !== '-') ? `${openTime} - ${closeTime}` : '未提供';
        const address   = [center.city, center.district, center.streetline].filter(Boolean).join(' ') || '未提供';

        const cardHTML = `
            <div class="result-card">
                <div class="card-image">機構圖片</div>
                <div class="card-content">
                    <div class="card-header">
                        <h3 class="center-name">${center.name || '機構名稱未提供'}</h3>
                        <span class="badge">${center.operation_type || ''} ${center.category || ''}</span>
                    </div>
                    <p class="text-line highlight">📍 ${address}</p>
                    <p class="text-line">🕐 營業時間：${hours}</p>
                    <p class="text-line">👩‍🏫 師生比：1:${center.teacher_student_ratio || '未提供'} ｜ 總容量：${center.total_capacity || 0} 人</p>
                    <div class="card-actions">
                        <a href="center-detail.html?id=${center.center_id}" 
                           class="wireframe-btn" 
                           style="text-decoration:none;">查看詳情</a>
                        <button class="wireframe-btn primary" 
                                onclick="addToFavorite(${center.center_id})">❤️ 加入收藏</button>
                    </div>
                </div>
            </div>`;
        resultsList.innerHTML += cardHTML;
    });
}

// 從搜尋頁直接收藏
async function addToFavorite(centerId) {
    const userId = localStorage.getItem('loggedInUserId');
    if (!userId) {
        alert('請先登入才能收藏！');
        window.location.href = 'login.html';
        return;
    }
    try {
        const { error } = await supabaseClient
            .from('favorite_item')
            .insert([{ parent_id: parseInt(userId), center_id: centerId }]);
        if (error) {
            if (error.code === '23505') {
                alert('這間機構已在您的收藏清單中！');
            } else {
                throw error;
            }
        } else {
            alert('✅ 已加入收藏！');
        }
    } catch (err) {
        console.error(err);
        alert('收藏失敗，請稍後再試。');
    }
}

// 頁面載入時自動搜尋一次
window.onload = function () {
    document.getElementById('applyFilterBtn').click();
};

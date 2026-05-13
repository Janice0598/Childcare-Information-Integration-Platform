// 初始化 Supabase
const SUPABASE_URL = 'https://rfzavcliggzlpkqqcrzr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmemF2Y2xpZ2d6bHBrcXFjcnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNzY1NjUsImV4cCI6MjA5MjY1MjU2NX0.PAPu8svIFjvDXUfY91yXGIRmktBCKExsOnqxlYW0z_I';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const API_BASE = 'http://localhost:3000/api';

async function loadFavorites() {
    // 1. 檢查使用者是否登入
    const userId = localStorage.getItem('loggedInUserId');
    const userName = localStorage.getItem('loggedInUserName');

    if (!userId) {
        alert('請先登入才能查看收藏！');
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('user-name-display').innerText = userName || '家長';

    try {
        // 2. 從 Supabase 抓取這個家長的收藏紀錄
        const { data: favorites, error } = await supabaseClient
            .from('favorite_item')
            .select('center_id')
            .eq('parent_id', userId);

        if (error) throw error;

        const listContainer = document.getElementById('favorite-list');

        if (!favorites || favorites.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    您目前還沒有收藏任何機構喔！快去搜尋看看吧！<br><br>
                    <a href="search.html" class="wireframe-btn primary" style="text-decoration:none;">前往搜尋機構</a>
                </div>`;
            return;
        }

        // 3. 有收藏紀錄的話，去後端 API 抓取這些機構的詳細資料
        listContainer.innerHTML = ''; // 清空載入中訊息

        for (let item of favorites) {
            const centerId = item.center_id;

            // 呼叫你的後端取得單一機構資料
            const response = await fetch(`${API_BASE}/childcare-centers/${centerId}`);
            if (response.ok) {
                const center = await response.json();
                renderFavoriteCard(center);
            }
        }

    } catch (err) {
        console.error('載入收藏失敗：', err);
        document.getElementById('favorite-list').innerHTML = '<div class="empty-state">載入失敗，請確認伺服器是否開啟。</div>';
    }
}

// 渲染單一張收藏卡片 (沿用搜尋頁面的美觀設計)
function renderFavoriteCard(center) {
    const listContainer = document.getElementById('favorite-list');
    const address = [center.city, center.district, center.streetline].filter(Boolean).join(' ') || '未提供';

    const cardHTML = `
        <div class="result-card" id="fav-card-${center.center_id}">
            <div class="card-image">機構圖片</div>
            <div class="card-content">
                <div class="card-header">
                    <h3 class="center-name">${center.name || '機構名稱未提供'}</h3>
                    <span class="badge">${center.operation_type || ''} ${center.category || ''}</span>
                </div>
                <p class="text-line highlight">📍 ${address}</p>
                <p class="text-line">👩‍🏫 師生比：1:${center.teacher_student_ratio || '未提供'} ｜ 總容量：${center.total_capacity || 0} 人</p>
               <div style="display: flex; justify-content: flex-end; gap: 10px; align-items: center;">
                <a href="center-detail.html?id=${center.center_id}" class="wireframe-btn" style="text-decoration:none; font-size: 15px; font-weight: bold; padding: 8px 16px; display: inline-flex; align-items: center; justify-content: center;">
                    查看詳情
                </a>
                <button class="wireframe-btn" style="font-size: 15px; font-weight: bold; padding: 8px 16px; background-color: #ef4444; color: white; border: 1px solid #ef4444; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;" onclick="removeFavorite(${center.center_id})">
                    🗑️ 移除收藏
                </button>
            </div>
            </div>
        </div>`;

    listContainer.innerHTML += cardHTML;
}

// 實作移除收藏功能
async function removeFavorite(centerId) {
    const userId = localStorage.getItem('loggedInUserId');
    if (confirm('確定要將這間機構從收藏中移除嗎？')) {
        try {
            const { error } = await supabaseClient
                .from('favorite_item')
                .delete()
                .eq('parent_id', userId)
                .eq('center_id', centerId);

            if (error) throw error;

            // 成功後直接從畫面上把這張卡片隱藏，不用重新整理網頁
            document.getElementById(`fav-card-${centerId}`).style.display = 'none';
            alert('已成功移除收藏！');

        } catch (err) {
            console.error('移除失敗:', err);
            alert('移除失敗，請稍後再試。');
        }
    }
}

// 登出功能
function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

// 網頁載入時啟動
loadFavorites();

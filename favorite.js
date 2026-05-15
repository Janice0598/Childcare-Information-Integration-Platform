// favorite.js
const SUPABASE_URL = 'https://rfzavcliggzlpkqqcrzr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmemF2Y2xpZ2d6bHBrcXFjcnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNzY1NjUsImV4cCI6MjA5MjY1MjU2NX0.PAPu8svIFjvDXUfY91yXGIRmktBCKExsOnqxlYW0z_I';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const API_BASE = 'http://localhost:3000/api';

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

async function loadFavorites() {
    const userId = localStorage.getItem('loggedInUserId');
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('loggedInUserName');

    if (!userId || userRole !== 'parent') {
        alert('請先登入家長帳號才能查看收藏！');
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('user-name-display').innerText = userName || '家長';

    try {
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

        listContainer.innerHTML = '';

        for (let item of favorites) {
            const response = await fetch(`${API_BASE}/childcare-centers/${item.center_id}`);
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

function renderFavoriteCard(center) {
    const listContainer = document.getElementById('favorite-list');
    const address = [center.city, center.district, center.streetline].filter(Boolean).join(' ') || '未提供';

    listContainer.innerHTML += `
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
                    <a href="center-detail.html?id=${center.center_id}" class="wireframe-btn" style="text-decoration:none;">查看詳情</a>
                    <button class="wireframe-btn" style="background-color: #ef4444; color: white; border: 1px solid #ef4444; cursor: pointer;" onclick="removeFavorite(${center.center_id})">🗑️ 移除收藏</button>
                </div>
            </div>
        </div>`;
}

async function removeFavorite(centerId) {
    const userId = localStorage.getItem('loggedInUserId');
    if (!confirm('確定要將這間機構從收藏中移除嗎？')) return;
    try {
        const { error } = await supabaseClient
            .from('favorite_item')
            .delete()
            .eq('parent_id', userId)
            .eq('center_id', centerId);
        if (error) throw error;
        document.getElementById(`fav-card-${centerId}`).style.display = 'none';
        alert('已成功移除收藏！');
    } catch (err) {
        console.error('移除失敗:', err);
        alert('移除失敗，請稍後再試。');
    }
}

loadFavorites();

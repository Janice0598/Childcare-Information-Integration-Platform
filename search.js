// search.js

const API_BASE = 'http://localhost:3000/api';

// 套用篩選條件
document.getElementById('applyFilterBtn').addEventListener('click', async function () {

    const category = document.getElementById('filter-category').value;
    const operation = document.getElementById('filter-operation').value;
    const district = document.getElementById('filter-district').value;
    const ratio = document.getElementById('filter-ratio').value;
    const openTime = document.getElementById('filter-open-time').value;
    const closeTime = document.getElementById('filter-close-time').value;
    const capacity = document.getElementById('filter-capacity').value;

    try {
        // 建立 query string，只把「有選擇」的條件加進去
        const params = new URLSearchParams();
        if (category !== '不限') params.append('category', category);
        if (operation !== '不限') params.append('type', operation);
        if (district !== '不限') params.append('district', district);
        if (ratio !== '不限') params.append('ratio', ratio);
        if (capacity !== '不限') params.append('range', capacity);
        if (openTime !== '不限') params.append('open_time', openTime);
        if (closeTime !== '不限') params.append('close_time', closeTime);

        // 決定要打哪支 API
        let url;
        if (params.toString() === '') {
            // 沒有任何篩選條件，就抓全部
            url = `${API_BASE}/childcare-centers`;
        } else if (openTime !== '不限' && closeTime !== '不限') {
            // 有時間篩選，用時間 API
            url = `${API_BASE}/childcare-centers/search/time?${params}`;
        } else if (category !== '不限') {
            url = `${API_BASE}/childcare-centers/search/category?${params}`;
        } else if (operation !== '不限') {
            url = `${API_BASE}/childcare-centers/search/operation-type?${params}`;
        } else if (district !== '不限') {
            url = `${API_BASE}/childcare-centers/search/district?${params}`;
        } else if (ratio !== '不限') {
            url = `${API_BASE}/childcare-centers/search/ratio?${params}`;
        } else if (capacity !== '不限') {
            url = `${API_BASE}/childcare-centers/search/capacity?${params}`;
        } else {
            url = `${API_BASE}/childcare-centers`;
        }

        const response = await fetch(url);
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || '搜尋失敗');
        }

        const centers = await response.json();
        renderCenterCards(centers);

    } catch (err) {
        console.error('搜尋錯誤:', err);
        alert('搜尋發生錯誤：' + err.message);
    }
});

// 清除條件
document.getElementById('resetFilterBtn').addEventListener('click', function () {
    document.getElementById('filter-category').value = '不限';
    document.getElementById('filter-operation').value = '不限';
    document.getElementById('filter-district').value = '不限';
    document.getElementById('filter-ratio').value = '不限';
    document.getElementById('filter-open-time').value = '不限';
    document.getElementById('filter-close-time').value = '不限';
    document.getElementById('filter-capacity').value = '不限';
    document.getElementById('applyFilterBtn').click();
});

// 渲染卡片（這部分不變）
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
        const openTime = center.open_time ? center.open_time.slice(0, 5) : '-';
        const closeTime = center.close_time ? center.close_time.slice(0, 5) : '-';
        const hours = (openTime !== '-' && closeTime !== '-') ? `${openTime} - ${closeTime}` : '未提供';
        const address = [center.city, center.district, center.streetline].filter(Boolean).join(' ') || '未提供';

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
                    
                    <div class="card-actions" style="display: flex; gap: 10px; justify-content: flex-end; align-items: center; margin-top: 15px;">
                        
                        <a href="center-detail.html?id=${center.center_id}" 
                           class="wireframe-btn" 
                           style="text-decoration:none; font-size: 15px; font-weight: bold; padding: 0 16px; height: 42px; box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center;">查看詳情</a>
                        
                        <button class="wireframe-btn primary" 
                                style="font-size: 15px; font-weight: bold; padding: 0 16px; height: 42px; box-sizing: border-box; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;"
                                onclick="addToFavorite(${center.center_id})">❤️ 加入收藏</button>
                    </div>
                </div>
            </div>`;
        resultsList.innerHTML += cardHTML;
    });
}

// 收藏功能（暫時保留 Supabase，之後再換）
const SUPABASE_URL = 'https://rfzavcliggzlpkqqcrzr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmemF2Y2xpZ2d6bHBrcXFjcnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNzY1NjUsImV4cCI6MjA5MjY1MjU2NX0.PAPu8svIFjvDXUfY91yXGIRmktBCKExsOnqxlYW0z_I';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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
// 實作關鍵字搜尋功能
function searchByKeyword() {
    const keyword = document.getElementById('keyword-search').value.trim();
    const allCards = document.querySelectorAll('.result-card');
    
    // 1. 準備一個計數器，從 0 開始算
    let visibleCount = 0; 

    allCards.forEach(card => {
        const centerName = card.querySelector('.center-name').innerText;

        if (centerName.includes(keyword) || keyword === "") {
            card.style.display = ''; 
            // 2. 如果這張卡片符合條件（顯示出來），計數器就 +1
            visibleCount++; 
        } else {
            card.style.display = 'none'; 
        }
    });

    // 3. 把算完的數字，更新到畫面的 id="result-count" 上面
    const resultCountElement = document.getElementById('result-count');
    if (resultCountElement) {
        resultCountElement.innerText = visibleCount;
    }
}
// 監聽輸入框的按鍵事件：按下 Enter 就執行搜尋
document.getElementById('keyword-search').addEventListener('keypress', function (event) {
    // 檢查按下的鍵是不是 Enter
    if (event.key === 'Enter') {
        searchByKeyword();
    }
});
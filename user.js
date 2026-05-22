// user.js
const SUPABASE_URL = 'https://rfzavcliggzlpkqqcrzr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmemF2Y2xpZ2d6bHBrcXFjcnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNzY1NjUsImV4cCI6MjA5MjY1MjU2NX0.PAPu8svIFjvDXUfY91yXGIRmktBCKExsOnqxlYW0z_I';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

// 顯示快取的使用者資訊
function displayCachedUserInfo() {
    const userName = localStorage.getItem('loggedInUserName');
    const userEmail = localStorage.getItem('loggedInUserEmail');
    const nameDisplay = document.getElementById('user-name-display');
    const emailDisplay = document.getElementById('user-email-display');
    const navName = document.getElementById('nav-user-name');

    if (nameDisplay) nameDisplay.innerText = userName ? `${userName} 家長` : '';
    if (emailDisplay) emailDisplay.innerText = (userEmail && userEmail.trim()) ? userEmail : '';
    if (navName) navName.innerText = userName ? `👋 你好，${userName}` : '👋 你好，家長';
}

// 從後端同步使用者資訊（姓名、Email）
async function syncUserProfile() {
    const userId = localStorage.getItem('loggedInUserId');
    const userRole = localStorage.getItem('userRole');
    if (!userId || userRole !== 'parent') {
        window.location.href = 'login.html';
        return;
    }
    try {
        const { data, error } = await supabaseClient
            .from('parent')
            .select('name, email')
            .eq('parent_id', parseInt(userId))
            .maybeSingle();
        if (!error && data) {
            if (data.name) localStorage.setItem('loggedInUserName', data.name);
            if (data.email) localStorage.setItem('loggedInUserEmail', data.email);
            displayCachedUserInfo();
        }
    } catch (err) {
        console.error('同步使用者資料失敗:', err);
    }
}

// 取得機構的最新評鑑結果
async function getLatestEvaluation(centerId) {
    const { data, error } = await supabaseClient
        .from('evaluation_record')
        .select('evalution_result')
        .eq('center_id', centerId)
        .order('completion_date', { ascending: false })
        .limit(1);
    if (error || !data || data.length === 0) return null;
    return data[0].evalution_result;
}

// 根據偏好推薦機構（穩定版）
async function loadRecommendations() {
    const preferences = localStorage.getItem('parentPreferences');
    let pref = {};
    if (preferences) {
        try {
            pref = JSON.parse(preferences);
        } catch(e) { console.warn(e); }
    }

    const recDiv = document.getElementById('recommend-list');
    recDiv.innerHTML = '<div class="text-line" style="text-align:center;">⏳ 載入推薦中...</div>';

    try {
        // 第一步：查詢機構（不包含評鑑關聯）
        let query = supabaseClient
            .from('childcare_centers')
            .select('center_id, name, district, streetline, phone, open_time, close_time, category');

        if (pref.district && pref.district !== '') {
            query = query.eq('district', pref.district);
        }
        if (pref.category && pref.category !== '') {
            query = query.eq('category', pref.category);
        }
        if (pref.extended && pref.extended !== '') {
            const extendedBool = pref.extended === 'true';
            query = query.eq('extended_care', extendedBool);
        }

        const { data: centers, error } = await query.limit(20);
        if (error) throw error;

        if (!centers || centers.length === 0) {
            recDiv.innerHTML = '<div class="text-line" style="text-align:center;">沒有符合偏好的機構，請至「個人資料設定」調整偏好。</div>';
            return;
        }

        // 第二步：為每個機構取得最新評鑑
        const centersWithEval = [];
        for (let center of centers) {
            const evalResult = await getLatestEvaluation(center.center_id);
            centersWithEval.push({ ...center, eval_result: evalResult });
        }

        // 第三步：過濾評鑑等級（如果有設定）
        let filtered = centersWithEval;
        if (pref.evaluation && pref.evaluation !== '') {
            filtered = centersWithEval.filter(c => c.eval_result === pref.evaluation);
        }

        if (filtered.length === 0) {
            recDiv.innerHTML = '<div class="text-line" style="text-align:center;">沒有符合評鑑等級的機構，試試放寬條件～</div>';
            return;
        }

        // 最多顯示 4 筆
        const displayCenters = filtered.slice(0, 4);
        recDiv.innerHTML = displayCenters.map(center => {
            const address = [center.district, center.streetline].filter(Boolean).join(' ') || '地址未提供';
            const hours = (center.open_time && center.close_time) 
                ? `${center.open_time.slice(0,5)} - ${center.close_time.slice(0,5)}` 
                : '未提供';
            const evalText = center.eval_result || '評鑑中';
            return `
                <div class="rec-card">
                    <h4>🏫 ${center.name || '機構名稱'}</h4>
                    <div class="detail">📍 ${address}</div>
                    <div class="detail">⭐ 評鑑：${evalText}</div>
                    <div class="detail">📞 ${center.phone || '未提供'}</div>
                    <div class="detail">🕒 ${hours}</div>
                    <a href="center-detail.html?id=${center.center_id}" class="btn-small">查看詳情</a>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error('載入推薦失敗:', err);
        recDiv.innerHTML = '<div class="text-line" style="text-align:center;">無法載入推薦，請稍後再試。</div>';
    }
}

// 載入收藏數量與評價數量
async function loadStats() {
    const userId = localStorage.getItem('loggedInUserId');
    if (!userId) return;
    try {
        const { count: favCount } = await supabaseClient
            .from('favorite_item')
            .select('*', { count: 'exact', head: true })
            .eq('parent_id', userId);
        document.getElementById('fav-count-display').innerText = favCount || 0;

        const { count: reviewCount } = await supabaseClient
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('parent_id', userId);
        document.getElementById('review-count-display').innerText = reviewCount || 0;
    } catch (err) {
        console.error('載統計數量失敗:', err);
    }
}

// 頁面初始化
async function init() {
    displayCachedUserInfo();
    await syncUserProfile();
    await loadStats();
    await loadRecommendations();
}

init();
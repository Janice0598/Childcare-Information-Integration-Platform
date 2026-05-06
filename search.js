// search.js

// 1. 初始化 Supabase 
const SUPABASE_URL = 'https://rfzavcliggzlpkqqcrzr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmemF2Y2xpZ2d6bHBrcXFjcnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNzY1NjUsImV4cCI6MjA5MjY1MjU2NX0.PAPu8svIFjvDXUfY91yXGIRmktBCKExsOnqxlYW0z_I'; 
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. 監聽「套用篩選條件」按鈕
document.getElementById('applyFilterBtn').addEventListener('click', async function() {
    
    // 取得畫面上所有篩選器的值
    const category = document.getElementById('filter-category').value;
    const operation = document.getElementById('filter-operation').value;
    const district = document.getElementById('filter-district').value;
    const ratio = document.getElementById('filter-ratio').value;
    const openTime = document.getElementById('filter-open-time').value;
    const closeTime = document.getElementById('filter-close-time').value;
    const capacity = document.getElementById('filter-capacity').value;

    try {
        // 3. 開始組裝 Supabase 的查詢指令 (處理不用切字的條件)
        let query = supabaseClient.from('childcare_center').select('*');

        if (category !== '不限') query = query.eq('category', category);
        if (operation !== '不限') query = query.eq('operation_type', operation);
        if (district !== '不限') query = query.eq('district', district);
        if (ratio !== '不限') query = query.eq('teacher_student_ratio', ratio);

        // 處理收托總容量 (例如 "16-30" 變成 >= 16 且 <= 30)
        if (capacity !== '不限') {
            const [min, max] = capacity.split('-');
            query = query.gte('total_capacity', parseInt(min)).lte('total_capacity', parseInt(max));
        }

        // 4. 正式向資料庫發送請求！
        const { data: centers, error } = await query;

        if (error) throw error;

        // 5. JavaScript 第二層過濾：處理營業時間 (operating_hours)
        let filteredCenters = centers;

        if (openTime !== '不限' || closeTime !== '不限') {
            filteredCenters = centers.filter(center => {
                // 如果這間機構沒有填寫營業時間，就直接過濾掉
                if (!center.operating_hours) return false;

                // 把 "07:00-19:00" 切成 ["07:00", "19:00"]
                const times = center.operating_hours.split('-');
                if (times.length !== 2) return true; // 格式不對就不做時間過濾，直接顯示

                const centerOpen = times[0].trim();  // "07:00"
                const centerClose = times[1].trim(); // "19:00"

                let isValid = true;

                // 檢查開門時間 (機構開門時間必須 <= 家長要求的時間)
                if (openTime !== '不限' && centerOpen > openTime) {
                    isValid = false; 
                }

                // 檢查關門時間 (機構關門時間必須 >= 家長要求的時間)
                if (closeTime !== '不限' && centerClose < closeTime) {
                    isValid = false;
                }

                return isValid;
            });
        }

        // 6. 將最終過濾好的結果交給渲染函數去更新畫面
        renderCenterCards(filteredCenters);

    } catch (err) {
        console.error('系統錯誤:', err);
        alert('搜尋發生錯誤，請檢查資料庫連線或欄位設定！');
    }
});

// 清除條件按鈕的功能
document.getElementById('resetFilterBtn').addEventListener('click', function() {
    document.getElementById('filter-category').value = '不限';
    document.getElementById('filter-operation').value = '不限';
    document.getElementById('filter-district').value = '不限';
    document.getElementById('filter-ratio').value = '不限';
    document.getElementById('filter-open-time').value = '不限';
    document.getElementById('filter-close-time').value = '不限';
    document.getElementById('filter-capacity').value = '不限';
    
    // 清空後自動觸發一次全域搜尋
    document.getElementById('applyFilterBtn').click();
});

// 負責把資料庫撈出來的資料，變成漂亮的 HTML 卡片顯示在畫面上
function renderCenterCards(centers) {
    const resultsList = document.getElementById('results-list');
    const resultCount = document.getElementById('result-count');

    // 更新找到的數量
    resultCount.innerText = centers.length;

    // 清空原本的列表
    resultsList.innerHTML = '';

    // 如果沒找到半間，顯示空狀態
    if (centers.length === 0) {
        resultsList.innerHTML = `
            <div class="empty-state">
                找不到符合條件的機構，請嘗試放寬篩選條件！
            </div>
        `;
        return;
    }

    // 迴圈把每一筆資料轉成卡片 
    centers.forEach(center => {
        const cardHTML = `
            <div class="result-card">
                <div class="card-image">機構圖片</div>
                <div class="card-content">
                    <div class="card-header">
                        <h3 class="center-name">${center.name || '機構名稱未提供'}</h3>
                        <span class="badge">${center.operation_type || '未知屬性'} ${center.category || ''}</span>
                    </div>
                    <p class="text-line highlight">地區：${center.district || '未提供'}</p>
                    <p class="text-line">營業時間：${center.operating_hours || '未提供'}</p>
                    <p class="text-line">師生比：${center.teacher_student_ratio || '未提供'} | 總收托量：${center.total_capacity || 0} 人</p>
                    <div class="card-actions">
                        <button class="wireframe-btn">查看詳情</button>
                        <button class="wireframe-btn primary">❤️ 加入收藏</button>
                    </div>
                </div>
            </div>
        `;
        resultsList.innerHTML += cardHTML;
    });
}

// 網頁一載入時，自動點擊一次「搜尋」按鈕，把所有機構先列出來
window.onload = function() {
    document.getElementById('applyFilterBtn').click();
};
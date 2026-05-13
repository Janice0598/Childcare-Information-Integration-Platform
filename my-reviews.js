// 初始化 Supabase
const SUPABASE_URL = 'https://rfzavcliggzlpkqqcrzr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmemF2Y2xpZ2d6bHBrcXFjcnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNzY1NjUsImV4cCI6MjA5MjY1MjU2NX0.PAPu8svIFjvDXUfY91yXGIRmktBCKExsOnqxlYW0z_I'; 
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function loadMyReviews() {
    const userId = localStorage.getItem('loggedInUserId');
    
    if (!userId) {
        alert('請先登入才能查看評鑑紀錄！');
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('user-name-display').innerText = localStorage.getItem('loggedInUserName') || '家長';

    try {
        // 從資料庫抓取該名家長的所有評價，順便帶出機構名稱
        const { data: reviews, error } = await supabaseClient
            .from('reviews')
            .select('*, childcare_center(name)')
            .eq('parent_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const listContainer = document.getElementById('my-reviews-list');

        if (!reviews || reviews.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state" style="padding: 40px; text-align: center; border: 2px dashed #ccc; background: #fff;">
                    您還沒有發布過任何評價喔！<br><br>
                    <a href="search.html" class="wireframe-btn primary" style="text-decoration:none;">去尋找機構並留下心得</a>
                </div>`;
            return;
        }

        // 渲染家長的個人評價列表
        listContainer.innerHTML = reviews.map(r => {
            const centerName = r.childcare_center ? r.childcare_center.name : '未知機構';
            const date = r.created_at ? r.created_at.slice(0, 10) : '-';

            return `
            <div class="result-card" style="flex-direction: column; padding: 20px; border: 2px solid #ccc; background: #fff;" id="review-card-${r.review_id}">
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 12px; margin-bottom: 12px;">
                    <h3 style="margin: 0; color: #333;">🏫 ${centerName}</h3>
                    <span style="font-size:13px; color:#666;">發布日期：${date}</span>
                </div>
                
                <div class="score-row" style="display: flex; gap: 20px; margin-bottom: 15px; font-size: 14px; background: #f8fafc; padding: 10px; border-radius: 4px;">
                    <span>整體 <strong style="color:#f59e0b;">${r.score_overall ?? '-'}</strong></span>
                    <span>師資 <strong style="color:#f59e0b;">${r.score_staff ?? '-'}</strong></span>
                    <span>環境 <strong style="color:#f59e0b;">${r.score_enviroment ?? '-'}</strong></span>
                    <span>課程 <strong style="color:#f59e0b;">${r.score_curriculum ?? '-'}</strong></span>
                </div>
                
                <p style="color: #444; line-height: 1.6; margin-bottom: 15px;">
                    ${r.comment || '<span style="color:#999; font-style:italic;">（無文字評價）</span>'}
                </p>

                <div style="display: flex; justify-content: flex-end; gap: 10px;">
                    <button class="wireframe-btn" onclick="editReview(${r.review_id})">✏️ 編輯評價</button>
                    <button class="wireframe-btn" style="color: #d9363e; border-color: #d9363e;" onclick="deleteReview(${r.review_id})">🗑️ 刪除評價</button>
                </div>
            </div>
            `;
        }).join('');

    } catch (err) {
        console.error('載入評價失敗:', err);
        document.getElementById('my-reviews-list').innerHTML = '<div class="empty-state">載入失敗，請稍後再試。</div>';
    }
}

// 實作刪除評價 (Delete 功能)
async function deleteReview(reviewId) {
    if (!confirm('確定要刪除這筆評價嗎？刪除後將無法復原喔！')) return;
    
    try {
        const { error } = await supabaseClient
            .from('reviews')
            .delete()
            .eq('review_id', reviewId);

        if (error) throw error;
        
        // 刪除成功後，直接讓這張卡片從畫面上消失
        document.getElementById(`review-card-${reviewId}`).style.display = 'none';
        alert('✅ 已成功刪除評價！');
        
    } catch (err) {
        console.error('刪除失敗:', err);
        alert('刪除失敗，請檢查網路連線。');
    }
}

// 預留編輯評價功能 (Update 功能)
function editReview(reviewId) {
    alert('進入編輯模式！(未來可在此串接修改表單)');
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

// 網頁載入時執行
loadMyReviews();
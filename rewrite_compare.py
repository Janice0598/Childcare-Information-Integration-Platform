import re

with open('compare.html', 'r', encoding='utf-8') as f:
    content = f.read()

new_styles = """      /* ── 頁面結構 ── */
      .compare-container { max-width: 1200px; margin: 40px auto; padding: 0 20px; }
      .compare-title { margin-bottom: 8px; color: var(--text-main); }
      .compare-subtitle { color: var(--text-muted); font-size: 14px; margin-bottom: 30px; }

      /* ── 選擇區塊 ── */
      .selector-grid { display: grid; grid-template-columns: 1fr 60px 1fr; gap: 15px; margin-bottom: 40px; align-items: stretch; }
      .selector-slot { background: #FFFDF8; border: 2px dashed #F5D38A; border-radius: 24px; padding: 24px; min-height: 180px; display: flex; flex-direction: column; box-shadow: 0 4px 15px rgba(255, 209, 102, 0.1); transition: transform 0.3s ease, box-shadow 0.3s ease; }
      .selector-slot:hover { transform: translateY(-4px); box-shadow: 0 10px 25px rgba(255, 209, 102, 0.2); }
      .selector-slot h3 { margin-bottom: 16px; font-size: 16px; color: var(--text-main); font-weight: 700; text-transform: uppercase; letter-spacing: 1px; text-align: center; }
      .vs-divider { display: flex; align-items: center; justify-content: center; background: var(--primary-color); color: var(--text-main); font-size: 18px; font-weight: bold; height: 60px; width: 60px; border-radius: 50%; box-shadow: 0 4px 12px rgba(255, 209, 102, 0.4); align-self: center; z-index: 1; }

      /* 搜尋輸入 */
      .slot-search { display: flex; gap: 8px; margin-bottom: 12px; }
      .slot-search input { flex: 1; padding: 10px 14px; border: 2px solid var(--border-light); border-radius: 12px; font-size: 14px; outline: none; transition: border-color 0.3s; }
      .slot-search input:focus { border-color: var(--primary-color); }
      .slot-search button { padding: 10px 16px; border: none; background: var(--primary-color); color: var(--text-main); border-radius: 12px; cursor: pointer; font-weight: bold; font-size: 14px; white-space: nowrap; transition: all 0.2s; box-shadow: 0 2px 6px rgba(255, 209, 102, 0.3); }
      .slot-search button:hover { background: var(--primary-hover); transform: translateY(-1px); box-shadow: 0 4px 10px rgba(255, 209, 102, 0.4); }

      /* 搜尋下拉結果 */
      .slot-dropdown { position: relative; }
      .slot-results { position: absolute; top: 0; left: 0; right: 0; background: var(--surface-color); border: 1px solid var(--border-light); border-radius: 12px; box-shadow: 0 8px 20px rgba(0,0,0,0.1); max-height: 200px; overflow-y: auto; z-index: 100; display: none; }
      .slot-results.open { display: block; }
      .slot-result-item { padding: 12px 16px; cursor: pointer; font-size: 14px; border-bottom: 1px solid var(--border-light); transition: background 0.2s; }
      .slot-result-item:last-child { border-bottom: none; }
      .slot-result-item:hover { background: var(--bg-color); }
      .slot-result-item .item-name { font-weight: bold; color: var(--text-main); }
      .slot-result-item .item-meta { color: var(--text-muted); font-size: 12px; margin-top: 4px; }

      /* 已選機構卡 */
      .selected-center { display: flex; align-items: center; gap: 12px; background: #FFFFFF; border: 1px solid var(--border-light); border-radius: 16px; padding: 16px; flex: 1; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
      .selected-center-info { flex: 1; }
      .selected-center-name { font-weight: bold; color: var(--text-main); font-size: 15px; }
      .selected-center-meta { color: var(--text-muted); font-size: 13px; margin-top: 4px; }
      .remove-btn { padding: 6px 12px; border: none; border-radius: 8px; background: #FEE2E2; color: #EF4444; cursor: pointer; font-weight: bold; font-size: 13px; flex-shrink: 0; transition: all 0.2s; }
      .remove-btn:hover { background: #FECACA; transform: scale(1.05); }
      .empty-slot { flex: 1; display: flex; align-items: center; justify-content: center; color: #B4A996; font-size: 15px; border: 2px dashed #EBE6E0; border-radius: 16px; background: #FFFFFF; padding: 20px; text-align: center; line-height: 1.6; }

      /* ── 比較按鈕 ── */
      .compare-action { text-align: center; margin-bottom: 40px; }
      .compare-btn { padding: 16px 50px; background: var(--primary-color); color: var(--text-main); border: none; border-radius: 9999px; font-size: 18px; font-weight: bold; cursor: pointer; letter-spacing: 1px; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); box-shadow: 0 4px 15px rgba(255, 209, 102, 0.4); }
      .compare-btn:hover:not(:disabled) { background: var(--primary-hover); transform: translateY(-2px) scale(1.02); box-shadow: 0 8px 25px rgba(255, 209, 102, 0.5); }
      .compare-btn:disabled { background: #EBE6E0; color: #aaa; box-shadow: none; cursor: not-allowed; }

      /* ── 比較結果表格 ── */
      .compare-result { display: none; }
      .compare-result.show { display: block; animation: fadeIn 0.5s ease; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

      .compare-table { width: 100%; border-collapse: separate; border-spacing: 0; background: var(--surface-color); border: 1px solid var(--border-light); border-radius: 24px; overflow: hidden; box-shadow: var(--shadow-sm); }
      .compare-table th, .compare-table td { padding: 16px 20px; border-bottom: 1px solid var(--border-light); font-size: 15px; vertical-align: middle; }
      .compare-table th { background: #FFFDF8; color: var(--text-main); font-weight: bold; width: 160px; white-space: nowrap; border-right: 1px solid var(--border-light); }
      .compare-table td { width: calc((100% - 160px) / 2); }
      .compare-table td:last-child { border-left: 1px solid var(--border-light); }
      .compare-table tr:last-child th, .compare-table tr:last-child td { border-bottom: none; }

      /* 表頭行 */
      .compare-table .header-row th { background: #FFFDF8; border-bottom: 2px solid var(--border-light); }
      .compare-table .header-row td { background: var(--primary-color); color: var(--text-main); font-weight: bold; font-size: 18px; text-align: center; padding: 24px; border-bottom: 2px solid var(--border-light); }
      .compare-table .header-row td.left-col { background: #FFE8A1; }
      .compare-table .header-row td.right-col { background: #FFD166; }

      /* 分類標題行 */
      .compare-table .section-row th { background: #F9F7F4; color: var(--text-main); font-size: 12px; letter-spacing: 1px; text-transform: uppercase; padding: 12px 20px; }
      .compare-table .section-row td { background: #F9F7F4; padding: 12px 20px; }

      /* 優/劣標記 */
      .tag-better { display: inline-block; background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; padding: 2px 8px; font-size: 11px; font-weight: bold; margin-left: 6px; border-radius: 4px; }
      .tag-worse { display: inline-block; background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; padding: 2px 8px; font-size: 11px; font-weight: bold; margin-left: 6px; border-radius: 4px; }

      /* 評鑑等級對應色 */
      .eval-A { color: #065f46; font-weight: bold; }
      .eval-B { color: #92400e; font-weight: bold; }
      .eval-C { color: #991b1b; font-weight: bold; }

      /* 載入狀態 */
      .loading-row td { text-align: center; padding: 40px; color: var(--text-muted); }
"""

pattern = re.compile(r'/\* ── 頁面結構 ── \*/.*?/\* 載入狀態 \*/\n      \.loading-row td \{ text-align: center; padding: 40px; color: var\(--text-muted\); \}\n', re.DOTALL)
new_content = pattern.sub(new_styles, content)

with open('compare.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Done replacing compare.html styles")

import re
import pyodbc
import pandas as pd
from datetime import datetime

# ==========================================
# KẾT NỐI MSSQL
# ==========================================

CONN_STR = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=localhost;"
    "DATABASE=HorseRacingDB;"
    "UID=sa;PWD=12345"
)

def query(sql, params=None):
    try:
        with pyodbc.connect(CONN_STR) as conn:
            conn.setdecoding(pyodbc.SQL_CHAR, encoding='utf-8')
            conn.setdecoding(pyodbc.SQL_WCHAR, encoding='utf-16le')
            conn.setencoding(encoding='utf-8')
            df = pd.read_sql(sql, conn, params=params)
        return df
    except Exception as e:
        return None

# ==========================================
# CÁC HÀM QUERY
# ==========================================

def get_horse_info(name=None):
    if name:
        df = query("""
            SELECT h.name, h.breed, h.current_rating, h.total_races, h.total_wins,
                   h.status, u.username as owner
            FROM Horse h
            JOIN [User] u ON h.owner_id = u.id
            WHERE h.name LIKE ?
        """, params=[f"%{name}%"])
    else:
        df = query("""
            SELECT TOP 10 h.name, h.breed, h.current_rating, h.total_races, h.total_wins, h.status
            FROM Horse h
            ORDER BY h.current_rating DESC
        """)
    return df

def get_top_horses():
    return query("""
        SELECT TOP 5 name, current_rating, total_races, total_wins,
               CAST(total_wins * 100.0 / NULLIF(total_races,0) AS DECIMAL(5,1)) as win_rate_pct
        FROM Horse
        WHERE status = 'ACTIVE'
        ORDER BY current_rating DESC
    """)

def get_jockey_info(name=None):
    if name:
        df = query("""
            SELECT username, weight, total_races_participated, total_top3_finishes,
                   CAST(total_top3_finishes * 100.0 / NULLIF(total_races_participated,0) AS DECIMAL(5,1)) as top3_rate
            FROM [User]
            WHERE role_id = 3 AND username LIKE ?
        """, params=[f"%{name}%"])
    else:
        df = query("""
            SELECT TOP 5 username, weight, total_races_participated, total_top3_finishes,
                   CAST(total_top3_finishes * 100.0 / NULLIF(total_races_participated,0) AS DECIMAL(5,1)) as top3_rate
            FROM [User]
            WHERE role_id = 3 AND status = 'ACTIVE'
            ORDER BY total_top3_finishes DESC
        """)
    return df

def get_upcoming_races():
    return query("""
        SELECT r.id, r.class_level, r.distance_meters, r.track_type,
               r.purse, r.status, r.start_time, rm.name as meeting_name, rm.venue
        FROM Race r
        JOIN RaceMeeting rm ON r.race_meeting_id = rm.id
        WHERE r.status IN ('SCHEDULED','DECLARATION_OPEN','RACE_ASSIGNED')
        ORDER BY r.start_time ASC
    """)

def get_recent_results():
    return query("""
        SELECT TOP 5
            r.id as race_id, r.class_level, r.distance_meters,
            rm.name as meeting_name, rm.venue,
            h.name as horse_name, re.final_position, re.finish_time, re.prize_money,
            u.username as jockey
        FROM RaceEntry re
        JOIN Race r ON re.race_id = r.id
        JOIN RaceMeeting rm ON r.race_meeting_id = rm.id
        JOIN Horse h ON re.horse_id = h.id
        JOIN [User] u ON re.jockey_id = u.id
        WHERE re.status = 'FINISHED' AND re.final_position = 1
        ORDER BY r.start_time DESC
    """)

def get_results_by_query(search_term):
    if search_term.isdigit():
        return query("""
            SELECT
                r.id as race_id, r.class_level, r.distance_meters,
                rm.name as meeting_name, rm.venue,
                h.name as horse_name, re.final_position, re.finish_time, re.prize_money,
                u.username as jockey, re.status as entry_status
            FROM RaceEntry re
            JOIN Race r ON re.race_id = r.id
            JOIN RaceMeeting rm ON r.race_meeting_id = rm.id
            JOIN Horse h ON re.horse_id = h.id
            JOIN [User] u ON re.jockey_id = u.id
            WHERE r.id = ?
            ORDER BY CASE WHEN re.final_position IS NULL THEN 999 ELSE re.final_position END ASC
        """, params=[int(search_term)])
    else:
        return query("""
            SELECT
                r.id as race_id, r.class_level, r.distance_meters,
                rm.name as meeting_name, rm.venue,
                h.name as horse_name, re.final_position, re.finish_time, re.prize_money,
                u.username as jockey, re.status as entry_status
            FROM RaceEntry re
            JOIN Race r ON re.race_id = r.id
            JOIN RaceMeeting rm ON r.race_meeting_id = rm.id
            JOIN Horse h ON re.horse_id = h.id
            JOIN [User] u ON re.jockey_id = u.id
            WHERE rm.name LIKE ? OR rm.venue LIKE ?
            ORDER BY r.id ASC, CASE WHEN re.final_position IS NULL THEN 999 ELSE re.final_position END ASC
        """, params=[f"%{search_term}%", f"%{search_term}%"])

def get_race_prediction(race_id=None):
    if race_id:
        df = query("""
            SELECT h.name as horse_name, h.current_rating, h.total_wins, h.total_races,
                   re.gate_number, re.carried_weight, re.handicap_weight,
                   u.username as jockey, u.total_top3_finishes, u.total_races_participated,
                   CAST(h.total_wins * 100.0 / NULLIF(h.total_races,0) AS DECIMAL(5,1)) as win_rate,
                   CAST(u.total_top3_finishes * 100.0 / NULLIF(u.total_races_participated,0) AS DECIMAL(5,1)) as jockey_top3_rate
            FROM RaceEntry re
            JOIN Horse h ON re.horse_id = h.id
            JOIN [User] u ON re.jockey_id = u.id
            WHERE re.race_id = ? AND re.status = 'APPROVED'
            ORDER BY h.current_rating DESC
        """, params=[race_id])
    else:
        df = query("""
            SELECT TOP 1 r.id FROM Race r
            WHERE r.status IN ('DECLARATION_OPEN','RACE_ASSIGNED')
            ORDER BY r.start_time ASC
        """)
        if df is not None and not df.empty:
            return get_race_prediction(int(df.iloc[0]['id']))
        return None
    return df

def get_violations():
    return query("""
        SELECT TOP 5
            v.description, v.penalty, v.status,
            h.name as horse_name,
            u.username as jockey,
            r.class_level
        FROM Violation v
        JOIN Horse h ON v.horse_id = h.id
        JOIN [User] u ON v.jockey_id = u.id
        JOIN Race r ON v.race_id = r.id
        ORDER BY v.id DESC
    """)

def get_season_info():
    return query("""
        SELECT s.name, s.start_date, s.end_date, s.status,
               COUNT(DISTINCT rm.id) as total_meetings,
               COUNT(DISTINCT r.id) as total_races
        FROM Season s
        LEFT JOIN RaceMeeting rm ON rm.season_id = s.id
        LEFT JOIN Race r ON r.race_meeting_id = rm.id
        GROUP BY s.id, s.name, s.start_date, s.end_date, s.status
        ORDER BY s.start_date DESC
    """)

def get_upcoming_meetings():
    df = query("""
        SELECT name, start_date, venue, total_budget
        FROM RaceMeeting
        WHERE start_date >= GETDATE()
        ORDER BY start_date ASC
    """)
    if df is None or df.empty:
        df = query("""
            SELECT TOP 5 name, start_date, venue, total_budget
            FROM RaceMeeting
            ORDER BY start_date DESC
        """)
    return df

def get_race_detail_info(race_id):
    return query("""
        SELECT r.id, r.class_level, r.distance_meters, r.track_type, r.purse, r.status, r.start_time, rm.name as meeting_name, rm.venue
        FROM Race r
        JOIN RaceMeeting rm ON r.race_meeting_id = rm.id
        WHERE r.id = ?
    """, params=[race_id])

def get_race_entries(race_id):
    return query("""
        SELECT h.name as horse_name, u.username as jockey, re.gate_number, re.final_position, re.finish_time, re.prize_money, re.status
        FROM RaceEntry re
        JOIN Horse h ON re.horse_id = h.id
        JOIN [User] u ON re.jockey_id = u.id
        WHERE re.race_id = ?
        ORDER BY re.gate_number
    """, params=[race_id])

def get_owners():
    return query("""
        SELECT username, email
        FROM [User]
        WHERE role_id = 2 AND status = 'ACTIVE'
        ORDER BY username ASC
    """)

def get_horse_history(name):
    return query("""
        SELECT r.id as race_id, r.class_level, rm.name as meeting_name, re.finish_time, re.prize_money, u.username as jockey
        FROM RaceEntry re
        JOIN Race r ON re.race_id = r.id
        JOIN RaceMeeting rm ON r.race_meeting_id = rm.id
        JOIN Horse h ON re.horse_id = h.id
        JOIN [User] u ON re.jockey_id = u.id
        WHERE h.name LIKE ? AND re.final_position = 1 AND re.status = 'FINISHED'
        ORDER BY r.start_time DESC
    """, params=[f"%{name}%"])

def get_jockey_history(name):
    return query("""
        SELECT r.id as race_id, r.class_level, rm.name as meeting_name, re.finish_time, re.prize_money, h.name as horse_name
        FROM RaceEntry re
        JOIN Race r ON re.race_id = r.id
        JOIN RaceMeeting rm ON r.race_meeting_id = rm.id
        JOIN Horse h ON re.horse_id = h.id
        JOIN [User] u ON re.jockey_id = u.id
        WHERE u.username LIKE ? AND re.final_position = 1 AND re.status = 'FINISHED'
        ORDER BY r.start_time DESC
    """, params=[f"%{name}%"])

def get_steward_report(race_id):
    return query("""
        SELECT r.id, r.class_level, r.steward_report, rm.name as meeting_name
        FROM Race r
        JOIN RaceMeeting rm ON r.race_meeting_id = rm.id
        WHERE r.id = ?
    """, params=[race_id])

def get_class_rules():
    return query("""
        SELECT class_level, class_name, min_rating, max_rating, min_prize, max_prize
        FROM SeasonClassRule
        ORDER BY min_rating DESC
    """)

def get_system_config():
    return query("""
        SELECT config_key, config_value, description
        FROM SystemConfig
    """)


# ==========================================
# DETECT NGÔN NGỮ
# ==========================================

def detect_lang(text):
    # Tiếng Việt có dấu
    if re.search(r'[àáâãèéêìíòóôõùúăđơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳýỵỷỹ]', text, re.IGNORECASE):
        return 'vi'
    # Tiếng Nhật (Hiragana/Katakana)
    if re.search(r'[\u3040-\u309f\u30a0-\u30ff]', text):
        return 'ja'
    # Tiếng Trung (Ký tự Trung Quốc)
    if re.search(r'[\u4e00-\u9fff]', text):
        return 'zh'
    return 'en'

# ==========================================
# TRÍCH XUẤT THÔNG TIN
# ==========================================

def extract_horse_name(text, lang):
    text = text.strip()
    if lang == 'vi':
        text = re.sub(r'^(thông tin|chi tiết về|tìm hiểu về|ngựa)\s+', '', text, flags=re.IGNORECASE)
        text = re.sub(r'\s+(thông tin|là gì|rating|chỉ số|\?)$', '', text, flags=re.IGNORECASE)
        text = re.sub(r'^ngựa\s+', '', text, flags=re.IGNORECASE)
    elif lang == 'en':
        text = re.sub(r'^(info|detail|about|horse)\s+', '', text, flags=re.IGNORECASE)
        text = re.sub(r'\s+(info|detail|rating|stats|\?)$', '', text, flags=re.IGNORECASE)
        text = re.sub(r'^horse\s+', '', text, flags=re.IGNORECASE)
        text = re.sub(r'\s+horse$', '', text, flags=re.IGNORECASE)
    elif lang == 'ja':
        text = re.sub(r'^(情報|詳細|競走馬|馬)\s*', '', text)
        text = re.sub(r'\s*(の情報|について|という馬|レーティング|\?|？)$', '', text)
        text = re.sub(r'^(競走馬|馬)\s*', '', text)
    elif lang == 'zh':
        text = re.sub(r'^(信息|详情|马匹|马)\s*', '', text)
        text = re.sub(r'\s*(的信息|详情|这匹马|评分|\?|？)$', '', text)
        text = re.sub(r'^(马匹|马)\s*', '', text)
    return text.strip()

def extract_jockey_name(text, lang):
    text = text.strip()
    if lang == 'vi':
        text = re.sub(r'^(thông tin|chi tiết về|nài ngựa|nài)\s+', '', text, flags=re.IGNORECASE)
        text = re.sub(r'\s+(thông tin|là ai|thắng bao nhiêu|\?)$', '', text, flags=re.IGNORECASE)
        text = re.sub(r'^(nài ngựa|nài)\s+', '', text, flags=re.IGNORECASE)
    elif lang == 'en':
        text = re.sub(r'^(info|detail|jockey|rider)\s+', '', text, flags=re.IGNORECASE)
        text = re.sub(r'\s+(info|detail|stats|\?)$', '', text, flags=re.IGNORECASE)
        text = re.sub(r'^(jockey|rider)\s+', '', text, flags=re.IGNORECASE)
    elif lang == 'ja':
        text = re.sub(r'^(情報|詳細|騎手|ジョッキー)\s*', '', text)
        text = re.sub(r'\s*(の情報|について|という騎手|\?|？)$', '', text)
        text = re.sub(r'^(騎手|ジョッキー)\s*', '', text)
    elif lang == 'zh':
        text = re.sub(r'^(信息|详情|骑师)\s*', '', text)
        text = re.sub(r'\s*(的信息|详情|这个骑师|\?|？)$', '', text)
        text = re.sub(r'^骑师\s*', '', text)
    return text.strip()

# ==========================================
# FORMAT KẾT QUẢ THEO NGÔN NGỮ
# ==========================================

def format_horse_info(df, name=None, lang='vi'):
    if df is None or df.empty:
        if lang == 'en':
            return f"No horse found{' named ' + name if name else ''}."
        elif lang == 'ja':
            return f"競走馬{'「' + name + '」' if name else ''}が見つかりませんでした。"
        elif lang == 'zh':
            return f"未找到名为{'“' + name + '”' if name else ''}的马匹。"
        else: # vi
            return f"Không tìm thấy ngựa{' tên ' + name if name else ''} trong hệ thống."

    lines = []
    for _, r in df.iterrows():
        win_rate = round(r['total_wins'] * 100 / r['total_races'], 1) if r['total_races'] > 0 else 0
        breed = r['breed'] if ('breed' in r and r['breed']) else None
        breed_str = f" ({breed})" if breed else ""
        status = r['status'] if 'status' in r else 'ACTIVE'
        
        if lang == 'en':
            line = f"- {r['name']}{breed_str}: Rating {r['current_rating']}, {r['total_races']} races, {r['total_wins']} wins ({win_rate}%)"
            if 'owner' in r: line += f", owner: {r['owner']}"
            line += f" [{status}]"
        elif lang == 'ja':
            line = f"- {r['name']}{breed_str}: レーティング {r['current_rating']}, {r['total_races']}戦, {r['total_wins']}勝 ({win_rate}%)"
            if 'owner' in r: line += f", 馬主: {r['owner']}"
            line += f" [{status}]"
        elif lang == 'zh':
            line = f"- {r['name']}{breed_str}: 评分 {r['current_rating']}, {r['total_races']}场比赛, {r['total_wins']}次获胜 ({win_rate}%)"
            if 'owner' in r: line += f", 马主: {r['owner']}"
            line += f" [{status}]"
        else: # vi
            line = f"- {r['name']}{breed_str}: Rating {r['current_rating']}, {r['total_races']} trận, {r['total_wins']} thắng ({win_rate}%)"
            if 'owner' in r: line += f", chủ ngựa: {r['owner']}"
            line += f" [{status}]"
            
        lines.append(line)
    return "\n".join(lines)

def format_jockey_info(df, name=None, lang='vi'):
    if df is None or df.empty:
        if lang == 'en':
            return f"No jockey found{' named ' + name if name else ''}."
        elif lang == 'ja':
            return f"騎手{'「' + name + '」' if name else ''}が見つかりませんでした。"
        elif lang == 'zh':
            return f"未找到名为{'“' + name + '”' if name else ''}的骑师。"
        else: # vi
            return f"Không tìm thấy nài ngựa{' tên ' + name if name else ''} trong hệ thống."

    lines = []
    for _, r in df.iterrows():
        top3 = r['top3_rate'] if r['top3_rate'] is not None else 0
        weight = r['weight']
        
        if lang == 'en':
            lines.append(
                f"- {r['username']}: {r['total_races_participated']} races, "
                f"top-3: {r['total_top3_finishes']} times ({top3}%), "
                f"weight: {weight}kg"
            )
        elif lang == 'ja':
            lines.append(
                f"- {r['username']}: {r['total_races_participated']}戦, "
                f"トップ3回数: {r['total_top3_finishes']}回 ({top3}%), "
                f"体重: {weight}kg"
            )
        elif lang == 'zh':
            lines.append(
                f"- {r['username']}: {r['total_races_participated']}场比赛, "
                f"前三名次数: {r['total_top3_finishes']}次 ({top3}%), "
                f"体重: {weight}kg"
            )
        else: # vi
            lines.append(
                f"- {r['username']}: {r['total_races_participated']} trận, "
                f"top 3: {r['total_top3_finishes']} lần ({top3}%), "
                f"cân nặng: {weight}kg"
            )
    return "\n".join(lines)

def format_races(df, lang='vi'):
    if df is None or df.empty:
        if lang == 'en': return "No upcoming races found."
        elif lang == 'ja': return "今後のレース予定はありません。"
        elif lang == 'zh': return "没有即将进行的比赛。"
        else: return "Không tìm thấy race sắp diễn ra."

    lines = []
    for _, r in df.iterrows():
        venue = r['venue']
        meeting = r['meeting_name']
        purse = r['purse']
        
        if lang == 'en':
            lines.append(
                f"- Race #{r['id']} | {meeting} | {venue}\n"
                f"  {r['class_level']} | {r['distance_meters']}m | "
                f"Purse: ${purse:,.0f} | Status: {r['status']}"
            )
        elif lang == 'ja':
            lines.append(
                f"- レース #{r['id']} | {meeting} | {venue}\n"
                f"  {r['class_level']} | {r['distance_meters']}m | "
                f"賞金: ${purse:,.0f} | ステータス: {r['status']}"
            )
        elif lang == 'zh':
            lines.append(
                f"- 比赛 #{r['id']} | {meeting} | {venue}\n"
                f"  {r['class_level']} | {r['distance_meters']}米 | "
                f"总奖金: ${purse:,.0f} | 状态: {r['status']}"
            )
        else: # vi
            lines.append(
                f"- Trận #{r['id']} | {meeting} | {venue}\n"
                f"  {r['class_level']} | {r['distance_meters']}m | "
                f"Giải thưởng: ${purse:,.0f} | Trạng thái: {r['status']}"
            )
    return "\n".join(lines)

def format_results(df, lang='vi'):
    if df is None or df.empty:
        if lang == 'en': return "No recent results found."
        elif lang == 'ja': return "最近のレース結果はありません。"
        elif lang == 'zh': return "未找到最近的比赛结果。"
        else: return "Không tìm thấy kết quả gần đây."

    lines = []
    for _, r in df.iterrows():
        prize = r['prize_money']
        
        if lang == 'en':
            lines.append(
                f"- {r['horse_name']} (jockey: {r['jockey']}) won {r['class_level']} "
                f"at {r['venue']} | Time: {r['finish_time']} | Prize: ${prize:,.0f}"
            )
        elif lang == 'ja':
            lines.append(
                f"- {r['horse_name']} (騎手: {r['jockey']}) が {r['venue']} の {r['class_level']} で優勝 | タイム: {r['finish_time']} | 賞金: ${prize:,.0f}"
            )
        elif lang == 'zh':
            lines.append(
                f"- {r['horse_name']} (骑师: {r['jockey']}) 赢得了 {r['class_level']} 在 {r['venue']} | 时间: {r['finish_time']} | 奖金: ${prize:,.0f}"
            )
        else: # vi
            lines.append(
                f"- {r['horse_name']} (nài ngựa: {r['jockey']}) thắng {r['class_level']} "
                f"tại {r['venue']} | Thời gian: {r['finish_time']} | Giải thưởng: ${prize:,.0f}"
            )
    return "\n".join(lines)

def format_grouped_results(df, lang='vi'):
    if df is None or df.empty:
        if lang == 'en': return "No results found for your query."
        elif lang == 'ja': return "クエリに一致する結果が見つかりませんでした。"
        elif lang == 'zh': return "未找到符合您查询的结果。"
        else: return "Không tìm thấy kết quả phù hợp với truy vấn."

    races = {}
    for _, r in df.iterrows():
        race_id = r['race_id']
        if race_id not in races:
            races[race_id] = {
                'meeting_name': r['meeting_name'],
                'venue': r['venue'],
                'class_level': r['class_level'],
                'distance_meters': r['distance_meters'],
                'entries': []
            }
        races[race_id]['entries'].append(r)

    lines = []
    for race_id, info in races.items():
        if lang == 'en':
            lines.append(f"🏁 **Race #{race_id} ({info['class_level']} - {info['distance_meters']}m)** | Meeting: {info['meeting_name']} ({info['venue']})")
        elif lang == 'ja':
            lines.append(f"🏁 **レース #{race_id} ({info['class_level']} - {info['distance_meters']}m)** | 開催: {info['meeting_name']} ({info['venue']})")
        elif lang == 'zh':
            lines.append(f"🏁 **比赛 #{race_id} ({info['class_level']} - {info['distance_meters']}米)** | 赛事: {info['meeting_name']} ({info['venue']})")
        else:
            lines.append(f"🏁 **Trận #{race_id} ({info['class_level']} - {info['distance_meters']}m)** | Ngày hội: {info['meeting_name']} ({info['venue']})")

        for entry in info['entries']:
            pos = entry['final_position']
            time = entry['finish_time'] or "--:--"
            prize = entry['prize_money'] or 0.0
            status = entry['entry_status']
            
            if status == 'DISQUALIFIED' or time == 'DQ':
                pos_str = "DQ"
            elif pos == 1:
                pos_str = "🥇 1st"
            elif pos == 2:
                pos_str = "🥈 2nd"
            elif pos == 3:
                pos_str = "🥉 3rd"
            elif pos is not None:
                pos_str = f"{int(pos)}th"
            else:
                pos_str = "—"

            if lang == 'en':
                lines.append(f"  - {pos_str}: {entry['horse_name']} (Jockey: {entry['jockey']}) | Time: {time} | Prize: ${prize:,.0f}")
            elif lang == 'ja':
                lines.append(f"  - {pos_str}: {entry['horse_name']} (騎手: {entry['jockey']}) | タイム: {time} | 賞金: ${prize:,.0f}")
            elif lang == 'zh':
                lines.append(f"  - {pos_str}: {entry['horse_name']} (骑师: {entry['jockey']}) | 时间: {time} | 奖金: ${prize:,.0f}")
            else:
                lines.append(f"  - {pos_str}: {entry['horse_name']} (Nài ngựa: {entry['jockey']}) | Thời gian: {time} | Giải thưởng: ${prize:,.0f}")
        lines.append("")

    return "\n".join(lines).strip()

def format_prediction(df, race_id, lang='vi'):
    if df is None or df.empty:
        if lang == 'en': return f"No data found for race #{race_id}."
        elif lang == 'ja': return f"レース #{race_id} のデータが見つかりません。"
        elif lang == 'zh': return f"未找到第 #{race_id} 场比赛的数据。"
        else: return f"Không tìm thấy dữ liệu cho race #{race_id}."

    if lang == 'en':
        lines = [f"Prediction for race #{race_id} (based on rating + history):"]
        for i, (_, r) in enumerate(df.iterrows()):
            medal = ["1", "2", "3"][i] if i < 3 else str(i + 1)
            lines.append(
                f"  #{medal} Gate {r['gate_number']} - {r['horse_name']} "
                f"(Rating: {r['current_rating']}, Win: {r['win_rate']}%, "
                f"Jockey: {r['jockey']} top3: {r['jockey_top3_rate']}%)"
            )
        lines.append("(Ranked by rating + win rate, not absolute probability)")
    elif lang == 'ja':
        lines = [f"レース #{race_id} の予測 (レーティング＋履歴に基づく):"]
        for i, (_, r) in enumerate(df.iterrows()):
            medal = ["1", "2", "3"][i] if i < 3 else str(i + 1)
            lines.append(
                f"  #{medal} ゲート {r['gate_number']} - {r['horse_name']} "
                f"(レーティング: {r['current_rating']}, 勝率: {r['win_rate']}%, "
                f"騎手: {r['jockey']} トップ3率: {r['jockey_top3_rate']}%)"
            )
        lines.append("(レーティングと勝率によるランキングであり、絶対的な確率ではありません)")
    elif lang == 'zh':
        lines = [f"第 #{race_id} 场比赛预测 (基于评分和历史数据):"]
        for i, (_, r) in enumerate(df.iterrows()):
            medal = ["1", "2", "3"][i] if i < 3 else str(i + 1)
            lines.append(
                f"  #{medal} 闸位 {r['gate_number']} - {r['horse_name']} "
                f"(评分: {r['current_rating']}, 胜率: {r['win_rate']}%, "
                f"骑师: {r['jockey']} 前三率: {r['jockey_top3_rate']}%)"
            )
        lines.append("(基于评分和胜率排序，非绝对获胜概率)")
    else: # vi
        lines = [f"Dự đoán kết quả race #{race_id} (dựa trên rating + lịch sử):"]
        for i, (_, r) in enumerate(df.iterrows()):
            medal = ["1", "2", "3"][i] if i < 3 else str(i + 1)
            lines.append(
                f"  #{medal} Cổng {r['gate_number']} - {r['horse_name']} "
                f"(Rating: {r['current_rating']}, Thắng: {r['win_rate']}%, "
                f"Nài ngựa: {r['jockey']} top3: {r['jockey_top3_rate']}%)"
            )
        lines.append("(Xếp hạng theo rating + tỉ lệ thắng, không phải xác suất tuyệt đối)")

    return "\n".join(lines)

def format_violations(df, lang='vi'):
    if df is None or df.empty:
        if lang == 'en': return "No violations recorded."
        elif lang == 'ja': return "記録された反則行為はありません。"
        elif lang == 'zh': return "无违规处罚记录。"
        else: return "Không ghi nhận vi phạm nào gần đây."

    lines = []
    for _, r in df.iterrows():
        if lang == 'en':
            lines.append(
                f"- {r['horse_name']} / {r['jockey']} ({r['class_level']}): "
                f"{r['description']} → Penalty: {r['penalty']} [{r['status']}]"
            )
        elif lang == 'ja':
            lines.append(
                f"- {r['horse_name']} / {r['jockey']} ({r['class_level']}): "
                f"{r['description']} → 処分: {r['penalty']} [{r['status']}]"
            )
        elif lang == 'zh':
            lines.append(
                f"- {r['horse_name']} / {r['jockey']} ({r['class_level']}): "
                f"{r['description']} → 处罚: {r['penalty']} [{r['status']}]"
            )
        else: # vi
            lines.append(
                f"- {r['horse_name']} / {r['jockey']} ({r['class_level']}): "
                f"{r['description']} → Hình phạt: {r['penalty']} [{r['status']}]"
            )
    return "\n".join(lines)

def format_season(df, lang='vi'):
    if df is None or df.empty:
        if lang == 'en': return "No season info found."
        elif lang == 'ja': return "シーズン情報が見つかりません。"
        elif lang == 'zh': return "未找到赛季信息。"
        else: return "Không tìm thấy thông tin mùa giải."

    lines = []
    for _, r in df.iterrows():
        if lang == 'en':
            lines.append(
                f"- {r['name']} ({r['status']}): "
                f"{r['start_date']} to {r['end_date']}, "
                f"{r['total_meetings']} meeting days, {r['total_races']} races"
            )
        elif lang == 'ja':
            lines.append(
                f"- {r['name']} ({r['status']}): "
                f"{r['start_date']} ～ {r['end_date']}, "
                f"開催日数: {r['total_meetings']}日, 総レース数: {r['total_races']}"
            )
        elif lang == 'zh':
            lines.append(
                f"- {r['name']} ({r['status']}): "
                f"{r['start_date']} 至 {r['end_date']}, "
                f"赛事天数: {r['total_meetings']}天, 比赛场数: {r['total_races']}"
            )
        else: # vi
            lines.append(
                f"- {r['name']} ({r['status']}): "
                f"{r['start_date']} → {r['end_date']}, "
                f"{r['total_meetings']} ngày họp đua, {r['total_races']} trận đấu"
            )
    return "\n".join(lines)

def format_upcoming_meetings(df, lang='vi'):
    if df is None or df.empty:
        if lang == 'en': return "No upcoming meetings found."
        elif lang == 'ja': return "今後のレース開催予定はありません。"
        elif lang == 'zh': return "没有即将进行的赛事日程。"
        else: return "Không tìm thấy sự kiện ngày hội đua nào sắp diễn ra."

    lines = []
    for _, r in df.iterrows():
        budget = r['total_budget']
        date_str = str(r['start_date'])
        if lang == 'en':
            lines.append(f"- {r['name']} | Venue: {r['venue']} | Date: {date_str} | Budget: ${budget:,.2f}")
        elif lang == 'ja':
            lines.append(f"- {r['name']} | 開催地: {r['venue']} | 日時: {date_str} | 予算: ${budget:,.2f}")
        elif lang == 'zh':
            lines.append(f"- {r['name']} | 地点: {r['venue']} | 日期: {date_str} | 预算: ${budget:,.2f}")
        else:
            lines.append(f"- {r['name']} | Địa điểm: {r['venue']} | Ngày đua: {date_str} | Ngân sách: ${budget:,.2f}")
    return "\n".join(lines)

def format_race_detail(race_df, entries_df, race_id, lang='vi'):
    if race_df is None or race_df.empty:
        if lang == 'en': return f"No race found with ID {race_id}."
        elif lang == 'ja': return f"レース ID {race_id} は見つかりませんでした。"
        elif lang == 'zh': return f"未找到 ID 为 {race_id} 的比赛。"
        else: return f"Không tìm thấy race với ID {race_id}."

    r = race_df.iloc[0]
    dt = str(r['start_time'])
    purse = r['purse']
    
    if lang == 'en':
        header = (f"Race #{r['id']} details:\n"
                  f"- Meeting: {r['meeting_name']} ({r['venue']})\n"
                  f"- Class: {r['class_level']} | Distance: {r['distance_meters']}m | Track: {r['track_type']}\n"
                  f"- Purse: ${purse:,.2f} | Status: {r['status']} | Time: {dt}\n"
                  f"Participants:")
    elif lang == 'ja':
        header = (f"レース #{r['id']} の詳細情報:\n"
                  f"- 開催日: {r['meeting_name']} ({r['venue']})\n"
                  f"- クラス: {r['class_level']} | 距離: {r['distance_meters']}m | トラック: {r['track_type']}\n"
                  f"- 賞金: ${purse:,.2f} | ステータス: {r['status']} | 時間: {dt}\n"
                  f"出走馬一覧:")
    elif lang == 'zh':
        header = (f"比赛 #{r['id']} 详细信息:\n"
                  f"- 赛事: {r['meeting_name']} ({r['venue']})\n"
                  f"- 级别: {r['class_level']} | 距离: {r['distance_meters']}米 | 赛道: {r['track_type']}\n"
                  f"- 奖金: ${purse:,.2f} | 状态: {r['status']} | 时间: {dt}\n"
                  f"参赛名单:")
    else:
        header = (f"Thông tin chi tiết race #{r['id']}:\n"
                  f"- Sự kiện: {r['meeting_name']} ({r['venue']})\n"
                  f"- Hạng: {r['class_level']} | Khoảng cách: {r['distance_meters']}m | Sân: {r['track_type']}\n"
                  f"- Giải thưởng: ${purse:,.2f} | Trạng thái: {r['status']} | Thời gian: {dt}\n"
                  f"Danh sách ngựa tham gia:")

    entry_lines = []
    if entries_df is None or entries_df.empty:
        if lang == 'en': entry_lines.append("  No entries registered yet.")
        elif lang == 'ja': entry_lines.append("  登録済みの出走馬はいません。")
        elif lang == 'zh': entry_lines.append("  尚无登记的参赛马匹。")
        else: entry_lines.append("  Chưa có ngựa đăng ký tham gia.")
    else:
        for _, entry in entries_df.iterrows():
            gate = entry['gate_number']
            horse = entry['horse_name']
            jockey = entry['jockey']
            status = entry['status']
            pos = entry['final_position']
            time = entry['finish_time']
            prize = entry['prize_money']
            
            res_str = ""
            if status == 'FINISHED':
                prize_str = f", Prize: ${prize:,.2f}" if prize and prize > 0 else ""
                if lang == 'en': res_str = f" -> Finished #{int(pos)} in {time}{prize_str}"
                elif lang == 'ja': res_str = f" -> 順位: {int(pos)}着 ({time}){prize_str}"
                elif lang == 'zh': res_str = f" -> 名次: {int(pos)} ({time}){prize_str}"
                else: res_str = f" -> Về đích thứ {int(pos)} với thời gian {time}{prize_str}"
            elif status == 'DISQUALIFIED':
                if lang == 'en': res_str = " -> Disqualified"
                elif lang == 'ja': res_str = " -> 失格"
                elif lang == 'zh': res_str = " -> 取消资格"
                else: res_str = " -> Bị loại (Disqualified)"
            
            entry_lines.append(f"  - Gate {gate}: {horse} (Jockey: {jockey}) [{status}]{res_str}")

    return header + "\n" + "\n".join(entry_lines)

def format_owners(df, lang='vi'):
    if df is None or df.empty:
        if lang == 'en': return "No active owners found."
        elif lang == 'ja': return "アクティブな馬主が見つかりません。"
        elif lang == 'zh': return "未找到活跃的马主。"
        else: return "Không tìm thấy chủ ngựa nào hoạt động trong hệ thống."

    lines = []
    for _, r in df.iterrows():
        lines.append(f"- {r['username']} (Email: {r['email']})")
    return "\n".join(lines)

def format_horse_history(df, name, lang='vi'):
    if df is None or df.empty:
        if lang == 'en': return f"No victory history recorded for horse '{name}'."
        elif lang == 'ja': return f"競走馬「{name}」の優勝記録はありません。"
        elif lang == 'zh': return f"未找到马匹‘{name}’的获胜历史。"
        else: return f"Chiến mã '{name}' chưa có lịch sử thắng race nào được ghi nhận."

    lines = []
    for _, r in df.iterrows():
        prize = r['prize_money']
        if lang == 'en':
            lines.append(f"- Won Race #{r['race_id']} ({r['class_level']}) | Meeting: {r['meeting_name']} | Time: {r['finish_time']} | Prize: ${prize:,.2f} | Jockey: {r['jockey']}")
        elif lang == 'ja':
            lines.append(f"- レース #{r['race_id']} 優勝 ({r['class_level']}) | 開催: {r['meeting_name']} | タイム: {r['finish_time']} | 賞金: ${prize:,.2f} | 騎手: {r['jockey']}")
        elif lang == 'zh':
            lines.append(f"- 赢得比赛 #{r['race_id']} ({r['class_level']}) | 赛事: {r['meeting_name']} | 时间: {r['finish_time']} | 奖金: ${prize:,.2f} | 骑师: {r['jockey']}")
        else:
            lines.append(f"- Thắng Race #{r['race_id']} ({r['class_level']}) | Ngày hội: {r['meeting_name']} | Thời gian: {r['finish_time']} | Tiền thưởng: ${prize:,.2f} | Nài ngựa: {r['jockey']}")
    return "\n".join(lines)

def format_jockey_history(df, name, lang='vi'):
    if df is None or df.empty:
        if lang == 'en': return f"No victory history recorded for jockey '{name}'."
        elif lang == 'ja': return f"騎手「{name}」の優勝記録はありません。"
        elif lang == 'zh': return f"未找到骑师‘{name}’的获胜历史。"
        else: return f"Nài ngựa '{name}' chưa có lịch sử thắng race nào được ghi nhận."

    lines = []
    for _, r in df.iterrows():
        prize = r['prize_money']
        if lang == 'en':
            lines.append(f"- Won Race #{r['race_id']} ({r['class_level']}) | Meeting: {r['meeting_name']} | Time: {r['finish_time']} | Prize: ${prize:,.2f} | Horse: {r['horse_name']}")
        elif lang == 'ja':
            lines.append(f"- レース #{r['race_id']} 優勝 ({r['class_level']}) | 開催: {r['meeting_name']} | タイム: {r['finish_time']} | 賞金: ${prize:,.2f} | 馬: {r['horse_name']}")
        elif lang == 'zh':
            lines.append(f"- 赢得比赛 #{r['race_id']} ({r['class_level']}) | 赛事: {r['meeting_name']} | 时间: {r['finish_time']} | 奖金: ${prize:,.2f} | 马匹: {r['horse_name']}")
        else:
            lines.append(f"- Thắng Race #{r['race_id']} ({r['class_level']}) | Ngày hội: {r['meeting_name']} | Thời gian: {r['finish_time']} | Tiền thưởng: ${prize:,.2f} | Ngựa: {r['horse_name']}")
    return "\n".join(lines)

def format_steward_report(df, race_id, lang='vi'):
    if df is None or df.empty:
        if lang == 'en': return f"No steward report found for race #{race_id}."
        elif lang == 'ja': return f"レース #{race_id} の審査報告書が見つかりません。"
        elif lang == 'zh': return f"未找到第 #{race_id} 场比赛的审查报告。"
        else: return f"Không tìm thấy biên bản giám sát cho race #{race_id}."

    r = df.iloc[0]
    report = r['steward_report']
    if not report:
        if lang == 'en': return f"Race #{race_id} does not have a steward report yet."
        elif lang == 'ja': return f"レース #{race_id} の審査報告書はまだ登録されていません。"
        elif lang == 'zh': return f"第 #{race_id} 场比赛尚无审查报告。"
        else: return f"Race #{race_id} chưa có nội dung biên bản giám sát của trọng tài."

    if lang == 'en':
        return f"Steward Report for Race #{race_id} ({r['class_level']}) | {r['meeting_name']}:\n{report}"
    elif lang == 'ja':
        return f"レース #{race_id} の審査報告書 ({r['class_level']}) | {r['meeting_name']}:\n{report}"
    elif lang == 'zh':
        return f"第 #{race_id} 场比赛审查报告 ({r['class_level']}) | {r['meeting_name']}:\n{report}"
    else:
        return f"Biên bản giám sát trận đấu cho Race #{race_id} ({r['class_level']}) | {r['meeting_name']}:\n{report}"

def format_class_rules(df, lang='vi'):
    if df is None or df.empty:
        if lang == 'en': return "No class rule settings found."
        elif lang == 'ja': return "クラス区分の設定が見つかりません。"
        elif lang == 'zh': return "未找到级别规则设置。"
        else: return "Không tìm thấy dữ liệu cấu hình phân hạng thi đấu."

    lines = []
    for _, r in df.iterrows():
        min_r = int(r['min_rating']) if pd.notna(r['min_rating']) else 0
        max_r = int(r['max_rating']) if pd.notna(r['max_rating']) else "+"
        min_p = r['min_prize']
        max_p = r['max_prize']
        
        rating_range = f"{min_r}-{max_r}" if max_r != "+" else f">= {min_r}"
        
        if lang == 'en':
            lines.append(f"- {r['class_level']} ({r['class_name']}): Rating: {rating_range} | Purse: ${min_p:,.0f} - ${max_p:,.0f}")
        elif lang == 'ja':
            lines.append(f"- {r['class_level']} ({r['class_name']}): レーティング制限: {rating_range} | 賞金範囲: ${min_p:,.0f} - ${max_p:,.0f}")
        elif lang == 'zh':
            lines.append(f"- {r['class_level']} ({r['class_name']}): 评分要求: {rating_range} | 奖金范围: ${min_p:,.0f} - ${max_p:,.0f}")
        else:
            lines.append(f"- {r['class_level']} ({r['class_name']}): Yêu cầu Rating: {rating_range} | Giải thưởng: ${min_p:,.0f} - ${max_p:,.0f}")
    return "\n".join(lines)

def format_system_config(df, lang='vi'):
    if df is None or df.empty:
        if lang == 'en': return "No system config settings found."
        elif lang == 'ja': return "システム設定が見つかりません。"
        elif lang == 'zh': return "未找到系统配置设置。"
        else: return "Không tìm thấy dữ liệu cấu hình hệ thống."

    lines = []
    for _, r in df.iterrows():
        desc = r['description'] or ""
        lines.append(f"- `{r['config_key']}` = `{r['config_value']}` | {desc}")
    return "\n".join(lines)


# ==========================================
# NHẬN DIỆN Ý ĐỊNH (INTENT)
# ==========================================

INTENTS = [
    # English
    (r"top.*(horse|rating)|best.*(horse|rating)|highest.*(rating|horse)",  "top_horses"),
    (r"horse\s+([A-Za-z0-9_ ]+?)(\s+info|\s+detail|\s+rating|\?|$)",      "horse_detail"),
    (r"top.*(jockey|rider)|best.*(jockey|rider)",                          "top_jockeys"),
    (r"jockey\s+([A-Za-z0-9_]+)",                                          "jockey_detail"),
    (r"result.*(?:race|meeting|of)\s+([A-Za-z0-9_]+)|(?:race|meeting)\s+([A-Za-z0-9_]+)\s+result", "race_results"),
    (r"predict|who.*(win|top3|finish)|forecast",                           "predict"),
    (r"upcoming|next.*(race|event)|schedule",                              "upcoming"),
    (r"recent.*(result|win)|latest.*(result|winner)",                      "recent"),
    (r"violation|penalty|foul|incident",                                   "violations"),
    (r"season|championship|tournament",                                    "season"),
    (r"upcoming\s+meeting|meeting\s+schedule|race\s+meeting",              "upcoming_meetings"),
    (r"race\s+(\d+)\s+detail|detail\s+race\s+(\d+)|race\s+(\d+)\s+info",   "race_detail"),
    (r"owner\s+list|list\s+owner|show\s+owner",                            "owners"),
    (r"horse\s+(.+?)\s+(wins|history|victories)",                          "horse_history"),
    (r"jockey\s+(.+?)\s+(wins|history|victories)",                         "jockey_history"),
    (r"steward\s+report\s+race\s+(\d+)|race\s+(\d+)\s+steward\s+report|referee\s+report\s+(\d+)", "steward_report"),
    (r"class\s+rule|rating\s+rule|class\s+level",                          "class_rules"),
    (r"system\s+config|system\s+weight|weight\s+rule",                     "system_config"),
    (r"^(hello|hi|hey)\b",                                                 "greeting"),
    (r"thank",                                                             "thanks"),
    (r"help|what can you|guide",                                           "help"),

    # Vietnamese
    (r"ng[ựu]a.*(rating|cao|t[ốo]t|m[ạa]nh|h[àa]ng ?đ[àa]u|x[ếe]p h[ạa]ng)", "top_horses"),
    (r"(top|h[àa]ng đ[àa]u|t[ốo]t nh[ấa]t).*(ng[ựu]a)",                        "top_horses"),
    (r"ng[ựu]a\s+(.+?)(\s+th[ôo]ng tin|\s+l[àa]|\s+rating|\?|$)",               "horse_detail"),
    (r"th[ôo]ng tin.*(ng[ựu]a)\s+(.+)",                                           "horse_detail"),
    (r"n[àa]i.*(t[ốo]t|gi[ỏo]i|h[àa]ng đ[àa]u|xu[ấa]t s[ắa]c|top)",          "top_jockeys"),
    (r"n[àa]i\s+(.+?)(\s+th[ôo]ng tin|\s+l[àa]|\?|$)",                           "jockey_detail"),
    (r"th[ôo]ng tin.*(n[àa]i)\s+(.+)",                                            "jockey_detail"),
    (r"k[ếe]t qu[ảa].*cu[ộo]c\s+[đo]ua\s+([A-Za-z0-9_]+)|k[ếe]t qu[ảa].*race\s+([A-Za-z0-9_]+)|cu[ộo]c\s+[đo]ua\s+([A-Za-z0-9_]+)\s+k[ếe]t qu[ảa]", "race_results"),
    (r"d[ựu] [đo][oa][áa]n|ai th[ắa]ng",                                         "predict"),
    (r"race.*(s[ắa]p|t[ới]i|[đo][oa]ng|sap)",                                    "upcoming"),
    (r"(l[ịi]ch|s[ắa]p|t[ớo]i).*(race|thi [đo][ấa]u|[đo]ua)",                  "upcoming"),
    (r"k[ếe]t qu[ảa].*(g[àa]n|m[ớo]i|v[ừu]a)",                                  "recent"),
    (r"(th[ắa]ng|v[ôo] [đo][ịi]ch).*(g[àa]n|m[ớo]i|v[ừu]a)",                   "recent"),
    (r"vi ph[ạa]m|ph[ạa]t|tr[ọo]ng t[àa]i",                                     "violations"),
    (r"m[ùu]a gi[ảa]i|season|gi[ảa]i [đo][ấa]u",                                "season"),
    (r"ngày\s+hội\s+đua|sự\s+kiện\s+đua|lịch\s+hội\s+đua|hội\s+đua",             "upcoming_meetings"),
    (r"chi\s+tiết\s+race\s+(\d+)|thông\s+tin\s+race\s+(\d+)|trận\s+(\d+)\s+chi\s+tiết|chi\s+tiết\s+trận\s+(\d+)", "race_detail"),
    (r"danh\s+sách\s+chủ\s+ngựa|chủ\s+ngựa|danh\s+sách\s+chủ",                  "owners"),
    (r"lịch\s+sử\s+thắng\s+(của\s+)?ngựa\s+(.+)|ngựa\s+(.+?)\s+thắng",          "horse_history"),
    (r"lịch\s+sử\s+thắng\s+(của\s+)?nài\s+(.+)|nài\s+(.+?)\s+thắng",             "jockey_history"),
    (r"biên\s+bản\s+giám\s+sát\s+race\s+(\d+)|báo\s+cáo\s+trọng\s+tài\s+race\s+(\d+)|báo\s+cáo\s+trận\s+(\d+)|biên\s+bản\s+trận\s+(\d+)", "steward_report"),
    (r"quy\s+định\s+phân\s+hạng|luật\s+phân\s+hạng|quy\s+định\s+hạng|quy\s+định\s+rating", "class_rules"),
    (r"cấu\s+hình\s+hệ\s+thống|quy\s+định\s+tạ\s+gánh|quy\s+định\s+cân\s+nặng", "system_config"),
    (r"xin ch[àa]o|hello|hi\b|ch[àa]o|hé lo|helo|alo|a lô|hế lô",                                          "greeting"),
    (r"c[ảa]m [ơo]n|thanks|thank you",                                           "thanks"),
    (r"b[ạa]n l[àa] ai|b[ạa]n c[óo] th[ểe]|gi[úu]p|h[ướ]ng d[ẫa]n",          "help"),
    (r"^(ừ|ừm|ờ|ô|ờm|uhm|uh|hmm|hm|ok|okay|fine|sure|alright|okie|rồi|vâng|dạ|thế|vậy|thôi|được rồi|ok rồi|rồi sao|rồi sao nữa|sao nữa|thế thì|ừ nhỉ|thế à|vậy à|à|ạ|uh huh)$", "chitchat"),

    # Japanese
    (r"評価|人気|おすすめ.*馬|(最高|レーティング|高|一番).*馬|馬.*(ランキング|上位|一番強い|評価)", "top_horses"),
    (r"馬\s+(.+)|(.+)\s*(の情報|という馬|レーティング)",                       "horse_detail"),
    (r"優秀.*騎手|(優秀|トップ|一番).*騎手|騎手.*(ランキング|上位|一番優秀|トップ)", "top_jockeys"),
    (r"騎手\s+(.+)|(.+)\s*(の情報|という騎手)",                               "jockey_detail"),
    (r"予測|予想|だれが勝つ|誰が勝つ",                                         "predict"),
    (r"予定|今後のレース|スケジュール|次.*レース",                            "upcoming"),
    (r"レース\s*([A-Za-z0-9_]+)\s*(?:の結果|結果)",                            "race_results"),
    (r"最近の結果|勝者|直近結果|レース結果",                                   "recent"),
    (r"反則|違反|ペナルティ|事件",                                             "violations"),
    (r"シーズン|大会|リーグ",                                                 "season"),
    (r"レース開催|開催予定|開催スケジュール",                                  "upcoming_meetings"),
    (r"レース\s*(\d+)\s*の詳細|レース\s*(\d+)\s*詳細",                         "race_detail"),
    (r"馬主リスト|馬主一覧",                                                   "owners"),
    (r"馬\s+(.+?)\s*の(?:優勝記録|勝利履歴)",                                 "horse_history"),
    (r"騎手\s+(.+?)\s*の(?:優勝記録|勝利履歴)",                               "jockey_history"),
    (r"レース\s*(\d+)\s*の審査報告書|審査報告書\s*レース\s*(\d+)",             "steward_report"),
    (r"クラス区分|レーティング規則|クラスのルール",                           "class_rules"),
    (r"システム設定|斤量規則",                                                 "system_config"),
    (r"こんにちは|はじめまして|ハロー",                                        "greeting"),
    (r"ありがとう",                                                            "thanks"),
    (r"ヘルプ|何ができる|ガイド|使い方",                                       "help"),

    # Chinese
    (r"评分最高.*马|最优秀的马|推荐马匹|(?:马匹|马).*(排行|评分|顶级|最高|推荐)",    "top_horses"),
    (r"(?:tìm ngựa tương tự|ngựa giống|ngựa tương tự như|tìm ngựa giống con|similar horses to|find horses like)\s+([A-Za-z0-9_\u4e00-\u9fff\u3040-\u30ff ]+)", "similar_horses"),
    (r"马\s+(.+)|(.+)\s*(的信息|这匹马|评分)",                               "horse_detail"),
    (r"最优秀.*骑师|优秀骑师|(?:骑师).*(排行|最优秀|顶级)|骑师.*(排行|顶级|前三)", "top_jockeys"),
    (r"骑师\s+(.+)|(.+)\s*(的信息|这个骑师)",                                 "jockey_detail"),
    (r"预测|预测比赛|哪匹马会赢",                                              "predict"),
    (r"日程|即将进行的比赛|下场比赛|赛程",                                     "upcoming"),
    (r"最近结果|最新赛果|比赛结果|谁赢了",                                     "recent"),
    (r"违规|违规记录|处罚|犯规",                                               "violations"),
    (r"赛季|锦标赛|联赛",                                                     "season"),
    (r"赛事安排|赛事日程|赛事日期",                                            "upcoming_meetings"),
    (r"比赛\s*(\d+)\s*详情|比赛\s*(\d+)\s*详细信息",                           "race_detail"),
    (r"马主列表|马主名单",                                                     "owners"),
    (r"马匹\s+(.+?)\s*的?(?:获胜历史|胜绩)",                                   "horse_history"),
    (r"骑师\s+(.+?)\s*的?(?:获胜历史|胜绩)",                                   "jockey_history"),
    (r"比赛\s*(\d+)\s*审查报告|审查报告\s*比赛\s*(\d+)",                       "steward_report"),
    (r"级别规则|评分规则|级别划分",                                           "class_rules"),
    (r"系统配置|负重规则",                                                     "system_config"),
    (r"你好|哈喽|您好",                                                        "greeting"),
    (r"谢谢|感谢",                                                             "thanks"),
    (r"帮助|你能做什么|怎么用|指南",                                           "help"),
]

def detect_intent(text):
    text_lower = text.lower().strip()
    # Normalize "nài ngựa" to "nài" to avoid it matching "ngựa" (horse) rules
    text_lower = text_lower.replace("nài ngựa", "nài")
    
    # Quick check for top jockeys
    if any(w in text_lower for w in ["jockey", "rider", "nài", "騎手", "骑师"]):
        if any(w in text_lower for w in ["top", "best", "tốt", "giỏi", "xuất sắc", "一番", "優秀", "评分", "最高", "顶级", "rate", "tỉ lệ"]):
            return "top_jockeys"
            
    # Quick check for top horses
    if any(w in text_lower for w in ["horse", "ngựa", "馬", "马"]):
        if any(w in text_lower for w in ["top", "best", "rating", "cao", "tốt", "mạnh", "一番", "最高", "评分", "最", "高い", "レーティング", "顶级", "最强"]):
            return "top_horses"

    for pattern, intent in INTENTS:
        if re.search(pattern, text_lower, re.UNICODE | re.IGNORECASE):
            return intent
    if any(w in text_lower for w in ["predict", "win", "dự đoán", "thắng", "予想", "予測", "预测"]):
        return "predict"
    if any(w in text_lower for w in ["upcoming", "schedule", "sắp", "予定", "日程", "赛程"]) or ("lịch" in text_lower and "lịch sử" not in text_lower and "lịch sử thắng" not in text_lower):
        return "upcoming"
    # Detect race_results before recent: if user mentions "kết quả" + a non-time keyword (not "gần", "mới", "vừa")
    has_result_kw = any(w in text_lower for w in ["kết quả", "result", "結果", "结果"])
    has_recent_kw = any(w in text_lower for w in ["gần", "mới", "vừa", "recent", "latest", "最近", "直近", "最新"])
    has_race_kw   = any(w in text_lower for w in ["race", "cuộc đua", "trận", "meeting", "レース", "比赛"])
    if has_result_kw and has_race_kw and not has_recent_kw:
        return "race_results"
    if any(w in text_lower for w in ["recent", "result", "kết quả", "结果", "勝者"]):
        return "recent"
    if any(w in text_lower for w in ["violation", "penalty", "vi phạm", "phạt", "反則", "违规"]):
        return "violations"
    if any(w in text_lower for w in ["season", "mùa giải", "シーズン", "赛季"]):
        return "season"
    return "unknown"

# ==========================================
# HÀM CHAT CHÍNH
# ==========================================

def chat(user_message: str, lang: str = None) -> str:
    msg    = user_message.strip()
    lang   = lang or detect_lang(msg)
    intent = detect_intent(msg)

    # SEMANTIC VECTOR MATCH (using TF-IDF + PCA + Dot Product)
    if intent == "unknown":
        try:
            from semantic_matcher import find_semantic_answer
            semantic_ans = find_semantic_answer(msg)
            if semantic_ans:
                return semantic_ans
        except Exception as e:
            print(f"[Semantic Matcher Error] {e}")

        # LARGE-SCALE FAQ MATCH (using Ridge Regression + PCA + Dot Product on 1M Questions)
        try:
            from large_scale_faq import faq_engine
            if any(w in msg.lower() for w in ["class", "rating", "nài", "ngựa", "giải", "khoảng cách"]):
                faq_ans = faq_engine.ask(msg)
                if faq_ans:
                    return faq_ans
        except Exception as e:
            print(f"[Large-Scale FAQ Error] {e}")

    # SIMILAR HORSES (Large scale vector match with PCA)
    if intent == "similar_horses":
        m = re.search(r"(?:tìm ngựa tương tự|ngựa giống|ngựa tương tự như|tìm ngựa giống con|similar horses to|find horses like)\s+([A-Za-z0-9_\u4e00-\u9fff\u3040-\u30ff ]+)", msg, re.IGNORECASE)
        if m:
            name = m.group(1).strip()
            try:
                from large_scale_search import matcher
                similar = matcher.find_similar_horses(name, top_k=5)
                if not similar:
                    return f"Không tìm thấy ngựa nào tương tự hoặc không tìm thấy ngựa '{name}' trong cơ sở dữ liệu."
                res = f"🏇 **Top 5 ngựa có đặc điểm phong độ tương tự '{name}' (Phân tích bằng Incremental PCA & Dot Product):**\n\n"
                for idx, item in enumerate(similar, 1):
                    res += f"{idx}. **{item['name']}** (Độ tương đồng đặc trưng: {item['similarity']*100:.2f}%)\n"
                return res
            except Exception as e:
                return f"Lỗi phân tích vector quy mô lớn: {str(e)}"

    # GREETING
    if intent == "greeting":
        if lang == 'en':
            return ("Hello! I'm a horse racing AI chatbot.\n"
                    "You can ask me about:\n"
                    "- Horse & jockey info (e.g. 'Horse Thunder King info')\n"
                    "- Upcoming races & events (e.g. 'Upcoming race meetings')\n"
                    "- Recent results (e.g. 'Recent race winners')\n"
                    "- Race predictions (e.g. 'Predict race 1')\n"
                    "- Violations & season info (e.g. 'Recent violations')\n"
                    "- Owners directory & rules (e.g. 'List owners', 'Class rules')\n"
                    "- Victory histories (e.g. 'Horse Thunder King wins')")
        elif lang == 'ja':
            return ("こんにちは！競馬AIアシスタントです。\n"
                    "以下の内容についてお答えできます：\n"
                    "- 競走馬・騎手の情報 (例:「競走馬 Thunder King の情報」)\n"
                    "- 今後のレース・開催予定 (例:「今後のレース開催予定」)\n"
                    "- 最近のレース結果 (例:「最近のレース結果」)\n"
                    "- レース予測 (例:「レース 1 の予測」)\n"
                    "- 反則行為・シーズン情報 (例:「最近の反則行為」)\n"
                    "- 馬主一覧・クラス区分規則 (例:「馬主リスト」,「クラス区分」)\n"
                    "- 勝利履歴 (例:「馬 Thunder King の優勝記録」)")
        elif lang == 'zh':
            return ("你好！我是赛马AI助手。\n"
                    "您可以咨询以下内容：\n"
                    "- 马匹和骑师信息 (例如: ‘马匹 Thunder King 的信息’)\n"
                    "- 即将进行的赛事 (例如: ‘即将进行的赛事日程’)\n"
                    "- 最近的比赛结果 (例如: ‘最近的比赛结果’)\n"
                    "- 比赛结果预测 (例如: ‘预测第 1 场比赛’)\n"
                    "- 违规记录和赛季信息 (例如: ‘最近的违规记录’)\n"
                    "- 马主名录和级别规则 (例如: ‘马主列表’, ‘级别规则’)\n"
                    "- 历史战绩 (例如: ‘马匹 Thunder King 获胜历史’)")
        else: # vi
            return ("Xin chào! Tôi là chatbot phân tích đua ngựa.\n"
                    "Bạn có thể hỏi tôi về:\n"
                    "- Thông tin ngựa, nài ngựa (ví dụ: 'Thông tin ngựa Thunder King')\n"
                    "- Sự kiện hội đua, trận đấu sắp tới (ví dụ: 'Ngày hội đua sắp tới')\n"
                    "- Kết quả gần đây (ví dụ: 'Kết quả race gần nhất')\n"
                    "- Dự đoán kết quả trận đấu (ví dụ: 'Dự đoán race 1')\n"
                    "- Vi phạm, mùa giải (ví dụ: 'Vi phạm gần đây')\n"
                    "- Danh sách chủ ngựa & Luật phân hạng (ví dụ: 'Danh sách chủ ngựa', 'Quy định phân hạng')\n"
                    "- Lịch sử chiến thắng của ngựa/nài (ví dụ: 'Lịch sử thắng của ngựa Thunder King')")

    # CHITCHAT - Các câu phản hồi ngắn tán gẫu như 'ừ', 'rồi sao nữa', 'ok'
    if intent == "chitchat":
        import random
        responses_vi = [
            "🐎 Haha! Bạn đang tán gẫu với chatbot đua ngựa đấy nhé! Hỏi tôi về race, ngựa hoặc nài ngựa để tôi khoe kiến thức nhé!",
            "🏇 Ừ ừ tôi nghe! Bạn muốn hỏi gì về giải đấu đua ngựa không? Tôi biết hết mọi chuyện ở trường đua đấy!",
            "😄 Dạ bạn ơi! Nếu không có gì muốn hỏi về giải đua ngựa thì tôi đề xuất bạn cứ ghé xem kết quả race mới nhất cho vui nhé!",
        ]
        responses_en = [
            "🐎 Haha! You're chatting with a horse racing AI! Ask me about races, horses, or jockeys — I know it all!",
            "🏇 Got it! Anything you want to know about the tournament? I'm all ears (well, hooves)! 🤣",
        ]
        if lang == 'en':
            return random.choice(responses_en)
        else:
            return random.choice(responses_vi)

    # THANKS
    if intent == "thanks":
        if lang == 'en':
            return "You're welcome! Feel free to ask more."
        elif lang == 'ja':
            return "どういたしまして！他に気になることがあれば、何でも聞いてください。"
        elif lang == 'zh':
            return "不用客气！如果需要更多信息，请随时提问。"
        else: # vi
            return "Không có gì! Nếu cần thêm thông tin hãy hỏi tôi nhé."

    # HELP
    if intent == "help":
        if lang == 'en':
            return ("I can answer questions like:\n"
                    "- 'Top rated horses' or 'Horse Thunder King info'\n"
                    "- 'Best jockeys' or 'Jockey jockey_ryan info'\n"
                    "- 'Upcoming races' or 'Upcoming meetings'\n"
                    "- 'Predict race 3' or 'Race 1 details'\n"
                    "- 'Recent results' or 'Recent violations'\n"
                    "- 'List owners' or 'Class rules'\n"
                    "- 'System weight rules' or 'Steward report race 1'\n"
                    "- 'Horse Thunder King wins' or 'Jockey jockey_ryan wins'")
        elif lang == 'ja':
            return ("以下のような質問にお答えできます：\n"
                    "- 「レーティングの高い馬は？」や「競走馬 Thunder King の情報」\n"
                    "- 「優秀な騎手は？」や「騎手 jockey_ryan の情報」\n"
                    "- 「今後のレース予定」や「今後のレース開催予定」\n"
                    "- 「レース 1 の予測」や「レース 1 の詳細情報」\n"
                    "- 「最近のレース結果」や「最近の反則行為」\n"
                    "- 「馬主リスト」や「クラス区分のルール」\n"
                    "- 「システム斤量規則」や「レース 1 の審査報告書」\n"
                    "- 「馬 Thunder King の優勝記録」や「騎手 jockey_ryan の優勝記録」")
        elif lang == 'zh':
            return ("我可以回答以下类似的问题：\n"
                    "- ‘评分最高的马匹’ 或 ‘马匹 Thunder King 的信息’\n"
                    "- ‘最优秀的骑师’ 或 ‘骑师 jockey_ryan 的信息’\n"
                    "- ‘即将进行的比赛’ 或 ‘即将进行的赛事日程’\n"
                    "- ‘预测第 1 场比赛’ 或 ‘比赛 1 详细信息’\n"
                    "- ‘最近的比赛结果’ 或 ‘最近的违规记录’\n"
                    "- ‘马主列表’ 或 ‘级别规则’\n"
                    "- ‘系统负重规则’ 或 ‘比赛 1 审查报告’\n"
                    "- ‘马匹 Thunder King 获胜历史’ 或 ‘骑师 jockey_ryan 获胜历史’")
        else: # vi
            return ("Tôi có thể trả lời các câu hỏi:\n"
                    "- 'Ngựa Thunder King có rating bao nhiêu?' hoặc 'Thông tin ngựa Thunder King'\n"
                    "- 'Nài jockey_ryan thắng bao nhiêu lần?' hoặc 'Thông tin nài jockey_ryan'\n"
                    "- 'Race sắp tới là gì?' hoặc 'Ngày hội đua sắp tới'\n"
                    "- 'Dự đoán kết quả race 1' hoặc 'Chi tiết trận 1'\n"
                    "- 'Kết quả race gần nhất' hoặc 'Vi phạm nào gần đây?'\n"
                    "- 'Danh sách chủ ngựa' hoặc 'Quy định phân hạng'\n"
                    "- 'Quy định cân nặng tạ gánh' hoặc 'Biên bản trận 1'\n"
                    "- 'Lịch sử thắng của ngựa Thunder King' hoặc 'Lịch sử thắng của nài jockey_ryan'")

    # TOP HORSES
    if intent == "top_horses":
        df = get_top_horses()
        if lang == 'en': prefix = "Top 5 horses by rating:\n"
        elif lang == 'ja': prefix = "レーティング上位5頭の競走馬：\n"
        elif lang == 'zh': prefix = "评分前5名的马匹：\n"
        else: prefix = "Top 5 ngựa có rating cao nhất:\n"
        return prefix + format_horse_info(df, lang=lang)

    # HORSE DETAIL
    if intent == "horse_detail":
        name = extract_horse_name(msg, lang)
        
        # If extraction is empty or too broad, try regex fallback
        if not name or len(name) < 2:
            m = re.search(r"(?:horse|ngựa|馬|竞走马|马)\s+([A-Za-z0-9_\u4e00-\u9fff\u3040-\u30ff ]+)", msg, re.IGNORECASE)
            if m: name = m.group(1).strip()
            
        if not name:
            df = get_horse_info(None)
            if lang == 'en': prefix = "Horse list:\n"
            elif lang == 'ja': prefix = "競走馬リスト：\n"
            elif lang == 'zh': prefix = "马匹列表：\n"
            else: prefix = "Danh sách ngựa:\n"
            return prefix + format_horse_info(df, lang=lang)
            
        df = get_horse_info(name)
        if lang == 'en': prefix = f"Horse info '{name}':\n"
        elif lang == 'ja': prefix = f"競走馬「{name}」の情報：\n"
        elif lang == 'zh': prefix = f"马匹‘{name}’的信息：\n"
        else: prefix = f"Thông tin ngựa '{name}':\n"
        return prefix + format_horse_info(df, name, lang=lang)

    # TOP JOCKEYS
    if intent == "top_jockeys":
        df = get_jockey_info()
        if lang == 'en': prefix = "Top 5 jockeys:\n"
        elif lang == 'ja': prefix = "上位5名の騎手：\n"
        elif lang == 'zh': prefix = "前5名骑师：\n"
        else: prefix = "Top 5 nài ngựa xuất sắc nhất:\n"
        return prefix + format_jockey_info(df, lang=lang)

    # JOCKEY DETAIL
    if intent == "jockey_detail":
        name = extract_jockey_name(msg, lang)
        
        if not name or len(name) < 2:
            m = re.search(r"(?:jockey|nài|騎手|骑师)\s+([A-Za-z0-9_ ]+)", msg, re.IGNORECASE)
            if m: name = m.group(1).strip()
            
        if not name:
            df = get_jockey_info(None)
            if lang == 'en': prefix = "Jockey list:\n"
            elif lang == 'ja': prefix = "騎手リスト：\n"
            elif lang == 'zh': prefix = "骑师列表：\n"
            else: prefix = "Danh sách nài ngựa:\n"
            return prefix + format_jockey_info(df, lang=lang)
            
        df = get_jockey_info(name)
        if lang == 'en': prefix = f"Jockey info '{name}':\n"
        elif lang == 'ja': prefix = f"騎手「{name}」の情報：\n"
        elif lang == 'zh': prefix = f"骑师‘{name}’的信息：\n"
        else: prefix = f"Thông tin nài '{name}':\n"
        return prefix + format_jockey_info(df, name, lang=lang)

    # UPCOMING
    if intent == "upcoming":
        df = get_upcoming_races()
        if lang == 'en': prefix = "Upcoming races:\n"
        elif lang == 'ja': prefix = "今後のレース予定：\n"
        elif lang == 'zh': prefix = "即将进行的比赛：\n"
        else: prefix = "Race sắp diễn ra:\n"
        return prefix + format_races(df, lang=lang)

    # RACE RESULTS (search by meeting name or race ID)
    if intent == "race_results":
        # Extract race ID or meeting name keyword from message
        search_term = None
        # Try match race id: "race 5", "trận 5", "cuộc đua 5"
        m = re.search(r"(?:race|trận|cu[ộo]c\s+[đo]ua|レース|比赛)\s*#?\s*(\d+)", msg, re.IGNORECASE)
        if m:
            search_term = m.group(1)
        else:
            # Try match meeting name keyword after keywords like "cuộc đua", "race", "result of"
            m = re.search(
                r"(?:k[ếe]t qu[ảa].*cu[ộo]c\s+[đo]ua|k[ếe]t qu[ảa].*race|result.*race|result.*of|race\s+result)\s+([A-Za-z0-9_]+)",
                msg, re.IGNORECASE)
            if m:
                search_term = m.group(1)
            else:
                # Last resort: extract any standalone word after trigger keywords
                m = re.search(
                    r"(?:cu[ộo]c\s+[đo]ua|race|meeting|trận)\s+([A-Za-z0-9_]{2,})",
                    msg, re.IGNORECASE)
                if m:
                    search_term = m.group(1)

        if not search_term:
            if lang == 'en': return "Please specify a race ID or meeting name (e.g. 'result of race pdfosg' or 'race 5 result')."
            elif lang == 'ja': return "レースIDまたは開催名を指定してください (例: 'レース5の結果')."
            elif lang == 'zh': return "请指定比赛ID或赛事名称 (例如: '比赛5结果')."
            else: return "Vui lòng nhập ID trận hoặc tên cuộc đua (ví dụ: 'kết quả cuộc đua pdfosg' hoặc 'kết quả race 5')."

        df = get_results_by_query(search_term)
        if lang == 'en': prefix = f"Results for '{search_term}':\n"
        elif lang == 'ja': prefix = f"'{search_term}' の結果：\n"
        elif lang == 'zh': prefix = f"'{search_term}' 的比赛结果：\n"
        else: prefix = f"Kết quả cuộc đua '{search_term}':\n"
        return prefix + format_grouped_results(df, lang=lang)

    # RECENT
    if intent == "recent":
        df = get_recent_results()
        if lang == 'en': prefix = "Recent race winners:\n"
        elif lang == 'ja': prefix = "最近のレース勝者：\n"
        elif lang == 'zh': prefix = "最近的获胜马匹：\n"
        else: prefix = "Kết quả thắng race gần đây:\n"
        return prefix + format_results(df, lang=lang)

    # PREDICT
    if intent == "predict":
        race_id = None
        # Match digit for race id (e.g. race 3, race #3, race# 3, 3)
        m = re.search(r"(?:race|trận|レース|比赛|#)\s*#?\s*(\d+)", msg, re.IGNORECASE)
        if m: 
            race_id = int(m.group(1))
        else:
            # Look for any standalone numbers
            m = re.search(r"\b(\d+)\b", msg)
            if m: race_id = int(m.group(1))
            
        df = get_race_prediction(race_id)
        
        # Format the label for "latest" or "newest" prediction
        if not race_id:
            if lang == 'en': label = "latest"
            elif lang == 'ja': label = "最新"
            elif lang == 'zh': label = "最新"
            else: label = "mới nhất"
        else:
            label = str(race_id)
            
        return format_prediction(df, label, lang=lang)

    # VIOLATIONS
    if intent == "violations":
        df = get_violations()
        if lang == 'en': prefix = "Recent violations:\n"
        elif lang == 'ja': prefix = "最近の反則行為：\n"
        elif lang == 'zh': prefix = "最近的违规记录：\n"
        else: prefix = "Vi phạm gần đây:\n"
        return prefix + format_violations(df, lang=lang)

    # SEASON
    if intent == "season":
        df = get_season_info()
        if lang == 'en': prefix = "Season info:\n"
        elif lang == 'ja': prefix = "シーズン情報：\n"
        elif lang == 'zh': prefix = "赛季信息：\n"
        else: prefix = "Thông tin mùa giải:\n"
        return prefix + format_season(df, lang=lang)

    # UPCOMING MEETINGS
    if intent == "upcoming_meetings":
        df = get_upcoming_meetings()
        if lang == 'en': prefix = "Upcoming race meetings:\n"
        elif lang == 'ja': prefix = "今後のレース開催予定：\n"
        elif lang == 'zh': prefix = "即将进行的赛事日程：\n"
        else: prefix = "Các ngày hội đua sắp diễn ra:\n"
        return prefix + format_upcoming_meetings(df, lang=lang)

    # RACE DETAIL
    if intent == "race_detail":
        race_id = None
        m = re.search(r"(\d+)", msg)
        if m: race_id = int(m.group(1))
        
        if not race_id:
            if lang == 'en': return "Please specify a race ID (e.g. 'race 1 detail')."
            elif lang == 'ja': return "レースIDを指定してください (例: 'レース 1 詳細')."
            elif lang == 'zh': return "请指定比赛 ID (例如: '比赛 1 详情')."
            else: return "Vui lòng nhập ID trận đấu (ví dụ: 'chi tiết trận 1')."
            
        race_df = get_race_detail_info(race_id)
        entries_df = get_race_entries(race_id)
        return format_race_detail(race_df, entries_df, race_id, lang=lang)

    # OWNERS
    if intent == "owners":
        df = get_owners()
        if lang == 'en': prefix = "List of active horse owners:\n"
        elif lang == 'ja': prefix = "アクティブな馬主一覧：\n"
        elif lang == 'zh': prefix = "活跃马主列表：\n"
        else: prefix = "Danh sách các chủ ngựa đang hoạt động:\n"
        return prefix + format_owners(df, lang=lang)

    # HORSE HISTORY
    if intent == "horse_history":
        name = None
        if lang == 'vi':
            m = re.search(r"(?:thắng|lịch sử thắng (của)? ngựa)\s+([A-Za-z0-9_\u4e00-\u9fff\u3040-\u30ff ]+)", msg, re.IGNORECASE)
            if m: name = m.group(2).strip()
            else:
                m = re.search(r"ngựa\s+([A-Za-z0-9_\u4e00-\u9fff\u3040-\u30ff ]+?)\s+thắng", msg, re.IGNORECASE)
                if m: name = m.group(1).strip()
        elif lang == 'en':
            m = re.search(r"horse\s+([A-Za-z0-9_ ]+?)\s+(wins|history)", msg, re.IGNORECASE)
            if m: name = m.group(1).strip()
            else:
                m = re.search(r"(?:wins|history)\s+(?:of|for)\s+horse\s+([A-Za-z0-9_ ]+)", msg, re.IGNORECASE)
                if m: name = m.group(1).strip()
        elif lang == 'ja':
            m = re.search(r"馬\s+([A-Za-z0-9_\u4e00-\u9fff\u3040-\u30ff ]+?)\s*の", msg)
            if m: name = m.group(1).strip()
        elif lang == 'zh':
            m = re.search(r"马谱|马匹\s+([A-Za-z0-9_\u4e00-\u9fff\u3040-\u30ff ]+?)\s*的?", msg)
            if m: name = m.group(1).strip()

        if not name:
            m = re.search(r"(?:horse|ngựa|馬|马)\s+([A-Za-z0-9_\u4e00-\u9fff\u3040-\u30ff ]+)", msg, re.IGNORECASE)
            if m: name = m.group(1).strip()
            
        if not name or len(name) < 2:
            if lang == 'en': return "Please specify a horse name (e.g., 'horse Thunder King wins')."
            elif lang == 'ja': return "競走馬の名前を指定してください (例: '馬 Thunder King の優勝記録')."
            elif lang == 'zh': return "请指定马批名称 (例如: '马匹 Thunder King 获胜历史')."
            else: return "Vui lòng nhập tên ngựa để tra cứu lịch sử thắng (ví dụ: 'lịch sử thắng của ngựa Thunder King')."
            
        df = get_horse_history(name)
        return format_horse_history(df, name, lang=lang)

    # JOCKEY HISTORY
    if intent == "jockey_history":
        name = None
        if lang == 'vi':
            m = re.search(r"(?:thắng|lịch sử thắng (của)? nài)\s+([A-Za-z0-9_\u4e00-\u9fff\u3040-\u30ff ]+)", msg, re.IGNORECASE)
            if m: name = m.group(2).strip()
            else:
                m = re.search(r"nài\s+([A-Za-z0-9_\u4e00-\u9fff\u3040-\u30ff ]+?)\s+thắng", msg, re.IGNORECASE)
                if m: name = m.group(1).strip()
        elif lang == 'en':
            m = re.search(r"jockey\s+([A-Za-z0-9_ ]+?)\s+(wins|history)", msg, re.IGNORECASE)
            if m: name = m.group(1).strip()
            else:
                m = re.search(r"(?:wins|history)\s+(?:of|for)\s+jockey\s+([A-Za-z0-9_ ]+)", msg, re.IGNORECASE)
                if m: name = m.group(1).strip()
        elif lang == 'ja':
            m = re.search(r"騎手\s+([A-Za-z0-9_\u4e00-\u9fff\u3040-\u30ff ]+?)\s*の", msg)
            if m: name = m.group(1).strip()
        elif lang == 'zh':
            m = re.search(r"骑师\s+([A-Za-z0-9_\u4e00-\u9fff\u3040-\u30ff ]+?)\s*的?", msg)
            if m: name = m.group(1).strip()

        if not name:
            m = re.search(r"(?:jockey|nài|騎手|骑师)\s+([A-Za-z0-9_\u4e00-\u9fff\u3040-\u30ff ]+)", msg, re.IGNORECASE)
            if m: name = m.group(1).strip()
            
        if not name or len(name) < 2:
            if lang == 'en': return "Please specify a jockey name (e.g., 'jockey jockey_ryan wins')."
            elif lang == 'ja': return "騎手の名前を指定してください (例: '騎手 jockey_ryan の優勝記録')."
            elif lang == 'zh': return "请指定骑师名称 (例如: '骑师 jockey_ryan 获胜历史')."
            else: return "Vui lòng nhập tên nài ngựa để tra cứu lịch sử thắng (ví dụ: 'lịch sử thắng của nài jockey_ryan')."
            
        df = get_jockey_history(name)
        return format_jockey_history(df, name, lang=lang)

    # STEWARD REPORT
    if intent == "steward_report":
        race_id = None
        m = re.search(r"(\d+)", msg)
        if m: race_id = int(m.group(1))
        
        if not race_id:
            if lang == 'en': return "Please specify a race ID (e.g. 'steward report race 1')."
            elif lang == 'ja': return "レースIDを指定してください (例: 'レース 1 審査報告書')."
            elif lang == 'zh': return "请指定比赛 ID (例如: '比赛 1 审查报告')."
            else: return "Vui lòng nhập ID trận đấu (ví dụ: 'biên bản trận 1')."
            
        df = get_steward_report(race_id)
        return format_steward_report(df, race_id, lang=lang)

    # CLASS RULES
    if intent == "class_rules":
        df = get_class_rules()
        if lang == 'en': prefix = "Race Class Levels and Rating requirements:\n"
        elif lang == 'ja': prefix = "レースクラス区分およびレーティング要件：\n"
        elif lang == 'zh': prefix = "比赛级别及评分要求：\n"
        else: prefix = "Quy định phân hạng thi đấu và Rating yêu cầu:\n"
        return prefix + format_class_rules(df, lang=lang)

    # SYSTEM CONFIG
    if intent == "system_config":
        df = get_system_config()
        if lang == 'en': prefix = "System weight configs:\n"
        elif lang == 'ja': prefix = "システムの斤量・設定情報：\n"
        elif lang == 'zh': prefix = "系统负重及配置参数：\n"
        else: prefix = "Cấu hình quy định tạ gánh hệ thống:\n"
        return prefix + format_system_config(df, lang=lang)

    # CHITCHAT FALLBACKS
    msg_lower = msg.lower()
    if any(w in msg_lower for w in ["người yêu", "ny", "tình yêu", "bạn gái", "bạn trai", "crush"]):
        if lang == 'en':
            return "🐎 In my world, the greatest love is for championship horses and the race track! If you want a partner as loyal and strong as a racehorse, you have to train hard! 😉"
        else:
            return "🐎 Trong thế giới của tôi, tình yêu lớn nhất là dành cho những chú ngựa chiến và tiếng còi khai cuộc! Muốn tìm một người yêu bền bỉ, trung thành như chiến mã thì bạn phải kiên nhẫn tập luyện đấy nhé! 😉"
            
    if any(w in msg_lower for w in ["thông minh", "smart", "học giỏi"]):
        if lang == 'en':
            return "📚 Want to get smarter? Read more horse breeding and training books to provide top-quality horses for our tournaments! 🏇"
        else:
            return "📚 Muốn thông minh vượt trội à? Hãy đọc nhiều sách chăn nuôi và huấn luyện ngựa để cung cấp các chiến mã đẳng cấp nhất cho giải đấu của chúng tôi nhé! 🏇"

    if any(w in msg_lower for w in ["code", "lập trình", "viết code", "program"]):
        if lang == 'en':
            return "💻 I specialize in horse racing data and statistics, not programming. You should guide yourself to use other specialized programming AI tools! 🚀"
        else:
            return "💻 Tôi chuyên về phân tích và số liệu đua ngựa, không biết lập trình đâu. Bạn nên sử dụng một con AI chuyên biệt về viết code khác nhé! 🚀"

    # UNKNOWN fallback
    if lang == 'en':
        return ("I didn't understand your question. Try asking:\n"
                "- 'Which horse has the highest rating?'\n"
                "- 'Horse Thunder King info'\n"
                "- 'Best jockeys'\n"
                "- 'Upcoming races' or 'Upcoming meetings'\n"
                "- 'Predict race 1' or 'Race 1 details'\n"
                "- 'Recent race results' or 'Recent violations'\n"
                "- 'List owners' or 'Class rules'\n"
                "- 'System weight rules' or 'Steward report race 1'\n"
                "- 'Horse Thunder King wins' or 'Jockey jockey_ryan wins'")
    elif lang == 'ja':
        return ("申し訳ありません。質問が理解できませんでした。以下のように聞いてみてください：\n"
                "- 「最もレーティングが高い馬は？」\n"
                "- 「競走馬 Thunder King の情報」\n"
                "- 「一番優秀な騎手は？」\n"
                "- 「今後のレーススケジュール」や「今後のレース開催予定」\n"
                "- 「レース 1 の予測」や「レース 1 の詳細情報」\n"
                "- 「最近のレース結果」や「最近の反則行為」\n"
                "- 「馬主リスト」や「クラス区分のルール」\n"
                "- 「システム斤量規則」や「レース 1 の審査報告書」\n"
                "- 「馬 Thunder King の優勝記録」や「騎手 jockey_ryan の優勝記録」")
    elif lang == 'zh':
        return ("抱歉，我没有理解您的问题。请尝试这样提问：\n"
                "- ‘哪匹马的评分最高？’\n"
                "- ‘马谱 Thunder King 的信息’\n"
                "- ‘谁是最优秀的骑师？’\n"
                "- ‘即将进行的比赛’ 或 ‘即将进行的赛事日程’\n"
                "- ‘预测第 1 场比赛’ 或 ‘比赛 1 详细信息’\n"
                "- ‘最近的比赛结果’ 或 ‘最近的违规记录’\n"
                "- ‘马主列表’ 或 ‘级别规则’\n"
                "- ‘系统负重规则’ 或 ‘比赛 1 审查报告’\n"
                "- ‘马匹 Thunder King 获胜历史’ 或 ‘骑师 jockey_ryan 获胜历史’")
    else: # vi
        return ("Tôi chưa hiểu câu hỏi của bạn. Thử hỏi kiểu:\n"
                "- 'Ngựa nào đang có rating cao nhất?'\n"
                "- 'Thông tin ngựa Thunder King'\n"
                "- 'Nài ngựa xuất sắc nhất'\n"
                "- 'Race sắp diễn ra là gì?' hoặc 'Ngày hội đua sắp tới'\n"
                "- 'Dự đoán race 1' hoặc 'Chi tiết trận 1'\n"
                "- 'Kết quả race gần đây' hoặc 'Vi phạm gần đây'\n"
                "- 'Danh sách chủ ngựa' hoặc 'Quy định phân hạng'\n"
                "- 'Quy định cân nặng tạ gánh' hoặc 'Biên bản trận 1'\n"
                "- 'Lịch sử thắng của ngựa Thunder King' hoặc 'Lịch sử thắng của nài jockey_ryan'")
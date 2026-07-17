import pyodbc
import pandas as pd

CONN_STR = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=localhost;"
    "DATABASE=HorseRacingDB;"
    "UID=sa;PWD=12345"
)

def get_connection():
    conn = pyodbc.connect(CONN_STR)
    conn.setdecoding(pyodbc.SQL_CHAR, encoding='utf-8')
    conn.setdecoding(pyodbc.SQL_WCHAR, encoding='utf-16le')
    conn.setencoding(encoding='utf-8')
    return conn

def get_race_entries(race_id: int) -> pd.DataFrame:
    sql = """
        SELECT
            re.id as entry_id,
            re.gate_number,
            re.carried_weight,
            re.handicap_weight,
            h.name as horse_name,
            h.current_rating,
            h.total_races,
            h.total_wins,
            u.weight as jockey_weight,
            u.total_races_participated as jockey_races,
            u.total_top3_finishes as jockey_top3,
            r.distance_meters,
            r.track_type,
            r.class_level
        FROM RaceEntry re
        JOIN Horse h ON re.horse_id = h.id
        JOIN [User] u ON re.jockey_id = u.id
        JOIN Race r ON re.race_id = r.id
        WHERE re.race_id = ? AND re.status = 'APPROVED'
    """
    with get_connection() as conn:
        return pd.read_sql(sql, conn, params=[race_id])

def get_historical_results() -> pd.DataFrame:
    sql = """
        SELECT
            re.final_position,
            re.gate_number,
            re.carried_weight,
            h.current_rating,
            h.total_races,
            h.total_wins,
            u.total_races_participated as jockey_races,
            u.total_top3_finishes as jockey_top3,
            r.distance_meters,
            r.track_type
        FROM RaceEntry re
        JOIN Horse h ON re.horse_id = h.id
        JOIN [User] u ON re.jockey_id = u.id
        JOIN Race r ON re.race_id = r.id
        WHERE re.status = 'FINISHED' AND re.final_position IS NOT NULL
    """
    with get_connection() as conn:
        return pd.read_sql(sql, conn)

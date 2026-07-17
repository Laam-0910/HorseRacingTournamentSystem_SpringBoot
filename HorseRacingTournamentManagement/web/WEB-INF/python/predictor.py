import pandas as pd
import pickle
import os
from sklearn.ensemble import GradientBoostingClassifier
from db_connector import get_historical_results, get_race_entries

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
FEATURES = [
    "gate_number", "carried_weight", "current_rating",
    "total_races", "total_wins", "jockey_races",
    "jockey_top3", "distance_meters"
]

def train_model():
    df = get_historical_results()
    if df is None or df.empty or len(df) < 10:
        return None
    df["win_rate"] = df["total_wins"] / (df["total_races"] + 1)
    df["jockey_top3_rate"] = df["jockey_top3"] / (df["jockey_races"] + 1)
    df["is_top3"] = (df["final_position"] <= 3).astype(int)

    X = df[FEATURES + ["win_rate", "jockey_top3_rate"]].fillna(0)
    y = df["is_top3"]

    model = GradientBoostingClassifier(n_estimators=100, random_state=42)
    model.fit(X, y)
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    return model

def load_model():
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, "rb") as f:
            return pickle.load(f)
    return train_model()

def predict_race(race_id: int) -> list:
    df = get_race_entries(race_id)
    if df is None or df.empty:
        return []

    model = load_model()
    df["win_rate"] = df["total_wins"] / (df["total_races"] + 1)
    df["jockey_top3_rate"] = df["jockey_top3"] / (df["jockey_races"] + 1)

    feature_cols = FEATURES + ["win_rate", "jockey_top3_rate"]
    X = df[feature_cols].fillna(0)

    if model:
        probs = model.predict_proba(X)[:, 1]
    else:
        probs = (
            df["current_rating"] / 100 * 0.5 +
            df["win_rate"] * 0.3 +
            df["jockey_top3_rate"] * 0.2
        ).values

    df["top3_probability"] = probs
    df = df.sort_values("top3_probability", ascending=False)

    return [
        {
            "gate_number": int(row["gate_number"]),
            "horse_name": row["horse_name"],
            "current_rating": int(row["current_rating"]),
            "top3_probability": round(float(row["top3_probability"]) * 100, 1),
            "win_rate_pct": round(float(row["win_rate"]) * 100, 1),
            "predicted_rank": i + 1
        }
        for i, (_, row) in enumerate(df.iterrows())
    ]

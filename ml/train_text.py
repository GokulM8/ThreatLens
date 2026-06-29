"""Trains the TF-IDF + Logistic Regression scam-text classifier used by
POST /api/analyze/content. Generates a synthetic dataset of legitimate
investor communications vs. investment-scam messages (no labeled public
dataset for Indian retail-investor scam text exists, so templated synthetic
generation — same approach as the URL pipeline — stands in for it).
"""
import os
import random
import sys

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import train_test_split

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTIFACT_PATH = os.path.join(ROOT_DIR, "backend", "ml", "artifacts", "text_model.pkl")

LEGIT_TEMPLATES = [
    "Your monthly account statement for {month} {year} is now available in your registered email.",
    "NSE Circular: Trading hours will remain unchanged on the upcoming {holiday} holiday.",
    "Quarterly results for {quarter} FY{year} have been published on the BSE website.",
    "Dear investor, your SIP installment of Rs. {amount} for {month} has been processed successfully.",
    "This is to inform you that your demat account KYC is up to date as per SEBI guidelines.",
    "{broker} Research: Our latest market outlook report for {month} is attached for your reference.",
    "Your order to buy {qty} shares of {stock} has been executed at the prevailing market price.",
    "Reminder: The annual general meeting of {stock} Ltd. will be held on {day} {month}.",
    "Your contract note for trades executed on {day} {month} {year} has been generated.",
    "SEBI has issued an investor awareness advisory regarding unregistered investment advisors.",
    "Your portfolio valuation as of {day} {month} is available for download from the dashboard.",
    "{broker} customer support: Your support ticket #{amount} has been resolved.",
]

SCAM_TEMPLATES = [
    "Guaranteed {pct}% returns in just {days} days! Join our exclusive trading group on WhatsApp now.",
    "URGENT: Your demat account will be suspended unless you verify immediately at the link below.",
    "SEBI registered expert reveals a secret stock tip - act now before market opens!",
    "Double your money with our risk-free trading strategy. Limited slots available, hurry up!",
    "Join our private Telegram group for guaranteed multibagger stock tips, {pct}% profit assured.",
    "Congratulations! You have been selected for a government scheme bonus of Rs.{amount}. Click here to claim.",
    "Your KYC is incomplete, share your OTP now to avoid permanent account block.",
    "Insider tip: {stock} is about to become a 100x return jackpot stock. Buy before it's too late.",
    "We are an official partner of {broker}, send your bank details to receive your assured profit.",
    "Last chance to join our no-risk IPO allotment guarantee scheme, expires today!",
    "Become a crorepati in {days} days with our 100% profit guarantee trading bot, dm me now.",
    "RBI approved investment scheme offering {pct}% monthly return, act immediately before deadline.",
]

FILLERS = {
    "month": ["January", "February", "March", "April", "May", "June", "July", "August"],
    "year": ["2024", "2025", "2026"],
    "holiday": ["Republic Day", "Diwali", "Holi", "Independence Day"],
    "quarter": ["Q1", "Q2", "Q3", "Q4"],
    "amount": [str(random.randint(500, 50000)) for _ in range(20)],
    "broker": ["Zerodha", "Groww", "Upstox", "AngelOne", "ICICI Direct", "HDFC Securities"],
    "qty": [str(n) for n in range(1, 200)],
    "stock": ["Reliance", "TCS", "Infosys", "HDFC Bank", "Tata Motors", "Adani Power"],
    "day": [str(n) for n in range(1, 28)],
    "pct": [str(n) for n in range(20, 500, 10)],
    "days": [str(n) for n in (3, 5, 7, 10, 15, 30)],
}


def _fill(template: str) -> str:
    out = template
    for key, options in FILLERS.items():
        if f"{{{key}}}" in out:
            out = out.replace(f"{{{key}}}", random.choice(options))
    return out


def generate_dataset(n_per_class: int = 300):
    texts, labels = [], []
    for _ in range(n_per_class):
        texts.append(_fill(random.choice(LEGIT_TEMPLATES)))
        labels.append(0)
    for _ in range(n_per_class):
        texts.append(_fill(random.choice(SCAM_TEMPLATES)))
        labels.append(1)
    return texts, labels


def train():
    texts, labels = generate_dataset()
    X_train, X_test, y_train, y_test = train_test_split(
        texts, labels, test_size=0.2, random_state=42, stratify=labels
    )

    vectorizer = TfidfVectorizer(max_features=3000, ngram_range=(1, 2), lowercase=True)
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)

    model = LogisticRegression(class_weight="balanced", max_iter=1000)
    model.fit(X_train_vec, y_train)

    y_pred = model.predict(X_test_vec)
    y_proba = model.predict_proba(X_test_vec)[:, 1]
    metrics = {
        "accuracy": round(accuracy_score(y_test, y_pred), 4),
        "precision": round(precision_score(y_test, y_pred), 4),
        "recall": round(recall_score(y_test, y_pred), 4),
        "roc_auc": round(roc_auc_score(y_test, y_proba), 4),
    }
    print("Text model metrics:", metrics)

    os.makedirs(os.path.dirname(ARTIFACT_PATH), exist_ok=True)
    joblib.dump({"vectorizer": vectorizer, "model": model, "metrics": metrics}, ARTIFACT_PATH)
    print(f"Saved text model to {ARTIFACT_PATH}")
    return metrics


if __name__ == "__main__":
    train()

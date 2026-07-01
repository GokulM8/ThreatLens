"""Trains the TF-IDF + Logistic Regression scam-text classifier used by
POST /api/analyze/content.

Key improvements over v1:
  - 52 templates per class (vs 12) with genuine linguistic variety: formal/
    informal, Hindi-English code-switching, different scam tactics, different
    legitimate communication types.
  - Template-level train/test split: 13 templates per class are held out
    entirely. Test examples come from phrasings the model never saw during
    training — this tests generalization, not filler substitution.
  - Word + character n-gram TF-IDF with sublinear_tf so the model learns
    character-level spelling patterns (common in scam messages) in addition
    to word-level signals.
"""
import os
import random

import scipy.sparse as sp
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, confusion_matrix, precision_score, recall_score, roc_auc_score,
)

random.seed(42)

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTIFACT_PATH = os.path.join(ROOT_DIR, "backend", "ml", "artifacts", "text_model.pkl")

# ---------------------------------------------------------------------------
# Filler pools
# ---------------------------------------------------------------------------
FILLERS = {
    "month": ["January", "February", "March", "April", "May", "June",
              "July", "August", "September", "October", "November", "December"],
    "year": ["2024", "2025", "2026"],
    "holiday": ["Republic Day", "Diwali", "Holi", "Independence Day",
                "Gandhi Jayanti", "Eid", "Christmas", "Pongal"],
    "quarter": ["Q1", "Q2", "Q3", "Q4"],
    "amount": [str(v) for v in [500, 1000, 1500, 2500, 5000, 7500, 10000,
                                 15000, 25000, 50000, 75000, 100000]],
    "broker": ["Zerodha", "Groww", "Upstox", "AngelOne", "ICICI Direct",
               "HDFC Securities", "Kotak Securities", "Sharekhan",
               "Motilal Oswal", "5Paisa", "Paytm Money", "Axis Direct"],
    "qty": [str(n) for n in [1, 5, 10, 25, 50, 100, 150, 200, 500]],
    "stock": ["Reliance", "TCS", "Infosys", "HDFC Bank", "Tata Motors",
              "Adani Power", "Wipro", "ITC", "L&T", "Bajaj Finance",
              "Asian Paints", "Sun Pharma", "Maruti", "Titan"],
    "day": [str(n) for n in range(1, 29)],
    "pct": [str(n) for n in range(20, 500, 10)],
    "days": ["3", "5", "7", "10", "14", "15", "21", "30"],
    "ticket": [str(n) for n in range(100000, 999999)],
    "isin": ["INE002A01018", "INE009A01021", "INE467B01029", "INE040A01034"],
    "nav": [f"{round(random.uniform(10, 500), 2)}" for _ in range(10)],
    "exchange": ["NSE", "BSE"],
    "fund": ["Nippon India Bluechip", "SBI Nifty 50 Index",
             "Mirae Asset Large Cap", "HDFC Flexi Cap"],
    "time": ["9:15 AM", "10:00 AM", "2:30 PM", "3:30 PM", "9:30 AM"],
    "name": ["Rahul", "Priya", "Amit", "Sunita", "Vijay", "Deepa"],
    "phone": ["98XXXXXXXX", "70XXXXXXXX", "80XXXXXXXX"],
}

# ---------------------------------------------------------------------------
# 52 LEGIT templates — formal investor communications
# ---------------------------------------------------------------------------
LEGIT_TEMPLATES = [
    # Account / statement notifications
    "Your monthly account statement for {month} {year} is now available in your registered email.",
    "Dear {name}, your demat account statement for {quarter} {year} has been emailed to your registered address.",
    "Your annual consolidated account statement for FY{year} is ready for download from the {broker} portal.",
    "The contract note for your trades on {day} {month} {year} has been generated and sent to your email.",
    "Your ledger balance as of {day} {month} {year} has been updated. Please login to view your account.",

    # SIP / mutual fund
    "Dear investor, your SIP installment of Rs. {amount} for {month} has been processed successfully.",
    "SIP auto-debit of Rs. {amount} for {fund} has been initiated for {month} {year}.",
    "Your mutual fund units for {fund} have been allotted. NAV applied: Rs. {nav}.",
    "Redemption request for {fund} has been processed. Amount of Rs. {amount} will be credited in 2-3 working days.",
    "Your SIP mandate for Rs. {amount} per month has been registered successfully with {broker}.",

    # Order / trade confirmations
    "Your order to buy {qty} shares of {stock} at market price has been executed on {exchange}.",
    "Sell order for {qty} shares of {stock} (ISIN: {isin}) executed successfully at {time}.",
    "Your limit order for {stock} has been cancelled as per your request.",
    "GTT order for {stock} has been triggered and executed. Please check your holdings.",
    "Square-off of your F&O position in {stock} futures has been completed.",

    # KYC / compliance
    "This is to inform you that your demat account KYC is up to date as per SEBI guidelines.",
    "Your PAN-Aadhaar linking status has been verified. No action required at this time.",
    "Reminder: Please complete your annual KYC re-verification before {day} {month} {year}.",
    "Your nominee details for demat account have been updated as per your request on {day} {month}.",
    "SEBI has made it mandatory to link your mobile number with your demat account by {month} {year}.",

    # Research / market updates
    "{broker} Research: Our latest market outlook report for {month} is attached for your reference.",
    "NSE Circular: Trading hours will remain unchanged on the upcoming {holiday} holiday.",
    "BSE Notice: Surveillance action has been initiated on the following securities. Please review.",
    "Quarterly results for {quarter} FY{year} for {stock} have been published on the BSE website.",
    "SEBI has issued an investor awareness advisory regarding unregistered investment advisors.",

    # IPO / corporate actions
    "Your IPO application for {stock} Ltd. has been submitted successfully. Allotment status will be updated.",
    "Reminder: The rights issue of {stock} closes on {day} {month} {year}. Please apply via your demat account.",
    "Dividend of Rs. {amount} per share for {stock} has been credited to your registered bank account.",
    "Bonus share allotment for {stock} in the ratio 1:1 has been credited to your demat account.",
    "The annual general meeting of {stock} Ltd. will be held on {day} {month} via video conferencing.",

    # Portfolio / valuation
    "Your portfolio valuation as of {day} {month} is available for download from the dashboard.",
    "Capital gains statement for FY{year} is now available. Please download for your ITR filing.",
    "Your unrealised P&L for the month of {month} has been updated. Login to {broker} to review.",
    "Tax loss harvesting opportunity detected in your portfolio. Please review at your convenience.",
    "Your margin pledge of {qty} shares of {stock} has been released as requested.",

    # Support / account management
    "{broker} customer support: Your support ticket #{ticket} has been resolved.",
    "Your bank account change request has been processed. New account will be active in 24 hours.",
    "Your {broker} account password has been reset. If you did not request this, contact support.",
    "Two-factor authentication has been enabled on your {broker} account for added security.",
    "Your registered email address has been updated as per your request. Please verify via the link sent.",

    # Regulatory / informational
    "SEBI reminder: Investors are advised to deal only with registered investment advisors and brokers.",
    "NSE has revised the circuit filter for {stock} to {pct}% with effect from {day} {month}.",
    "RBI has kept the repo rate unchanged at 6.5% in the latest monetary policy committee meeting.",
    "The T+1 settlement cycle is now applicable for all equity scrips on NSE and BSE.",
    "AMFI data: Net SIP inflows for {month} stood at Rs. {amount} crore, highest in the current FY.",

    # Tax / compliance reminders
    "Reminder: The last date to file your ITR for FY{year} is {day} {month} {year}.",
    "Your Form 15G/15H submission for FY{year} has been processed by {broker}.",
    "STT (Securities Transaction Tax) summary for {quarter} FY{year} is available in your tax reports.",
    "Short-term capital gains of Rs. {amount} have been computed for your portfolio in {quarter} FY{year}.",
    "Advance tax due date reminder: Please pay your advance tax installment before {day} {month} {year}.",

    # Hindi-English mixed (common in Indian investor communications)
    "Aapka demat account statement {month} {year} ke liye taiyar hai. Please login karein.",
    "Dear investor, {stock} ka dividend Rs. {amount} per share aapke bank account mein credit ho gaya hai.",
]

# ---------------------------------------------------------------------------
# 52 SCAM templates — investment fraud / phishing messages
# ---------------------------------------------------------------------------
SCAM_TEMPLATES = [
    # Guaranteed returns
    "Guaranteed {pct}% returns in just {days} days! Join our exclusive trading group on WhatsApp now.",
    "Double your money with our risk-free trading strategy. Limited slots available, hurry up!",
    "Earn Rs. {amount} daily with zero risk. Our proven system has {pct}% success rate. DM now.",
    "Join our premium investment club and get guaranteed {pct}% monthly returns. No experience needed!",
    "100% guaranteed profit every week. Our algo trading bot never loses. Subscribe now for Rs. {amount}.",

    # Insider tips / stock tips
    "SEBI registered expert reveals a secret stock tip - act now before market opens!",
    "Insider tip: {stock} is about to become a 100x return jackpot stock. Buy before it's too late.",
    "Confidential: Big operator is accumulating {stock}. This is your chance to make {pct}% in {days} days.",
    "Multibagger alert! {stock} will give {pct}% return in {days} days. Limited seats in our VIP group.",
    "Secret circuit breaker stock tip: {stock} will hit upper circuit tomorrow. Act NOW!",

    # Telegram / WhatsApp groups
    "Join our private Telegram group for guaranteed multibagger stock tips, {pct}% profit assured.",
    "Our WhatsApp group has made {pct}% profit this month. Join FREE before slots fill up.",
    "Ye opportunity sirf hamare secret Telegram channel pe available hai. Abhi join karo!",
    "Exclusive trading tips group — only {days} more spots left. Join WhatsApp now: {phone}.",
    "Hamara premium trading group mein aaj {pct}% profit hua. Aap bhi join karein, FREE registration.",

    # Account suspension / urgent threats
    "URGENT: Your demat account will be suspended unless you verify immediately at the link below.",
    "ALERT: Suspicious login detected on your {broker} account. Click here to secure it immediately.",
    "Your KYC is incomplete, share your OTP now to avoid permanent account block.",
    "NOTICE: Your trading account will be deactivated in {days} hours. Verify now to avoid suspension.",
    "Action required: Your {broker} account has been flagged. Click the link below within {days} hours.",

    # Fake prizes / government schemes
    "Congratulations! You have been selected for a government scheme bonus of Rs.{amount}. Click here to claim.",
    "You have won Rs. {amount} in the SEBI investor reward scheme. Collect your prize now.",
    "PM scheme: Rs. {amount} investment bonus credited to eligible investors. Claim yours today.",
    "RBI lucky draw winner: You have been selected to receive Rs. {amount}. Provide bank details to claim.",
    "Congratulations {name}! Your mobile number has won Rs. {amount} in the NSE anniversary lucky draw.",

    # Fake broker partnerships
    "We are an official partner of {broker}, send your bank details to receive your assured profit.",
    "Authorized {broker} sub-broker offering guaranteed {pct}% returns. Contact us today.",
    "{broker} ke saath hamare partnership se aap {pct}% monthly return paa sakte hain. Details ke liye contact karein.",
    "Official {broker} agent here. Invest Rs. {amount} and get {pct}% assured return in {days} days.",
    "I work at {broker} trading desk. I can give you insider tips. Join my private group for {pct}% monthly gains.",

    # Trading bot scams
    "Become a crorepati in {days} days with our 100% profit guarantee trading bot, dm me now.",
    "Our AI trading bot made {pct}% profit last month. Invest Rs. {amount} and watch it grow automatically.",
    "Automated trading robot — no skills needed. Rs. {amount} investment, {pct}% guaranteed monthly.",
    "Copy our expert traders automatically. {pct}% avg monthly returns. Deposit Rs. {amount} to start.",
    "Algo trading software that never fails. {pct}% returns every month. Get it for just Rs. {amount}.",

    # RBI / government fake schemes
    "RBI approved investment scheme offering {pct}% monthly return, act immediately before deadline.",
    "Government of India PM scheme: Invest Rs. {amount} and get Rs. {amount} doubled in {days} days.",
    "PMJDY special scheme: Eligible investors get {pct}% bonus on deposits. Apply before {day} {month}.",
    "RBI approved fixed deposit scheme with {pct}% interest per month. Limited period offer.",
    "Finance ministry approved scheme: Rs. {amount} investment returns Rs. {amount} in {days} days.",

    # IPO / listing scams
    "Last chance to join our no-risk IPO allotment guarantee scheme, expires today!",
    "Guaranteed IPO allotment for {stock} IPO. Pay Rs. {amount} processing fee. Limited slots.",
    "Pre-IPO shares of {stock} available at discounted price. Invest Rs. {amount} before listing.",
    "Unlisted shares of {stock} available. Guaranteed {pct}% profit on listing day. Contact now.",
    "{stock} IPO allotment guarantee — 100% assured. Pay Rs. {amount} to confirm your slot.",

    # Hindi-English mixed scam messages
    "Aapko Rs. {amount} ka instant profit guarantee hai. Abhi WhatsApp karein: {phone}.",
    "Bhai, mera trading group join karo. Is month {pct}% profit kiya. Kal ka tip free dunga.",
    "Sarkari yojana: Rs. {amount} invest karo aur {days} din mein double paao. Last date kal hai!",
    "Secret tip: {stock} kal upper circuit lagega. Abhi kharid lo, {pct}% pakka milega.",
    "Rs. {amount} lagao, {days} din mein {pct}% return guaranteed. Sirf 5 slots bache hain.",

    # Celebrity / influencer scams
    "Famous investor recommends this {days}-day scheme for {pct}% guaranteed returns. Join now.",
    "Shark Tank funded trading platform gives {pct}% monthly. Invest Rs. {amount} today, withdraw anytime.",
]

assert len(LEGIT_TEMPLATES) == 52, f"Expected 52 LEGIT templates, got {len(LEGIT_TEMPLATES)}"
assert len(SCAM_TEMPLATES) == 52, f"Expected 52 SCAM templates, got {len(SCAM_TEMPLATES)}"

# Hold out the last 13 templates per class (25%) for the test split.
# These templates are never seen during training — the model must generalize
# to genuinely new phrasings, not just new filler substitutions.
N_TEST_TEMPLATES = 13
TRAIN_LEGIT = LEGIT_TEMPLATES[:-N_TEST_TEMPLATES]
TEST_LEGIT = LEGIT_TEMPLATES[-N_TEST_TEMPLATES:]
TRAIN_SCAM = SCAM_TEMPLATES[:-N_TEST_TEMPLATES]
TEST_SCAM = SCAM_TEMPLATES[-N_TEST_TEMPLATES:]


class CombinedTfidf:
    """Fits word and char-wb TF-IDF vectorizers and concatenates their sparse
    outputs. Defined at module level so it survives joblib serialization."""

    def __init__(self, word_vec, char_vec):
        self.word = word_vec
        self.char = char_vec

    def fit_transform(self, texts):
        W = self.word.fit_transform(texts)
        C = self.char.fit_transform(texts)
        return sp.hstack([W, C])

    def transform(self, texts):
        W = self.word.transform(texts)
        C = self.char.transform(texts)
        return sp.hstack([W, C])


def _fill(template: str) -> str:
    out = template
    for key, options in FILLERS.items():
        if f"{{{key}}}" in out:
            out = out.replace(f"{{{key}}}", random.choice(options))
    return out


def _generate_from(legit_pool, scam_pool, n_per_template: int):
    texts, labels = [], []
    for t in legit_pool:
        for _ in range(n_per_template):
            texts.append(_fill(t))
            labels.append(0)
    for t in scam_pool:
        for _ in range(n_per_template):
            texts.append(_fill(t))
            labels.append(1)
    return texts, labels


def train():
    # 20 examples per train template, 25 per test template (smaller test pool)
    X_train, y_train = _generate_from(TRAIN_LEGIT, TRAIN_SCAM, n_per_template=20)
    X_test, y_test = _generate_from(TEST_LEGIT, TEST_SCAM, n_per_template=25)

    print(f"Train: {len(X_train)} examples from {len(TRAIN_LEGIT)+len(TRAIN_SCAM)} templates")
    print(f"Test : {len(X_test)} examples from {len(TEST_LEGIT)+len(TEST_SCAM)} held-out templates")
    print("(Test templates are entirely excluded from training — tests phrasing generalization)")

    # Word n-grams + char n-grams combined so the model captures both semantic
    # keywords ("guaranteed returns", "WhatsApp group") and character-level
    # patterns ("!!", "Rs.", ALL_CAPS, OTP).
    word_tfidf = TfidfVectorizer(
        analyzer="word",
        ngram_range=(1, 2),
        max_features=8000,
        sublinear_tf=True,
        strip_accents="unicode",
        min_df=1,
    )
    char_tfidf = TfidfVectorizer(
        analyzer="char_wb",
        ngram_range=(2, 4),
        max_features=5000,
        sublinear_tf=True,
        min_df=1,
    )
    combined = CombinedTfidf(word_tfidf, char_tfidf)
    X_train_vec = combined.fit_transform(X_train)
    X_test_vec = combined.transform(X_test)

    model = LogisticRegression(C=1.0, class_weight="balanced", max_iter=1000, random_state=42)
    model.fit(X_train_vec, y_train)

    y_pred = model.predict(X_test_vec)
    y_proba = model.predict_proba(X_test_vec)[:, 1]
    tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()
    metrics = {
        "accuracy": round(accuracy_score(y_test, y_pred), 4),
        "precision": round(precision_score(y_test, y_pred), 4),
        "recall": round(recall_score(y_test, y_pred), 4),
        "roc_auc": round(roc_auc_score(y_test, y_proba), 4),
        "false_positive_rate": round(float(fp) / float(fp + tn), 4) if (fp + tn) > 0 else 0.0,
        "eval_note": "template-level holdout: test templates never seen during training",
    }
    print("Text model metrics (template-level holdout):", metrics)

    os.makedirs(os.path.dirname(ARTIFACT_PATH), exist_ok=True)
    joblib.dump({
        "word_vectorizer": word_tfidf,
        "char_vectorizer": char_tfidf,
        "model": model,
        "metrics": metrics,
    }, ARTIFACT_PATH)
    print(f"Saved text model to {ARTIFACT_PATH}")
    return metrics


if __name__ == "__main__":
    train()

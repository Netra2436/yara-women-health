# ✅ 1. Import Libraries
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from xgboost import XGBClassifier
from sklearn.metrics import classification_report, accuracy_score
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense
from tensorflow.keras.optimizers import Adam
import tensorflow as tf

# ✅ 2. Load Dataset

df = pd.read_csv("Full_new.csv")

# ✅ 3. Clean Column Names & Drop Irrelevant Columns
df.columns = df.columns.str.strip().str.replace('\s+', ' ', regex=True)
df = df.drop(columns=['Sl. No', 'Patient File No.'], errors='ignore')

# ✅ 4. Select Easily Observable Features
selected_cols = [
    'Age (yrs)', 'Weight (Kg)', 'Height(Cm)', 'BMI', 'Blood Group',
    'Cycle(R/I)', 'Cycle length(days)', 'Marraige Status (Yrs)',
    'Pregnant(Y/N)', 'No. of aborptions', 'Hip(inch)', 'Waist(inch)',
    'Weight gain(Y/N)', 'hair growth(Y/N)', 'Skin darkening (Y/N)',
    'Hair loss(Y/N)', 'Pimples(Y/N)', 'Fast food (Y/N)', 
    'Reg.Exercise(Y/N)', 'PCOS (Y/N)'
]
df = df[selected_cols].dropna()

# ✅ 5. Encode Binary Categoricals
for col in df.columns:
    if df[col].nunique() == 2 and df[col].dtype == object:
        df[col] = LabelEncoder().fit_transform(df[col])

# ✅ 6. Split Features & Target
X = df.drop(columns=['PCOS (Y/N)'])
y = df['PCOS (Y/N)']

# ✅ 7. Scale Features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# ✅ 8. Train-Test Split
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=42
)

# ✅ 9. Train Models
## Random Forest
rf = RandomForestClassifier(n_estimators=100, random_state=42)
rf.fit(X_train, y_train)
rf_preds = rf.predict(X_test)

## XGBoost
xgb = XGBClassifier(use_label_encoder=False, eval_metric='logloss', random_state=42)
xgb.fit(X_train, y_train)
xgb_preds = xgb.predict(X_test)

## Deep Neural Network (DNN)
dnn = Sequential([
    Dense(64, activation='relu', input_shape=(X_train.shape[1],)),
    Dense(32, activation='relu'),
    Dense(1, activation='sigmoid')
])
dnn.compile(optimizer=Adam(0.001), loss='binary_crossentropy', metrics=['accuracy'])
dnn.fit(X_train, y_train, epochs=50, batch_size=8, verbose=0)
dnn_preds = (dnn.predict(X_test) > 0.5).astype(int)

# ✅ 10. Voting Ensemble (Hard)
voting = VotingClassifier(estimators=[
    ('rf', rf), ('xgb', xgb)
], voting='hard')
voting.fit(X_train, y_train)
voting_preds = voting.predict(X_test)

# ✅ 11. Evaluate Models
print("\n🎯 Random Forest:\n", classification_report(y_test, rf_preds))
print("\n🎯 XGBoost:\n", classification_report(y_test, xgb_preds))
print("\n🎯 DNN:\n", classification_report(y_test, dnn_preds))
print("\n🎯 Voting Ensemble (RF + XGB):\n", classification_report(y_test, voting_preds))

import pickle

with open("model.pkl", "wb") as f:
    pickle.dump(voting, f)

with open("scaler.pkl", "wb") as f:
    pickle.dump(scaler, f)
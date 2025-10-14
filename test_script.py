import pandas as pd

# Load sample data
df = pd.read_csv('sample_sales.csv')
print(f'Loaded {len(df)} records')
print('\nFirst 5 records:')
print(df.head())

# Filter for amounts > 1000
filtered = df[df['amount'] > 1000]
print(f'\nFiltered to {len(filtered)} records with amount > 1000')
print('\nFiltered data:')
print(filtered)
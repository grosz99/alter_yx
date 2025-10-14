"""
NCC DATA PROCESSING - INDUSTRIAL GOODS ANALYSIS
Fixed version with case-insensitive column handling
"""

import pandas as pd
import numpy as np
from pathlib import Path

# Configuration
INPUT_FILE = "final_ncc_data.csv"
OUTPUT_DIR = "output"
OUTPUT_FILE = f"{OUTPUT_DIR}/ncc_analysis_results.xlsx"

def main():
    print("=" * 60)
    print("NCC DATA PROCESSING - INDUSTRIAL GOODS ANALYSIS")
    print("=" * 60)

    try:
        # Load data
        print(f"\nLoading data from {INPUT_FILE}...")
        df = pd.read_csv(INPUT_FILE)

        # ✅ FIX: Normalize column names to lowercase for case-insensitive processing
        df.columns = df.columns.str.lower().str.strip()

        print(f"✓ Successfully loaded {len(df)} records")
        print(f"✓ Columns: {list(df.columns)}")

        # Validate required columns (now using lowercase)
        required_cols = ['sector', 'region', 'month']
        missing = [c for c in required_cols if c not in df.columns]

        if missing:
            print(f"\nError: Missing required columns: {missing}")
            print(f"Available columns: {list(df.columns)}")
            return 1

        print(f"\n✓ All required columns present: {required_cols}")

        # Data Processing Examples
        print("\n" + "=" * 60)
        print("DATA ANALYSIS")
        print("=" * 60)

        # 1. Analysis by Sector
        print("\n1. NCC Summary by Sector:")
        sector_summary = df.groupby('sector').agg({
            'ncc': ['sum', 'mean', 'count'],
            'client': 'nunique'
        }).round(2)
        sector_summary.columns = ['Total_NCC', 'Avg_NCC', 'Project_Count', 'Unique_Clients']
        print(sector_summary.to_string())

        # 2. Analysis by Region
        print("\n2. NCC Summary by Region:")
        region_summary = df.groupby('region').agg({
            'ncc': ['sum', 'mean', 'count']
        }).round(2)
        region_summary.columns = ['Total_NCC', 'Avg_NCC', 'Project_Count']
        print(region_summary.to_string())

        # 3. Monthly Trend Analysis
        print("\n3. Monthly Trend Analysis:")
        monthly_summary = df.groupby('month').agg({
            'ncc': ['sum', 'count']
        }).round(2)
        monthly_summary.columns = ['Total_NCC', 'Project_Count']
        print(monthly_summary.to_string())

        # 4. Top Clients by NCC
        print("\n4. Top 10 Clients by Total NCC:")
        client_summary = df.groupby('client')['ncc'].sum().sort_values(ascending=False).head(10)
        print(client_summary.to_string())

        # Save results to Excel
        Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)

        with pd.ExcelWriter(OUTPUT_FILE, engine='openpyxl') as writer:
            sector_summary.to_excel(writer, sheet_name='By_Sector')
            region_summary.to_excel(writer, sheet_name='By_Region')
            monthly_summary.to_excel(writer, sheet_name='By_Month')
            client_summary.to_frame('Total_NCC').to_excel(writer, sheet_name='Top_Clients')
            df.to_excel(writer, sheet_name='Raw_Data', index=False)

        print(f"\n✓ Results saved to {OUTPUT_FILE}")

        print("\n" + "=" * 60)
        print("PROCESSING COMPLETE!")
        print("=" * 60)

        return 0

    except FileNotFoundError:
        print(f"\nError: File not found - {INPUT_FILE}")
        print("Please ensure the CSV file exists in the current directory.")
        return 1

    except Exception as e:
        print(f"\nError: An unexpected error occurred: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    exit(main())

import sys
import json
import traceback
import requests
from bs4 import BeautifulSoup
import pandas as pd
import plotly.express as px
import numpy as np

def fetch_html_content(url):
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        print(f"Error fetching URL {url}: {e}", file=sys.stderr)
        raise

def extract_numeric(value):
    import re
    match = re.search(r'\d+(\.\d+)?', value)
    if match:
        return float(match.group())
    else:
        print(f"Error extracting numeric value from: {value}", file=sys.stderr)
        return 0.0

def analyze_cyclists(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')
    cyclists = []

    for row in soup.find_all('tr'):
        cols = row.find_all('td')
        if len(cols) >= 7:
            try:
                name = cols[1].text.strip()
                team = cols[2].text.strip()
                role = cols[3].text.strip()
                cost = extract_numeric(cols[4].text)
                ownership = extract_numeric(cols[5].text)
                points = extract_numeric(cols[6].text)
                
                cost_per_point = "Infinity" if points == 0 else cost / points
                
                cyclists.append({
                    'name': name,
                    'team': team,
                    'role': role,
                    'cost': cost,
                    'ownership': ownership,
                    'points': points,
                    'cost_per_point': cost_per_point
                })
            except Exception as e:
                print(f"Error processing row: {e}", file=sys.stderr)

    if not cyclists:
        print("No cyclists data extracted. Check if the page structure has changed.", file=sys.stderr)
    
    return cyclists

def numpy_to_python(obj):
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, pd.Series):
        return obj.tolist()
    elif isinstance(obj, pd.DataFrame):
        return obj.to_dict(orient='records')
    return obj
    
def create_top_50_efficiency_data(cyclists):
    top_50_efficiency = sorted(
        [c for c in cyclists if c['cost_per_point'] != "Infinity"],
        key=lambda x: x['cost_per_point']
    )[:50]
    
    return [{
        'name': c['name'],
        'cost_per_point': c['cost_per_point'],
        'role': c['role'],
        'points': c['points'],
        'cost': c['cost']
    } for c in top_50_efficiency]

def main():
    url = "https://www.velogames.com/spain/2024/riders.php"
    
    try:
        print(f"Fetching data from {url}", file=sys.stderr)
        html_content = fetch_html_content(url)
        
        print("Analyzing cyclist data", file=sys.stderr)
        cyclists = analyze_cyclists(html_content)
        
        if not cyclists:
            raise ValueError("No cyclist data was extracted")

        print(f"Extracted data for {len(cyclists)} cyclists", file=sys.stderr)

        top_50_data = create_top_50_efficiency_data(cyclists)

        print("Preparing output", file=sys.stderr)
        output = {
            'cyclists': cyclists,
            'top_50_efficiency': top_50_data
        }
        
        print("Writing JSON output", file=sys.stderr)
        json.dump(output, sys.stdout, default=numpy_to_python, ensure_ascii=False, indent=2)
        
        print("Script completed successfully", file=sys.stderr)
        sys.exit(0)
        
    except Exception as e:
        print(f"An error occurred: {str(e)}", file=sys.stderr)
        print("Traceback:", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()

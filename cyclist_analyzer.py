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
                
                cyclists.append({
                    'name': name,
                    'team': team,
                    'role': role,
                    'cost': cost,
                    'ownership': ownership,
                    'points': points,
                    'cost_per_point': cost / points if points > 0 else float('inf')
                })
            except Exception as e:
                print(f"Error processing row: {e}", file=sys.stderr)

    if not cyclists:
        print("No cyclists data extracted. Check if the page structure has changed.", file=sys.stderr)
    
    return cyclists

def create_top_50_efficiency_chart(cyclists):
    if not cyclists:
        print("No cyclists data available for chart creation.", file=sys.stderr)
        return None

    top_50_efficiency = sorted(cyclists, key=lambda x: x['cost_per_point'])[:50]
    df = pd.DataFrame(top_50_efficiency)
    
    fig = px.bar(df, x='name', y='cost_per_point', color='role',
                 title='Top 50 Cyclists by Cost Efficiency (Lower is Better)',
                 labels={'cost_per_point': 'Cost per Point', 'name': 'Cyclist Name'},
                 hover_data=['points', 'cost'])
    
    fig.update_layout(
        xaxis_tickangle=-45,
        xaxis_title="Cyclist Name",
        yaxis_title="Cost per Point",
        legend_title="Rider Role",
        font=dict(size=10),
    )
    
    return fig.to_dict()

def calculate_statistics(cyclists):
    total_cyclists = len(cyclists)
    total_cost = sum(c['cost'] for c in cyclists)
    total_points = sum(c['points'] for c in cyclists)
    avg_cost = total_cost / total_cyclists if total_cyclists > 0 else 0
    avg_points = total_points / total_cyclists if total_cyclists > 0 else 0

    role_stats = {}
    for cyclist in cyclists:
        role = cyclist['role']
        if role not in role_stats:
            role_stats[role] = {'count': 0, 'total_cost': 0, 'total_points': 0}
        role_stats[role]['count'] += 1
        role_stats[role]['total_cost'] += cyclist['cost']
        role_stats[role]['total_points'] += cyclist['points']

    for role, stats in role_stats.items():
        stats['avg_cost'] = stats['total_cost'] / stats['count']
        stats['avg_points'] = stats['total_points'] / stats['count']

    return {
        'total_cyclists': total_cyclists,
        'total_cost': total_cost,
        'total_points': total_points,
        'avg_cost': avg_cost,
        'avg_points': avg_points,
        'role_stats': role_stats
    }
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

def main():
    url = "https://www.velogames.com/spain/2024/riders.php"
    
    try:
        print(f"Fetching data from {url}", file=sys.stderr)
        html_content = fetch_html_content(url)
        
        print("Analyzing cyclist data", file=sys.stderr)
        cyclists = analyze_cyclists(html_content)
        
        if not cyclists:
            raise ValueError("No cyclist data was extracted")

        print("Creating top 50 efficiency chart", file=sys.stderr)
        chart_data = create_top_50_efficiency_chart(cyclists)
        
        print("Calculating statistics", file=sys.stderr)
        stats = calculate_statistics(cyclists)
        
        print("Preparing output", file=sys.stderr)
        output = {
            'cyclists': cyclists,
            'top_50_chart': chart_data,
            'statistics': stats
        }
        
        print("Writing JSON output", file=sys.stderr)
        json.dump(output, sys.stdout, default=numpy_to_python, ensure_ascii=False, indent=2)
        
        print("Script completed successfully", file=sys.stderr)
        sys.exit(0)  # Explicitly exit with status 0 on success
        
    except Exception as e:
        print(f"An error occurred: {str(e)}", file=sys.stderr)
        print("Traceback:", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)  # Explicitly exit with status 1 on error

if __name__ == '__main__':
    main()

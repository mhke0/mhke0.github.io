import sys
import json
import requests
from bs4 import BeautifulSoup
import pandas as pd
import plotly.express as px

def fetch_html_content(url):
    response = requests.get(url)
    response.raise_for_status()
    return response.text

def extract_numeric(value):
    import re
    return float(re.search(r'\d+(\.\d+)?', value).group())

def analyze_cyclists(html_content, base_url):
    soup = BeautifulSoup(html_content, 'html.parser')
    cyclists = []

    for row in soup.find_all('tr'):
        cols = row.find_all('td')
        if len(cols) >= 7:
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

    return cyclists

def create_top_50_efficiency_chart(cyclists):
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

def main():
    url = "https://www.velogames.com/spain/2024/riders.php"
    
    try:
        html_content = fetch_html_content(url)
        cyclists = analyze_cyclists(html_content, url)
        
        # Create top 50 efficiency chart
        chart_data = create_top_50_efficiency_chart(cyclists)
        
        # Prepare data for JSON output
        output = {
            'cyclists': cyclists,
            'top_50_chart': chart_data
        }
        
        # Print JSON output
        print(json.dumps(output))
        
    except requests.RequestException as e:
        print(json.dumps({"error": f"An error occurred while fetching the data: {str(e)}"}), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": f"An unexpected error occurred: {str(e)}"}), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
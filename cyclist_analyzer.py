import sys
import json
import traceback
import requests
from bs4 import BeautifulSoup
import pandas as pd
import plotly.express as px
import numpy as np
import pulp
import io
import contextlib
import os
from datetime import datetime, timedelta


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

def fetch_league_scores():
    url = "https://www.velogames.com/spain/2024/leaguescores.php?league=764413216"
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')

    teams = []
    for li in soup.select('#users .list li'):
        team_name = li.select_one('h3.name a').text.strip()
        points = int(li.select_one('p.born b').text.strip())
        teams.append({"name": team_name, "points": points})

    # Sort teams by points in descending order
    teams.sort(key=lambda x: x['points'], reverse=True)

    return teams

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
    
def select_dream_team_optimized(cyclists):
    # Print input data summary
    total_cyclists = len(cyclists)
    sprinters = sum(1 for c in cyclists if c['role'] == 'Sprinter')
    all_rounders = sum(1 for c in cyclists if c['role'] == 'All Rounder')
    climbers = sum(1 for c in cyclists if c['role'] == 'Climber')
    unclassed = sum(1 for c in cyclists if c['role'] == 'Unclassed')
    print(f"Total cyclists: {total_cyclists}", file=sys.stderr)
    print(f"Total Sprinters: {sprinters}", file=sys.stderr)
    print(f"Total All-Rounders: {all_rounders}", file=sys.stderr)
    print(f"Total Climbers: {climbers}", file=sys.stderr)
    print(f"Total Unclassed: {unclassed}", file=sys.stderr)

    # Create the linear programming problem
    prob = pulp.LpProblem("Dream Team Selection", pulp.LpMaximize)

    # Create binary variables for each cyclist
    cyclist_vars = pulp.LpVariable.dicts("Cyclist", 
                                         ((c['name'], c['role']) for c in cyclists), 
                                         cat='Binary')

    # Objective function: maximize total points
    prob += pulp.lpSum(cyclist['points'] * cyclist_vars[cyclist['name'], cyclist['role']] 
                       for cyclist in cyclists)

    # Constraints
    constraints = [
        ("Total cyclists", pulp.lpSum(cyclist_vars) == 9),
        ("Maximum cost", pulp.lpSum(cyclist['cost'] * cyclist_vars[cyclist['name'], cyclist['role']] 
                                    for cyclist in cyclists) <= 100),
        ("Sprinters", pulp.lpSum(cyclist_vars[cyclist['name'], cyclist['role']] 
                                 for cyclist in cyclists if cyclist['role'] == 'Sprinter') >= 1),
        ("All-Rounders", pulp.lpSum(cyclist_vars[cyclist['name'], cyclist['role']] 
                                    for cyclist in cyclists if cyclist['role'] == 'All Rounder') >= 2),
        ("Climbers", pulp.lpSum(cyclist_vars[cyclist['name'], cyclist['role']] 
                                for cyclist in cyclists if cyclist['role'] == 'Climber') >= 2),
        ("Unclassed", pulp.lpSum(cyclist_vars[cyclist['name'], cyclist['role']] 
                                 for cyclist in cyclists if cyclist['role'] == 'Unclassed') >= 3)
    ]

    # Add constraints to the problem
    for name, constraint in constraints:
        prob += constraint, name

    # Print problem formulation
    print("Problem formulation:", file=sys.stderr)
    print(prob, file=sys.stderr)

    # Solve the problem
    solver = pulp.PULP_CBC_CMD(msg=True)  # Enable solver output
    prob.solve(solver)

    # Check if a solution was found
    if pulp.LpStatus[prob.status] == "Optimal":
        # Extract the solution
        dream_team = []
        total_points = 0
        total_cost = 0
        role_count = {'All Rounder': 0, 'Climber': 0, 'Sprinter': 0, 'Unclassed': 0, 'Other': 0}

        for cyclist in cyclists:
            if cyclist_vars[cyclist['name'], cyclist['role']].value() == 1:
                dream_team.append(cyclist)
                total_points += cyclist['points']
                total_cost += cyclist['cost']
                if cyclist['role'] in role_count:
                    role_count[cyclist['role']] += 1
                else:
                    role_count['Other'] += 1

        print("Dream Team:", file=sys.stderr)
        for rider in dream_team:
            print(f"{rider['name']} - Points: {rider['points']} - Cost: {rider['cost']} - Role: {rider['role']}", file=sys.stderr)
        print(f"Total Points: {total_points}", file=sys.stderr)
        print(f"Total Cost: {total_cost}", file=sys.stderr)
        print(f"Role Distribution: {role_count}", file=sys.stderr)

        return dream_team, total_points, total_cost
    else:
        print(f"No feasible dream team found. Status: {pulp.LpStatus[prob.status]}", file=sys.stderr)
        
        # Check which constraints are violated
        print("Checking constraints:", file=sys.stderr)
        for name, constraint in constraints:
            print(f"{name}: {'Satisfied' if constraint.value() else 'Violated'}", file=sys.stderr)
        
        return None, 0, 0



def load_existing_data(filename):
    try:
        with open(filename, 'r') as f:
            data = json.load(f)
        # Ensure all cyclists have a pointHistory
        for cyclist in data['cyclists']:
            if 'pointHistory' not in cyclist:
                cyclist['pointHistory'] = []
        return data
    except FileNotFoundError:
        return {'cyclists': [], 'top_50_efficiency': [], 'league_scores': [], 'dream_team': None, 'last_update': None}

def update_historical_data(existing_data, new_cyclists):
    today = datetime.now().strftime('%Y-%m-%d')
    yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
    
    # If we haven't updated today, move yesterday's data to historical
    if existing_data.get('last_update') != today:
        for cyclist in existing_data['cyclists']:
            if 'pointHistory' not in cyclist:
                cyclist['pointHistory'] = []
            cyclist['pointHistory'].append({'date': yesterday, 'points': cyclist['points']})
            # Keep only the last 30 days of historical data
            cyclist['pointHistory'] = cyclist['pointHistory'][-30:]
    
    # Update with new data
    for new_cyclist in new_cyclists:
        existing_cyclist = next((c for c in existing_data['cyclists'] if c['name'] == new_cyclist['name']), None)
        
        if existing_cyclist:
            # Update existing cyclist's current data
            existing_cyclist.update({
                'team': new_cyclist['team'],
                'role': new_cyclist['role'],
                'cost': new_cyclist['cost'],
                'points': new_cyclist['points'],
                'ownership': new_cyclist['ownership'],
                'cost_per_point': new_cyclist['cost_per_point']
            })
            if 'pointHistory' not in existing_cyclist:
                existing_cyclist['pointHistory'] = []
        else:
            # Add new cyclist
            new_cyclist['pointHistory'] = []
            existing_data['cyclists'].append(new_cyclist)
    
    # Remove cyclists that are no longer present in the new data
    existing_data['cyclists'] = [c for c in existing_data['cyclists'] if any(nc['name'] == c['name'] for nc in new_cyclists)]
    
    # Update the last update timestamp
    existing_data['last_update'] = today
    
    return existing_data

def main():
    cyclist_url = "https://www.velogames.com/spain/2024/riders.php"
    output_file = "cyclist-data.json"
    
    try:
        print("Loading existing data", file=sys.stderr)
        existing_data = load_existing_data(output_file)

        print(f"Fetching new cyclist data from {cyclist_url}", file=sys.stderr)
        html_content = fetch_html_content(cyclist_url)
        
        print("Analyzing new cyclist data", file=sys.stderr)
        new_cyclists = analyze_cyclists(html_content)
        
        if not new_cyclists:
            raise ValueError("No new cyclist data was extracted")

        print(f"Extracted data for {len(new_cyclists)} cyclists", file=sys.stderr)

        print("Updating historical data", file=sys.stderr)
        updated_data = update_historical_data(existing_data, new_cyclists)

        print("Creating top 50 efficiency data", file=sys.stderr)
        updated_data['top_50_efficiency'] = create_top_50_efficiency_data(updated_data['cyclists'])

        print("Fetching league scores", file=sys.stderr)
        updated_data['league_scores'] = fetch_league_scores()

        print("Selecting dream team (optimized)", file=sys.stderr)
        dream_team, total_points, total_cost = select_dream_team_optimized(updated_data['cyclists'])
        
        if dream_team:
            updated_data['dream_team'] = {
                'riders': [
                    {
                        'name': rider['name'],
                        'role': rider['role'],
                        'cost': rider['cost'],
                        'points': rider['points'],
                        'pointHistory': rider['pointHistory']
                    } for rider in dream_team
                ],
                'total_points': total_points,
                'total_cost': total_cost
            }
        else:
            updated_data['dream_team'] = None

        print(f"Current working directory: {os.getcwd()}", file=sys.stderr)
        try:
            print("Writing updated JSON output to file", file=sys.stderr)
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(updated_data, f, default=numpy_to_python, ensure_ascii=False, indent=2)
            
            print(f"Script completed successfully. Output saved to {output_file}", file=sys.stderr)
        except IOError as e:
            print(f"Error writing to file: {e}", file=sys.stderr)
        except Exception as e:
            print(f"Unexpected error while writing file: {e}", file=sys.stderr)
    except Exception as e:
        print(f"An error occurred: {str(e)}", file=sys.stderr)
        print("Traceback:", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()


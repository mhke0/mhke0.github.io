import sys
import json
import traceback
import requests
from bs4 import BeautifulSoup
import pandas as pd
import plotly.express as px
import numpy as np
import pulp


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
import itertools


def select_dream_team_optimized(cyclists):
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
    # Total cost must be 100 or less
    prob += pulp.lpSum(cyclist['cost'] * cyclist_vars[cyclist['name'], cyclist['role']] 
                       for cyclist in cyclists) <= 100

    # Total number of cyclists must be 9
    prob += pulp.lpSum(cyclist_vars) == 9

    # Role constraints
    prob += pulp.lpSum(cyclist_vars[c['name'], c['role']] for c in cyclists if c['role'] == 'Climber') == 2
    prob += pulp.lpSum(cyclist_vars[c['name'], c['role']] for c in cyclists if c['role'] == 'All-rounder') == 2
    prob += pulp.lpSum(cyclist_vars[c['name'], c['role']] for c in cyclists if c['role'] == 'Sprinter') == 1
    prob += pulp.lpSum(cyclist_vars[c['name'], c['role']] for c in cyclists if c['role'] == 'Unclassed') == 3

    # One cyclist from any role
    prob += pulp.lpSum(cyclist_vars[c['name'], c['role']] for c in cyclists) == 9

    # Solve the problem
    prob.solve()

    # Extract the solution
    dream_team = []
    total_points = 0
    total_cost = 0

    for cyclist in cyclists:
        if cyclist_vars[cyclist['name'], cyclist['role']].value() == 1:
            dream_team.append(cyclist)
            total_points += cyclist['points']
            total_cost += cyclist['cost']

    return dream_team, total_points, total_cost


function displayDreamTeam(dreamTeam) {
    try {
        console.log("Displaying dream team:", dreamTeam);
        
        if (!dreamTeam || !dreamTeam.riders || !Array.isArray(dreamTeam.riders)) {
            throw new Error("Invalid dream team data structure");
        }

        let statsHtml = `<h3>Total Cost: ${dreamTeam.total_cost.toFixed(2)} | Total Points: ${dreamTeam.total_points}</h3>`;
        $('#dreamTeamStats').html(statsHtml);

        let ridersHtml = '<h4>Riders:</h4><ul>';
        dreamTeam.riders.forEach(rider => {
            ridersHtml += `<li>${rider.name} (${rider.role}) - Cost: ${rider.cost}, Points: ${rider.points}</li>`;
        });
        ridersHtml += '</ul>';
        $('#dreamTeamRiders').html(ridersHtml);

        // ... rest of the function ...

    } catch (error) {
        console.error("Error displaying dream team:", error);
        $('#dreamTeamStats').html('<p>Error displaying dream team data</p>');
        $('#dreamTeamRiders').html('');
    }
}

if __name__ == '__main__':
    main()

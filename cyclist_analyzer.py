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
from config import *
import difflib

def fetch_html_content(url):
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        print(f"Error fetching URL {url}: {e}", file=sys.stderr)
        raise

def fetch_withdrawals():
    try:
        response = requests.get(WITHDRAWALS_URL)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        
        withdrawals = []
        
        for stage_div in soup.find_all('div', class_='rankingTables__item'):
            stage_number = stage_div.find('div', class_='rankingTables__caption').text.strip().split()[1]
            
            table = stage_div.find('table', class_='rankingTable')
            if table:
                for row in table.find_all('tr')[1:]:  # Skip header row
                    cells = row.find_all('td')
                    if len(cells) >= 3:
                        rider_name = format_withdrawal_name(cells[1].text.strip())
                        team_name = cells[2].text.strip()
                        withdrawals.append({
                            'stage': int(stage_number),
                            'rider': rider_name,
                            'team': team_name
                        })
        
        return withdrawals
    except requests.RequestException as e:
        print(f"Error fetching withdrawals: {e}", file=sys.stderr)
        return []
        
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

def fetch_team_roster(url):
    try:
        response = requests.get(url)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        riders = []
        table = soup.find('table', class_='responsive')
        if table:
            for row in table.find_all('tr'):
                name_cell = row.find('td')
                if name_cell:
                    name_link = name_cell.find('a')
                    if name_link:
                        rider_name = name_link.text.strip()
                        riders.append(rider_name)

        if not riders:
            print(f"No riders found for URL: {url}", file=sys.stderr)

        return riders
    except requests.RequestException as e:
        print(f"Error fetching team roster from URL {url}: {e}", file=sys.stderr)
        return []

def fetch_league_scores():
    response = requests.get(LEAGUE_SCORES_URL)
    soup = BeautifulSoup(response.content, 'html.parser')

    teams = []
    for li in soup.select('#users .list li'):
        team_name = li.select_one('h3.name a').text.strip()
        points = int(li.select_one('p.born b').text.strip())
        team_url = li.select_one('h3.name a')['href']
        full_team_url = f"https://www.velogames.com/spain/2024/{team_url}"

        team_roster = fetch_team_roster(full_team_url)

        teams.append({
            "name": team_name,
            "points": points,
            "roster": team_roster
        })

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

def load_existing_data(filename):
    try:
        with open(filename, 'r') as f:
            data = json.load(f)
        # Ensure all cyclists have a pointHistory
        for cyclist in data['cyclists']:
            if 'pointHistory' not in cyclist:
                cyclist['pointHistory'] = []
        # Ensure league_scores have a history
        if 'league_scores' in data and isinstance(data['league_scores'], list):
            data['league_scores'] = {'current': data['league_scores'], 'history': []}
        # Ensure MVP and MIP history exists
        if 'mvp_history' not in data:
            data['mvp_history'] = []
        if 'mip_history' not in data:
            data['mip_history'] = []
        return data
    except FileNotFoundError:
        return {'cyclists': [], 'top_50_efficiency': [], 'league_scores': {'current': [], 'history': []}, 'dream_team': None, 'last_update': None, 'mvp_history': [], 'mip_history': []}

def update_historical_data(existing_data, new_cyclists, new_league_scores):
    today = datetime.now().strftime('%Y-%m-%d')

    # Update cyclist data
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

            # Update or add today's entry in pointHistory
            today_entry = next((entry for entry in existing_cyclist['pointHistory'] if entry['date'] == today), None)
            if today_entry:
                today_entry['points'] = new_cyclist['points']
            else:
                existing_cyclist['pointHistory'].append({'date': today, 'points': new_cyclist['points']})

            # Keep only the last 30 days of historical data
            existing_cyclist['pointHistory'] = sorted(existing_cyclist['pointHistory'], key=lambda x: x['date'])[-HISTORY_RETENTION_DAYS:]
        else:
            # Add new cyclist
            new_cyclist['pointHistory'] = [{'date': today, 'points': new_cyclist['points']}]
            existing_data['cyclists'].append(new_cyclist)

    # Remove cyclists that are no longer present in the new data
    existing_data['cyclists'] = [c for c in existing_data['cyclists'] if any(nc['name'] == c['name'] for nc in new_cyclists)]

    # Update league scores
    if 'league_scores' not in existing_data:
        existing_data['league_scores'] = {'current': [], 'history': []}

    # Update current scores and team rosters
    existing_data['league_scores']['current'] = new_league_scores

    # Update or add today's entry in league score history
    today_history_entry = next((entry for entry in existing_data['league_scores']['history'] if entry['date'] == today), None)
    if today_history_entry:
        today_history_entry['scores'] = new_league_scores
    else:
        existing_data['league_scores']['history'].append({'date': today, 'scores': new_league_scores})

    # Keep only the last 30 days of league score history
    existing_data['league_scores']['history'] = sorted(existing_data['league_scores']['history'], key=lambda x: x['date'])[-HISTORY_RETENTION_DAYS:]

    # Update the last update timestamp
    existing_data['last_update'] = today

    return existing_data

def calculate_mvp_mip(cyclists, previous_data):
    today = datetime.now().strftime('%Y-%m-%d')

    mvp = {'name': '', 'points_added': 0, 'date': today}
    mip = {'name': '', 'percentage_increase': 0, 'date': today, 'from_zero': False}

    for cyclist in cyclists:
        if len(cyclist['pointHistory']) < 2:
            continue

        latest_points = cyclist['pointHistory'][-1]['points']
        previous_points = cyclist['pointHistory'][-2]['points']
        points_added = latest_points - previous_points

        # MVP calculation
        if points_added > mvp['points_added']:
            mvp = {'name': cyclist['name'], 'points_added': points_added, 'date': today}

        # MIP calculation
        if previous_points == 0 and latest_points > 0:
            if not mip['from_zero'] or points_added > mip['percentage_increase']:
                mip = {'name': cyclist['name'], 'percentage_increase': points_added, 'date': today, 'from_zero': True}
        elif previous_points > 0:
            percentage_increase = (points_added / previous_points) * 100
            if percentage_increase > mip['percentage_increase'] and not mip['from_zero']:
                mip = {'name': cyclist['name'], 'percentage_increase': percentage_increase, 'date': today, 'from_zero': False}

    # Remove any existing entry for today before appending
    previous_data['mvp_history'] = [entry for entry in previous_data['mvp_history'] if entry['date'] != today]
    previous_data['mip_history'] = [entry for entry in previous_data['mip_history'] if entry['date'] != today]

    previous_data['mvp_history'].append(mvp)
    previous_data['mip_history'].append(mip)

    # Keep only the last 30 days of MVP and MIP history
    previous_data['mvp_history'] = sorted(previous_data['mvp_history'], key=lambda x: x['date'])[-HISTORY_RETENTION_DAYS:]
    previous_data['mip_history'] = sorted(previous_data['mip_history'], key=lambda x: x['date'])[-HISTORY_RETENTION_DAYS:]

    return previous_data, mvp, mip

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
    constraints = [
        ("Total cyclists", pulp.lpSum(cyclist_vars) == TOTAL_CYCLISTS),
        ("Maximum cost", pulp.lpSum(cyclist['cost'] * cyclist_vars[cyclist['name'], cyclist['role']] 
                                    for cyclist in cyclists) <= MAX_COST),
        ("Sprinters", pulp.lpSum(cyclist_vars[cyclist['name'], cyclist['role']] 
                                 for cyclist in cyclists if cyclist['role'] == 'Sprinter') >= MIN_SPRINTERS),
        ("All-Rounders", pulp.lpSum(cyclist_vars[cyclist['name'], cyclist['role']] 
                                    for cyclist in cyclists if cyclist['role'] == 'All Rounder') >= MIN_ALL_ROUNDERS),
        ("Climbers", pulp.lpSum(cyclist_vars[cyclist['name'], cyclist['role']] 
                                for cyclist in cyclists if cyclist['role'] == 'Climber') >= MIN_CLIMBERS),
        ("Unclassed", pulp.lpSum(cyclist_vars[cyclist['name'], cyclist['role']] 
                                 for cyclist in cyclists if cyclist['role'] == 'Unclassed') >= MIN_UNCLASSED)
    ]

    # Add constraints to the problem
    for name, constraint in constraints:
        prob += constraint, name

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

def select_league_all_star_team(league_data, cyclists):
    # Create a set of all unique riders in the league
    league_riders = set()
    for team in league_data:
        league_riders.update(team['roster'])

    # Filter cyclists to only include those in the league
    league_cyclists = [c for c in cyclists if c['name'] in league_riders]

    # Create the linear programming problem
    prob = pulp.LpProblem("League All-Star Team Selection", pulp.LpMaximize)

    # Create binary variables for each cyclist
    cyclist_vars = pulp.LpVariable.dicts("Cyclist", 
                                         ((c['name'], c['role']) for c in league_cyclists), 
                                         cat='Binary')

    # Objective function: maximize total points
    prob += pulp.lpSum(cyclist['points'] * cyclist_vars[cyclist['name'], cyclist['role']] 
                       for cyclist in league_cyclists)

    # Constraints
    constraints = [
        ("Total cyclists", pulp.lpSum(cyclist_vars) == TOTAL_CYCLISTS),
        ("Maximum cost", pulp.lpSum(cyclist['cost'] * cyclist_vars[cyclist['name'], cyclist['role']] 
                                    for cyclist in league_cyclists) <= MAX_COST),
        ("Sprinters", pulp.lpSum(cyclist_vars[cyclist['name'], cyclist['role']] 
                                 for cyclist in league_cyclists if cyclist['role'] == 'Sprinter') >= MIN_SPRINTERS),
        ("All-Rounders", pulp.lpSum(cyclist_vars[cyclist['name'], cyclist['role']] 
                                    for cyclist in league_cyclists if cyclist['role'] == 'All Rounder') >= MIN_ALL_ROUNDERS),
        ("Climbers", pulp.lpSum(cyclist_vars[cyclist['name'], cyclist['role']] 
                                for cyclist in league_cyclists if cyclist['role'] == 'Climber') >= MIN_CLIMBERS),
        ("Unclassed", pulp.lpSum(cyclist_vars[cyclist['name'], cyclist['role']] 
                                 for cyclist in league_cyclists if cyclist['role'] == 'Unclassed') >= MIN_UNCLASSED)
    ]

    # Add constraints to the problem
    for name, constraint in constraints:
        prob += constraint, name

    # Solve the problem
    prob.solve()

    # Check if a solution was found
    if pulp.LpStatus[prob.status] == "Optimal":
        # Extract the solution
        all_star_team = []
        total_points = 0
        total_cost = 0

        for cyclist in league_cyclists:
            if cyclist_vars[cyclist['name'], cyclist['role']].value() == 1:
                all_star_team.append(cyclist)
                total_points += cyclist['points']
                total_cost += cyclist['cost']

        return {
            'riders': [
                {
                    'name': rider['name'],
                    'role': rider['role'],
                    'cost': rider['cost'],
                    'points': rider['points'],
                    'team': rider['team']
                } for rider in all_star_team
            ],
            'total_points': total_points,
            'total_cost': total_cost
        }
    else:
        print(f"No feasible League All-Star team found. Status: {pulp.LpStatus[prob.status]}", file=sys.stderr)
        return None

def fetch_twitter_league_data():
    response = requests.get(TWITTER_LEAGUE_URL)
    soup = BeautifulSoup(response.content, 'html.parser')

    scores = []
    for li in soup.select('#users .list li'):
        points = int(li.select_one('p.born b').text.strip())
        scores.append(points)

    return sorted(scores, reverse=True)

def calculate_rank_and_percentile(all_star_points, league_scores):
    rank = next(i for i, score in enumerate(league_scores, 1) if score <= all_star_points)
    percentile = (1 - (rank - 1) / len(league_scores)) * 100
    return rank, percentile

def format_withdrawal_name(name):
    name = name.strip()
    parts = name.split()
    if len(parts) <= 1:
        return name

    # List of common name prefixes
    prefixes = ['van', 'de', 'der', 'den', 'von', 'le', 'la', 'du', 'des', 'del', 'della', 'di', 'da', 'mac', 'mc']

    # Find the start of the last name
    last_name_start = 0
    for i, part in enumerate(parts):
        if part.lower() in prefixes:
            last_name_start = i
            break
    
    if last_name_start == 0:
        # If no prefix found, assume the last word is the last name
        last_name = parts[-1]
        first_name = ' '.join(parts[:-1])
    else:
        # If prefix found, everything from the prefix onwards is the last name
        last_name = ' '.join(parts[last_name_start:])
        first_name = ' '.join(parts[:last_name_start])

    return f"{first_name} {last_name}"

def calculate_name_similarity(name1, name2):
    return difflib.SequenceMatcher(None, name1.lower(), name2.lower()).ratio()

def mark_withdrawn_cyclists(cyclists, withdrawals):
    formatted_withdrawals = [format_withdrawal_name(w['rider']) for w in withdrawals]
    for cyclist in cyclists:
        cyclist['isWithdrawn'] = any(
            calculate_name_similarity(cyclist['name'], w) >= 0.85
            for w in formatted_withdrawals
        )
    return cyclists

def main():
    try:
        print("Loading existing data", file=sys.stderr)
        existing_data = load_existing_data(OUTPUT_FILE)

        print(f"Fetching new cyclist data from {CYCLIST_URL}", file=sys.stderr)
        html_content = fetch_html_content(CYCLIST_URL)

        print("Analyzing new cyclist data", file=sys.stderr)
        new_cyclists = analyze_cyclists(html_content)

        if not new_cyclists:
            raise ValueError("No new cyclist data was extracted")

        print(f"Extracted data for {len(new_cyclists)} cyclists", file=sys.stderr)

        print("Fetching league scores and team rosters", file=sys.stderr)
        new_league_scores = fetch_league_scores()

        print("Updating historical data", file=sys.stderr)
        updated_data = update_historical_data(existing_data, new_cyclists, new_league_scores)

        print("Creating top 50 efficiency data", file=sys.stderr)
        updated_data['top_50_efficiency'] = create_top_50_efficiency_data(updated_data['cyclists'])

        print("Selecting dream team (optimized)", file=sys.stderr)
        dream_team, total_points, total_cost = select_dream_team_optimized(updated_data['cyclists'])

        print("Selecting League All-Star Team", file=sys.stderr)
        league_all_star_team = select_league_all_star_team(updated_data['league_scores']['current'], updated_data['cyclists'])

        if league_all_star_team:
            updated_data['league_all_star_team'] = league_all_star_team
            print(f"League All-Star Team selected. Total points: {league_all_star_team['total_points']}, Total cost: {league_all_star_team['total_cost']}", file=sys.stderr)

            print("Fetching Twitter League data", file=sys.stderr)
            twitter_league_scores = fetch_twitter_league_data()

            all_star_points = league_all_star_team['total_points']
            rank, percentile = calculate_rank_and_percentile(all_star_points, twitter_league_scores)

            updated_data['league_all_star_team']['twitter_league_comparison'] = {
                'rank': rank,
                'percentile': percentile,
                'total_participants': len(twitter_league_scores)
            }

            print(f"All-Star Team Rank in Twitter League: {rank}", file=sys.stderr)
            print(f"All-Star Team Percentile in Twitter League: {percentile:.2f}%", file=sys.stderr)
        else:
            updated_data['league_all_star_team'] = None
            print("Failed to select League All-Star Team", file=sys.stderr)

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

        print("Calculating MVP and MIP", file=sys.stderr)
        updated_data, mvp, mip = calculate_mvp_mip(updated_data['cyclists'], updated_data)

        print(f"MVP: {mvp['name']} (Points added: {mvp['points_added']})", file=sys.stderr)
        print(f"MIP: {mip['name']} ({'Points gained' if mip['from_zero'] else 'Percentage increase'}: {mip['percentage_increase']}{'%' if not mip['from_zero'] else ''})", file=sys.stderr)

        print("Fetching withdrawal data", file=sys.stderr)
        withdrawals = fetch_withdrawals()
        updated_data['withdrawals'] = withdrawals
        print(f"Fetched {len(withdrawals)} withdrawals", file=sys.stderr)

        print("Marking withdrawn cyclists", file=sys.stderr)
        updated_data['cyclists'] = mark_withdrawn_cyclists(updated_data['cyclists'], withdrawals)

        print(f"Current working directory: {os.getcwd()}", file=sys.stderr)
        try:
            print("Writing updated JSON output to file", file=sys.stderr)
            with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
                json.dump(updated_data, f, default=numpy_to_python, ensure_ascii=False, indent=2)

            print(f"Script completed successfully. Output saved to {OUTPUT_FILE}", file=sys.stderr)
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

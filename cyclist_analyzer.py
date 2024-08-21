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

def main():
    cyclist_url = "https://www.velogames.com/spain/2024/riders.php"
    
    try:
        print(f"Fetching cyclist data from {cyclist_url}", file=sys.stderr)
        html_content = fetch_html_content(cyclist_url)
        
        print("Analyzing cyclist data", file=sys.stderr)
        cyclists = analyze_cyclists(html_content)
        
        if not cyclists:
            raise ValueError("No cyclist data was extracted")

        print(f"Extracted data for {len(cyclists)} cyclists", file=sys.stderr)

        top_50_data = create_top_50_efficiency_data(cyclists)

        print("Fetching league scores", file=sys.stderr)
        league_scores = fetch_league_scores()

        print("Selecting dream team (optimized)", file=sys.stderr)
        dream_team, total_points, total_cost = select_dream_team_optimized(cyclists)
        dream_team_data = [
            {
                'name': rider['name'],
                'role': rider['role'],
                'cost': rider['cost'],
                'points': rider['points']
            } for rider in dream_team
        ]

        print("Preparing output", file=sys.stderr)
        output = {
            'cyclists': cyclists,
            'top_50_efficiency': top_50_data,
            'league_scores': league_scores,
            'dream_team': {
                'riders': dream_team_data,
                'total_points': total_points,
                'total_cost': total_cost
            }
        }
        
        print("Writing JSON output", file=sys.stderr)
        json_output = json.dumps(output, default=numpy_to_python, ensure_ascii=False, indent=2)
        print(json_output)  # This will write to stdout
        
        print("Script completed successfully", file=sys.stderr)
    except Exception as e:
        print(f"An error occurred: {str(e)}", file=sys.stderr)
        print("Traceback:", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()

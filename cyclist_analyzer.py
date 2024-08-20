import sys
import json
import traceback
import requests
from bs4 import BeautifulSoup

def main():
    url = "https://www.velogames.com/spain/2024/riders.php"
    
    try:
        print(f"Fetching URL: {url}", file=sys.stderr)
        response = requests.get(url)
        response.raise_for_status()
        
        print("Parsing HTML", file=sys.stderr)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        print("Extracting cyclist data", file=sys.stderr)
        cyclists = []
        for row in soup.find_all('tr'):
            cols = row.find_all('td')
            if len(cols) >= 7:
                cyclists.append({
                    'name': cols[1].text.strip(),
                    'team': cols[2].text.strip(),
                    'role': cols[3].text.strip(),
                    'cost': cols[4].text.strip(),
                    'ownership': cols[5].text.strip(),
                    'points': cols[6].text.strip(),
                })
        
        print(f"Extracted data for {len(cyclists)} cyclists", file=sys.stderr)
        
        output = {'cyclists': cyclists}
        json_output = json.dumps(output, ensure_ascii=False, indent=2)
        
        print("JSON output:", file=sys.stderr)
        print(json_output, file=sys.stderr)
        
        print(json_output)  # Print to stdout as well
        
    except Exception as e:
        print(f"An error occurred: {e}", file=sys.stderr)
        print("Traceback:", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()

function createLatestPointsUpdateChart() {
    // Ensure we have the necessary data
    if (!cyclistData || !cyclistData.league_scores || !cyclistData.league_scores.history || cyclistData.league_scores.history.length < 2) {
        console.error('Insufficient data for latest points update chart');
        return;
    }

    const latestData = cyclistData.league_scores.history[0];
    const previousData = cyclistData.league_scores.history[1];

    // Calculate the point changes
    const pointChanges = latestData.scores.map(team => {
        const previousScore = previousData.scores.find(t => t.name === team.name)?.points || 0;
        return {
            name: team.name,
            change: team.points - previousScore
        };
    });

    // Sort teams by point change (descending order)
    pointChanges.sort((a, b) => b.change - a.change);

    const trace = {
        x: pointChanges.map(team => team.name),
        y: pointChanges.map(team => team.change),
        type: 'bar',
        marker: {
            color: pointChanges.map(team => team.change >= 0 ? 'green' : 'red')
        },
        text: pointChanges.map(team => (team.change >= 0 ? '+' : '') + team.change.toFixed(2)),
        textposition: 'auto',
        hoverinfo: 'x+text'
    };

    const layout = {
        title: {
            text: 'Latest Points Update per Team',
            font: {
                family: 'VT323, monospace',
                color: '#ff1493'
            }
        },
        xaxis: {
            title: '',
            tickangle: -45,
        },
        yaxis: {
            title: 'Point Change',
        },
        paper_bgcolor: '#fff0f5',
        plot_bgcolor: '#fff0f5',
    };

    createResponsiveChart('latestPointsUpdateChart', [trace], layout);
}

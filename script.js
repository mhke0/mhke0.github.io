let leagueData;
let cyclistData;
// Define a common color scheme function

function getColorForRole(role) {
    switch(role.toLowerCase()) {
        case 'all rounder': return '#ff6384';  // Pink
        case 'climber': return '#36a2eb';      // Blue
        case 'sprinter': return '#cc65fe';     // Purple
        case 'unclassed': return '#ffce56';    // Yellow
        default: return '#4bc0c0';             // Teal (for any other roles)
    }
}
const customColorScheme = [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
];

function createRoleChart(roles) {
    const ctx = document.getElementById('roleChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(roles),
            datasets: [{
                data: Object.values(roles),
                backgroundColor: Object.keys(roles).map(getColorForRole),
                borderColor: '#ffffff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Cyclist Roles Distribution',
                    font: {
                        family: 'VT323, monospace',
                        size: 24,
                        color: '#ff1493'
                    }
                },
                legend: {
                    labels: {
                        font: {
                            family: 'VT323, monospace',
                            size: 14,
                            color: '#000000'
                        }
                    }
                }
            }
        }
    });
}


// ... (keep the previous color scheme functions)

function createResponsiveChart(chartId, traces, layout) {
    const config = {
        responsive: true,
        displayModeBar: false,
    };
    layout.autosize = true;
    
    const container = document.getElementById(chartId);
    if (!container) {
        console.error(`Container with id ${chartId} not found`);
        return;
    }
    container.style.display = 'block';
    container.style.height = '400px';
    container.style.maxWidth = '600px';
    container.style.margin = 'auto';
    
    delete layout.width;
    delete layout.height;
    
    layout.margin = {
        l: 50,
        r: 50,
        t: 50,
        b: 50,
        pad: 4,
        autoexpand: true
    };
    
    layout.xaxis = layout.xaxis || {};
    layout.yaxis = layout.yaxis || {};
    layout.xaxis.automargin = true;
    layout.yaxis.automargin = true;
    
    function updateFontSizes() {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const baseFontSize = Math.min(containerWidth, containerHeight) / 30;
        
        layout.font = {
            family: 'VT323, monospace',
            size: baseFontSize,
            color: '#ff1493'
        };
        layout.title = layout.title || {};
        layout.title.font = {
            family: 'VT323, monospace',
            size: baseFontSize * 1.5,
            color: '#ff1493'
        };
        layout.xaxis.title = layout.xaxis.title || {};
        layout.xaxis.title.font = {
            family: 'VT323, monospace',
            size: baseFontSize,
            color: '#ff1493'
        };
        layout.yaxis.title = layout.yaxis.title || {};
        layout.yaxis.title.font = {
            family: 'VT323, monospace',
            size: baseFontSize,
            color: '#ff1493'
        };
        layout.legend = layout.legend || {};
        layout.legend.font = {
            family: 'VT323, monospace',
            size: baseFontSize * 0.9,
            color: '#ff1493'
        };
    }
    
    layout.xaxis.tickangle = layout.xaxis.tickangle || -45;
    
    updateFontSizes();
    
    try {
        Plotly.newPlot(chartId, traces, layout, config);
    } catch (error) {
        console.error(`Error creating chart ${chartId}:`, error);
        container.innerHTML = `<p>Error creating chart. Please try refreshing the page.</p>`;
    }
    
    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            if (entry.target.id === chartId) {
                updateFontSizes();
                try {
                    Plotly.relayout(chartId, {
                        autosize: true,
                        font: layout.font,
                        'title.font': layout.title.font,
                        'xaxis.title.font': layout.xaxis.title.font,
                        'yaxis.title.font': layout.yaxis.title.font,
                        'legend.font': layout.legend.font
                    });
                } catch (error) {
                    console.error(`Error resizing chart ${chartId}:`, error);
                }
            }
        }
    });
    
    resizeObserver.observe(container);
}


function initializeLeagueTeamSelect() {
    const leagueTeamSelect = document.getElementById('leagueTeamSelect');
    leagueTeamSelect.innerHTML = '<option value="">Select a League Team</option>';
    leagueData.forEach(team => {
        const option = document.createElement('option');
        option.value = team.name;
        option.textContent = team.name;
        leagueTeamSelect.appendChild(option);
    });
}

function initializeCyclingTeamSelect() {
    const cyclingTeamSelect = document.getElementById('cyclingTeamSelect');
    cyclingTeamSelect.innerHTML = '<option value="">Select a Cycling Team</option>';
    const teams = [...new Set(cyclistData.cyclists.map(cyclist => cyclist.team))].sort();
    teams.forEach(team => {
        const option = document.createElement('option');
        option.value = team;
        option.textContent = team;
        cyclingTeamSelect.appendChild(option);
    });

    // Load the default cycling team chart
    loadDefaultCyclingTeamChart();
}

function updateLeagueTeamRosterChart() {
    const selectedTeam = document.getElementById('leagueTeamSelect').value;
    if (!selectedTeam) return;

    const team = leagueData.find(t => t.name === selectedTeam);
    if (!team) return;

    const rosterData = team.roster.map(riderName => {
        const rider = cyclistData.cyclists.find(c => c.name === riderName);
        return {
            name: riderName,
            points: rider ? rider.points : 0,
            role: rider ? rider.role : 'Unknown'
        };
    }).sort((a, b) => b.points - a.points);

    const trace = {
        x: rosterData.map(r => r.name),
        y: rosterData.map(r => r.points),
        type: 'bar',
        marker: {
            color: rosterData.map(r => {
                switch(r.role) {
                    case 'All Rounder': return '#ff6384';
                    case 'Climber': return '#36a2eb';
                    case 'Sprinter': return '#cc65fe';
                    default: return '#4bc0c0';
                }
            })
        },
        text: rosterData.map(r => `${r.name}<br>Role: ${r.role}<br>Points: ${r.points}`),
        hoverinfo: 'text'
    };

    const layout = {
        title: {
            text: `${selectedTeam} Roster`,
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
            title: 'Points',
        },
        paper_bgcolor: '#fff0f5',
        plot_bgcolor: '#fff0f5'
    };

    createResponsiveChart('leagueTeamRosterChart', [trace], layout);
    
    const { mostBalancedTeam, leastBalancedTeam } = calculateBalancedTeams(leagueData);
    displayBalancedTeam(mostBalancedTeam, 'mostBalancedTeamContent');
    displayBalancedTeam(leastBalancedTeam, 'leastBalancedTeamContent');
}

function updateCyclingTeamRosterDisplay() {
    const selectedTeam = document.getElementById('cyclingTeamSelect').value;
    if (!selectedTeam) {
        document.getElementById('selectedTeamInfo').textContent = '';
        document.getElementById('cyclingTeamRosterDisplay').innerHTML = '';
        document.getElementById('teamPointsDistributionChart').innerHTML = '';
        return;
    }

    const teamRiders = cyclistData.cyclists.filter(cyclist => cyclist.team === selectedTeam);
    
    // Calculate total team points
    const totalTeamPoints = teamRiders.reduce((sum, rider) => sum + rider.points, 0);
    
    // Update the selected team info display
    document.getElementById('selectedTeamInfo').textContent = `${selectedTeam} (${totalTeamPoints} points)`;

    let rosterHtml = '';
    teamRiders.forEach(rider => {
        rosterHtml += `
            <div class="rider-card">
                <h4>${rider.name}</h4>
                <p>Role: ${rider.role}</p>
                <p>Cost: ${rider.cost}</p>
                <p>Points: ${rider.points}</p>
            </div>
        `;
    });
    
    document.getElementById('cyclingTeamRosterDisplay').innerHTML = rosterHtml;

    // Call the function to display the points distribution
    displayTeamPointsDistribution(teamRiders);

    // Call the function to display the all teams comparison
    displayAllTeamsComparison();
}

$(document).ready(function() {
    $.getJSON('cyclist-data.json', function(data) {
        $('#loading').hide();
        $('#dashboard').show();

        if (!data.cyclists || !data.league_scores) {
            throw new Error("Missing required data in JSON file");
        }

        // Store the cyclist data globally
        cyclistData = data;

        let cyclists = data.cyclists;
        let leagueScores = data.league_scores;

        // Call the function when the page loads
        updateVisitCount();
        
        // Sort cyclists by cost_per_point (convert "Infinity" to a large number for sorting)
        cyclists.sort((a, b) => {
            const costPerPointA = a.cost_per_point === "Infinity" ? Infinity : parseFloat(a.cost_per_point);
            const costPerPointB = b.cost_per_point === "Infinity" ? Infinity : parseFloat(b.cost_per_point);
            return costPerPointA - costPerPointB;
        });

        // Get the top 50 cyclists
        let top50Cyclists = cyclists.slice(0, 50);

        let totalCost = 0;
        let totalPoints = 0;
        const roles = {};

        cyclists.forEach(cyclist => {
            totalCost += cyclist.cost;
            totalPoints += cyclist.points;
            roles[cyclist.role] = (roles[cyclist.role] || 0) + 1;

            const costPerPoint = cyclist.points === 0 ? "∞" : (cyclist.cost / cyclist.points).toFixed(2);
            $('#cyclistTable tbody').append(`
                <tr>
                    <td>${cyclist.name}</td>
                    <td>${cyclist.team}</td>
                    <td>${cyclist.role}</td>
                    <td>${cyclist.cost}</td>
                    <td>${cyclist.points}</td>
                    <td>${costPerPoint}</td>
                </tr>
            `);
        });

        // Call this function after the table is populated
        makeTableResponsive();
        
        const avgCost = (totalCost / cyclists.length).toFixed(2);
        const avgPoints = (totalPoints / cyclists.length).toFixed(2);

        $('#stats').html(`
            <div class="stat-box">
                <h3>Total Cyclists</h3>
                <p>${cyclists.length}</p>
            </div>
            <div class="stat-box">
                <h3>Average Cost</h3>
                <p>${avgCost}</p>
            </div>
            <div class="stat-box">
                <h3>Average Points</h3>
                <p>${avgPoints}</p>
            </div>
        `);

        createRoleChart(roles);
        createTop50Chart(top50Cyclists);
        createPointsPerNameLengthChart(cyclists);
        createLeagueScoresChart(leagueScores.current);
        createRelativePerformanceChart(leagueScores.current);
        createCostVsPointsChart(top50Cyclists);
        createLeagueStandingsChart();

        // Initialize the cycling team select dropdown
        initializeCyclingTeamSelect();

        if (data.dream_team) {
            displayDreamTeam(data.dream_team);
        }

        const riderSelect = $('#riderSelect');
        const sortedCyclists = data.cyclists.sort((a, b) => a.name.localeCompare(b.name));
        sortedCyclists.forEach(cyclist => {
            riderSelect.append(`<option value="${cyclist.name}">${cyclist.name}</option>`);
        });

        // Initialize the trajectory chart with top 10 riders
        updateTrajectoryChart();

        // Generate the news content
        generateNewsContent();

        // Open the News tab by default
        document.getElementById("defaultOpen").click();

    }).fail(function(jqxhr, textStatus, error) {
        $('#loading').hide();
        $('#error').text("Error fetching data: " + error).show();
    });
});


function createTop50Chart(top50Cyclists) {
    const trace = {
        x: top50Cyclists.map(c => c.name),
        y: top50Cyclists.map(c => c.cost_per_point === "Infinity" ? 0 : c.cost_per_point),
        type: 'bar',
        marker: {
            color: top50Cyclists.map(c => {
                switch(c.role) {
                    case 'All Rounder': return '#ff6384';
                    case 'Climber': return '#36a2eb';
                    case 'Sprinter': return '#cc65fe';
                    case 'Unclassed': return '#ffce56';
                    default: return '#4bc0c0';
                }
            })
        },
        text: top50Cyclists.map(c => (
            `Name: ${c.name}<br>` +
            `Role: ${c.role}<br>` +
            `Cost: ${c.cost}<br>` +
            `Points: ${c.points}<br>` +
            `Cost per Point: ${c.cost_per_point}`
        )),
        hoverinfo: 'text+y'
    };

    const layout = {
        title: {
            text: 'Top 50 Cyclists by Cost Efficiency(Lower is better)',
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
            title: 'Cost per Point',
        },
        paper_bgcolor: '#fff0f5',
        plot_bgcolor: '#fff0f5',
    };

    createResponsiveChart('top50Chart', [trace], layout);
}

function createPointsPerNameLengthChart(cyclists) {
    let cyclistsWithPointsPerNameLength = cyclists.map(c => ({
        ...c,
        pointsPerNameLength: c.points / c.name.replace(/\s/g, '').length
    })).sort((a, b) => b.pointsPerNameLength - a.pointsPerNameLength);

    let top50PointsPerNameLength = cyclistsWithPointsPerNameLength.slice(0, 50);

    const tracePointsPerNameLength = {
        x: top50PointsPerNameLength.map(c => c.name),
        y: top50PointsPerNameLength.map(c => c.pointsPerNameLength),
        type: 'bar',
        marker: {
            color: top50PointsPerNameLength.map(c => {
                switch(c.role) {
                    case 'All Rounder': return '#ff6384';
                    case 'Climber': return '#36a2eb';
                    case 'Sprinter': return '#cc65fe';
                    case 'Unclassed': return '#ffce56';
                    default: return '#4bc0c0';
                }
            })
        },
        text: top50PointsPerNameLength.map(c => (
            `Name: ${c.name}<br>` +
            `Role: ${c.role}<br>` +
            `Points: ${c.points}<br>` +
            `Name Length: ${c.name.replace(/\s/g, '').length}<br>` +
            `Points per Name Length: ${c.pointsPerNameLength.toFixed(2)}`
        )),
        hoverinfo: 'text'
    };

    const layoutPointsPerNameLength = {
        title: {
            text: 'Top 50 Cyclists by Points per Name Length',
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
            title: 'Points per Name Length',
        },
        paper_bgcolor: '#fff0f5',
        plot_bgcolor: '#fff0f5',
    };

    createResponsiveChart('pointsPerNameLengthChart', [tracePointsPerNameLength], layoutPointsPerNameLength);
}

function createLeagueScoresChart(leagueScores) {
        if (cyclistData && cyclistData.league_scores && cyclistData.league_scores.history) {
        leagueData = cyclistData.league_scores.history;
    }
    const baseData = {
        "Team Name": 0,
        "Iberische Halbpinsel": 7405,
        "Ganz anderer Teamname": 9297,
        "Team Fiestina": 8128
    };
    const middleData = {
        "Team Name": 9062,
        "Iberische Halbpinsel": 9530,
        "Ganz anderer Teamname": 7506,
        "Team Fiestina": 8964
    };

    function getUniqueTeamNames(baseData, middleData, leagueScores) {
        const allNames = [
            ...Object.keys(baseData),
            ...Object.keys(middleData),
            ...leagueScores.map(team => team.name)
        ];
        return [...new Set(allNames)];
    }

    const uniqueTeamNames = getUniqueTeamNames(baseData, middleData, leagueScores);

    function findExactOrClosestMatch(obj, searchKey) {
        if (obj.hasOwnProperty(searchKey)) {
            return searchKey;
        }
        return Object.keys(obj).find(key => 
            key.toLowerCase().includes(searchKey.toLowerCase()) || 
            searchKey.toLowerCase().includes(key.toLowerCase())
        ) || searchKey;
    }

    const leagueTrace1 = {
        x: uniqueTeamNames,
        y: uniqueTeamNames.map(name => baseData[findExactOrClosestMatch(baseData, name)] || 0),
        name: 'Giro',
        type: 'bar',
        marker: { color: 'pink' }
    };

    const leagueTrace2 = {
        x: uniqueTeamNames,
        y: uniqueTeamNames.map(name => middleData[findExactOrClosestMatch(middleData, name)] || 0),
        name: 'TdF',
        type: 'bar',
        marker: { color: 'yellow' }
    };

    const leagueTrace3 = {
        x: uniqueTeamNames,
        y: uniqueTeamNames.map(name => {
            const team = leagueScores.find(t => t.name === name);
            return team ? team.points : 0;
        }),
        name: 'Vuelta',
        type: 'bar',
        marker: { color: 'red' }
    };

    const leagueLayout = {
        title: {
            text: 'League Scores (Stacked)',
            font: {
                family: 'VT323, monospace',
                color: '#ff1493'
            }
        },
        barmode: 'stack',
        xaxis: {
            title: '',
            tickangle: -45,
        },
        yaxis: {
            title: '',
        },
        paper_bgcolor: '#fff0f5',
        plot_bgcolor: '#fff0f5',
    };



    let rosterHtml = '<div class="roster-grid">';
    leagueScores.forEach(team => {
        rosterHtml += `
            <div class="roster-card">
                <h4>${team.name}</h4>
                <ul>
                    ${team.roster.map(player => `<li>${player}</li>`).join('')}
                </ul>
            </div>
        `;
    });
    rosterHtml += '</div>';
    $('#teamRosters').html(rosterHtml);
    
    // Store the league data globally
    leagueData = leagueScores;

    // Initialize the league team select dropdown
    initializeLeagueTeamSelect();
    // Load the default league team chart
    loadDefaultLeagueTeamChart();

    createResponsiveChart('leagueScoresChart', [leagueTrace1, leagueTrace2, leagueTrace3], leagueLayout);


    
    const { mostBalancedTeam, leastBalancedTeam } = calculateBalancedTeams(leagueScores);
    displayBalancedTeam(mostBalancedTeam, 'mostBalancedTeamContent');
    displayBalancedTeam(leastBalancedTeam, 'leastBalancedTeamContent');


}

function createCostVsPointsChart(top50Cyclists) {
    const costVsPointsTrace = {
        x: top50Cyclists.map(c => c.points),
        y: top50Cyclists.map(c => c.cost),
        mode: 'markers',
        type: 'scatter',
        text: top50Cyclists.map(c => c.name),
        marker: {
            size: 10,
            color: top50Cyclists.map(c => {
                switch(c.role) {
                    case 'All Rounder': return '#ff6384';
                    case 'Climber': return '#36a2eb';
                    case 'Sprinter': return '#cc65fe';
                    case 'Unclassed': return '#ffce56';
                    default: return '#4bc0c0';
                }
            })
        },
        hoverinfo: 'text+x+y'
    };
    
    const costVsPointsLayout = {
        title: {
            text: 'Cost vs Points (Top 50)',
            font: {
                family: 'VT323, monospace',
                color: '#ff1493'
            }
        },
        xaxis: {
            title: 'Points',
            tickangle: -45,
        },
        yaxis: {
            title: 'Cost',
        },
        paper_bgcolor: '#fff0f5',
        plot_bgcolor: '#fff0f5',
    };

    createResponsiveChart('costVsPointsChart', [costVsPointsTrace], costVsPointsLayout);
}

function displayDreamTeam(dreamTeam) {
    let statsHtml = `<h3>Total Cost: ${dreamTeam.total_cost.toFixed(2)} | Total Points: ${dreamTeam.total_points}</h3>`;
    $('#dreamTeamStats').html(statsHtml);

    const roleColors = {
        'All Rounder': '#ff6384',
        'Climber': '#36a2eb',
        'Sprinter': '#cc65fe',
        'Unclassed': '#ffce56',
        'Other': '#4bc0c0'
    };

    let allRounders = dreamTeam.riders.filter(r => r.role === 'All Rounder').sort((a, b) => b.points - a.points);
    let climbers = dreamTeam.riders.filter(r => r.role === 'Climber').sort((a, b) => b.points - a.points);
    let sprinters = dreamTeam.riders.filter(r => r.role === 'Sprinter').sort((a, b) => b.points - a.points);
    let unclassed = dreamTeam.riders.filter(r => r.role === 'Unclassed').sort((a, b) => b.points - a.points);
    
    let orderedRiders = [
        ...allRounders.slice(0, 2),
        ...climbers.slice(0, 2),
        ...sprinters.slice(0, 1),
        ...unclassed.slice(0, 3)
    ];

    let additionalRider = dreamTeam.riders.find(r => !orderedRiders.includes(r));
    if (additionalRider) {
        orderedRiders.push(additionalRider);
    }

    let ridersHtml = '<h4>Riders:</h4><ol style="list-style-type: none; padding: 0;">';
    orderedRiders.forEach((rider, index) => {
        let backgroundColor = roleColors[rider.role] || roleColors['Other'];
        ridersHtml += `
            <li style="background-color: ${backgroundColor}; color: white; margin-bottom: 5px; padding: 10px; border-radius: 5px;">
                ${index + 1}. ${rider.name} (${rider.role}) - Cost: ${rider.cost}, Points: ${rider.points}
            </li>`;
    });
    ridersHtml += '</ol>';
    $('#dreamTeamRiders').html(ridersHtml);

   const ctx = document.getElementById('dreamTeamChart').getContext('2d');
    const roleData = {};
    orderedRiders.forEach(rider => {
        roleData[rider.role] = (roleData[rider.role] || 0) + rider.points;
    });

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(roleData),
            datasets: [{
                data: Object.values(roleData),
                backgroundColor: Object.keys(roleData).map(getColorForRole),
                borderColor: '#ffffff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Dream Team Points Distribution by Role',
                    font: {
                        family: 'VT323, monospace',
                        size: 24,
                        color: '#ff1493'
                    }
                },
                legend: {
                    labels: {
                        font: {
                            family: 'VT323, monospace',
                            size: 14,
                            color: '#000000'
                        }
                    }
                }
            }
        }
    });
}


function createTrajectoryChart(cyclists) {
    const traces = cyclists.map((cyclist, index) => ({
        x: cyclist.pointHistory.map(h => h.date.split('T')[0]),
        y: cyclist.pointHistory.map(h => h.points),
        type: 'scatter',
        mode: 'lines+markers',
        name: cyclist.name,
        line: { 
            width: 2,
            color: customColorScheme[index % customColorScheme.length]
        },
        marker: { 
            size: 6,
            color: customColorScheme[index % customColorScheme.length]
        },
        hoverinfo: 'text',
        text: cyclist.pointHistory.map(h => 
            `${cyclist.name}<br>` +
            `Role: ${cyclist.role}<br>` +
            `Date: ${h.date.split('T')[0]}<br>` +
            `Points: ${h.points}`
        ),
        showlegend: false
    }));

    // Get the min and max dates from all cyclists
    const allDates = cyclists.flatMap(cyclist => cyclist.pointHistory.map(h => new Date(h.date.split('T')[0])));
    const minDate = new Date(Math.min(...allDates));
    const maxDate = new Date(Math.max(...allDates));

    // Generate an array of all dates between min and max
    const dateRange = [];
    for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
        dateRange.push(new Date(d));
    }

    const layout = {
        title: {
            text: 'Rider Point Trajectories',
            font: {
                family: 'VT323, monospace',
                color: '#ff1493'
            }
        },
        xaxis: {
            title: 'Date',
            tickangle: -45,
            tickformat: '%Y-%m-%d',
            tickmode: 'array',
            tickvals: dateRange,
            ticktext: dateRange.map(d => d.toISOString().split('T')[0]),
            nticks: dateRange.length
        },
        yaxis: {
            title: 'Points',
        },
        showlegend: false,
        paper_bgcolor: '#fff0f5',
        plot_bgcolor: '#fff0f5',
        hovermode: 'closest'
    };

    createResponsiveChart('trajectoryChart', traces, layout);
}

function createCustomLegend(cyclists) {
    const legendContainer = document.getElementById('customLegend');
    legendContainer.innerHTML = ''; // Clear existing legend items

    cyclists.forEach((cyclist, index) => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        const colorBox = document.createElement('div');
        colorBox.className = 'legend-color';
        colorBox.style.backgroundColor = customColorScheme[index % customColorScheme.length];
        const nameSpan = document.createElement('span');
        nameSpan.textContent = cyclist.name;
        legendItem.appendChild(colorBox);
        legendItem.appendChild(nameSpan);
        legendContainer.appendChild(legendItem);
    });
}


function updateMVPandMIP(cyclistData) {
    const mvpHistory = cyclistData.mvp_history;
    const mipHistory = cyclistData.mip_history;

    let mvpInfo = '';
    let mipInfo = '';

    if (mvpHistory && mvpHistory.length > 0) {
        const mvp = mvpHistory[mvpHistory.length - 1];
        mvpInfo = `
            <strong>MVP:</strong> ${mvp.name}<br>
            Points Added: ${mvp.points_added.toFixed(2)}<br>
            Date: ${new Date(mvp.date).toLocaleDateString()}
        `;
    }

    if (mipHistory && mipHistory.length > 0) {
        const mip = mipHistory[mipHistory.length - 1];
        mipInfo = `
            <strong>MIP:</strong> ${mip.name}<br>
            ${mip.from_zero ? 'Points Gained' : 'Percentage Increase'}: ${mip.from_zero ? mip.percentage_increase.toFixed(2) : mip.percentage_increase.toFixed(2) + '%'}<br>
            Date: ${new Date(mip.date).toLocaleDateString()}
        `;
    }

    $('#mvpInfo').html(mvpInfo);
    $('#mipInfo').html(mipInfo);

    return {
        mvp: mvpHistory && mvpHistory.length > 0 ? mvpHistory[mvpHistory.length - 1] : null,
        mip: mipHistory && mipHistory.length > 0 ? mipHistory[mipHistory.length - 1] : null
    };
}

function updateTrajectoryChart() {
    const selectedOption = $('#riderSelect').val();
    let filteredCyclists;

    if (selectedOption === 'top10') {
        filteredCyclists = cyclistData.cyclists
            .sort((a, b) => b.points - a.points)
            .slice(0, 10);
    } else if (selectedOption === 'all') {
        filteredCyclists = cyclistData.cyclists;
    } else {
        filteredCyclists = cyclistData.cyclists.filter(c => c.name === selectedOption);
    }

    createTrajectoryChart(filteredCyclists);
    createCustomLegend(filteredCyclists);

    const { mvp, mip } = updateMVPandMIP(cyclistData);
    updateAllTimeMVPMIP(cyclistData);  // Add this line to update all-time records
}

function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";

    // Call specific functions based on the tab opened
    if (tabName === 'News') {
        generateNewsContent();
    } else if (tabName === 'RiderTrajectoryTab') {
        updateTrajectoryChart();
    } else if (tabName === 'LeagueScoresTab') {
        loadDefaultLeagueTeamChart();
        createLeagueStandingsChart();
        createLatestPointsUpdateChart();
    } else if (tabName === 'TeamsTab') {
        loadDefaultCyclingTeamChart();
    }
}


document.getElementById("defaultOpen").click();

function sortTable(columnIndex) {
    const table = document.getElementById("cyclistTable");
    let rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
    switching = true;
    dir = "asc";
    while (switching) {
        switching = false;
        rows = table.rows;
        for (i = 1; i < (rows.length - 1); i++) {
            shouldSwitch = false;
            x = rows[i].getElementsByTagName("TD")[columnIndex];
            y = rows[i + 1].getElementsByTagName("TD")[columnIndex];
            
            let xValue, yValue;
            if (columnIndex === 3 || columnIndex === 4 || columnIndex === 5) {
                xValue = parseFloat(x.innerHTML);
                yValue = parseFloat(y.innerHTML);
            } else {
                xValue = x.innerHTML.toLowerCase();
                yValue = y.innerHTML.toLowerCase();
            }
            
            if (dir == "asc") {
                if (xValue > yValue) {
                    shouldSwitch = true;
                    break;
                }
            } else if (dir == "desc") {
                if (xValue < yValue) {
                    shouldSwitch = true;
                    break;
                }
            }
        }
        if (shouldSwitch) {
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
            switchcount++;
        } else {
            if (switchcount == 0 && dir == "asc") {
                dir = "desc";
                switching = true;
            }
        }
    }
}

function createRelativePerformanceChart(leagueScores) {
    const averageScore = leagueScores.reduce((sum, team) => sum + team.points, 0) / leagueScores.length;
    
    const data = leagueScores.map(team => ({
        name: team.name,
        relativePerformance: ((team.points - averageScore) / averageScore) * 100
    }));

    const trace = {
        x: data.map(d => d.name),
        y: data.map(d => d.relativePerformance),
        type: 'bar',
        marker: {
            color: data.map(d => d.relativePerformance >= 0 ? 'green' : 'red')
        },
        text: data.map(d => d.relativePerformance.toFixed(2) + '%'),
        textposition: 'auto',
        hoverinfo: 'x+text'
    };
    
    const layout = {
        title: {
            text: 'Team Performance Relative to Average',
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
            title: 'Performance Relative to Average (%)',
        },
        paper_bgcolor: '#fff0f5',
        plot_bgcolor: '#fff0f5',
    };

    createResponsiveChart('relativePerformanceChart', [trace], layout);
}

function calculateBalancedTeams(leagueScores) {
    let mostBalancedTeam = null;
    let leastBalancedTeam = null;
    let lowestDelta = Infinity;
    let highestDelta = -Infinity;

    leagueScores.forEach(team => {
        const rosterData = team.roster.map(riderName => {
            const rider = cyclistData.cyclists.find(c => c.name === riderName);
            return rider ? rider.points : 0;
        }).sort((a, b) => b - a);  // Sort points in descending order

        let totalDelta = 0;
        for (let i = 1; i < rosterData.length; i++) {
            totalDelta += rosterData[i-1] - rosterData[i];
        }

        const averageDelta = totalDelta / (rosterData.length - 1);

        const teamData = {
            ...team,
            averageDelta: averageDelta,
            highestPoints: rosterData[0],
            lowestPoints: rosterData[rosterData.length - 1]
        };

        if (averageDelta < lowestDelta) {
            lowestDelta = averageDelta;
            mostBalancedTeam = teamData;
        }

        if (averageDelta > highestDelta) {
            highestDelta = averageDelta;
            leastBalancedTeam = teamData;
        }
    });

    return { mostBalancedTeam, leastBalancedTeam };
}

function displayBalancedTeam(team, elementId) {
    const balancedTeamContent = document.getElementById(elementId);
    if (!team) {
        balancedTeamContent.innerHTML = 'No team data available.';
        return;
    }

    const html = `
        <h4>${team.name}</h4>
        <p>Total Points: ${team.points}</p>
        <p>Average Delta: ${team.averageDelta.toFixed(2)} points</p>
        <p>Highest Points: ${team.highestPoints}</p>
        <p>Lowest Points: ${team.lowestPoints}</p>
        <p>Point Range: ${team.highestPoints - team.lowestPoints}</p>
    `;

    balancedTeamContent.innerHTML = html;
}

function loadDefaultLeagueTeamChart() {
    if (leagueData && leagueData.length > 0) {
        const defaultTeam = leagueData[0];
        document.getElementById('leagueTeamSelect').value = defaultTeam.name;
        updateLeagueTeamRosterChart();
    }
}

function loadDefaultCyclingTeamChart() {
    const cyclingTeamSelect = document.getElementById('cyclingTeamSelect');
    if (cyclingTeamSelect.options.length > 1) {
        cyclingTeamSelect.selectedIndex = 1; // Select the first team (index 0 is the default "Select a team" option)
        updateCyclingTeamRosterDisplay();
    }
}

function updateVisitCount() {
    fetch('https://api.countapi.xyz/update/mhke0.github.io/visits/?amount=1')
    .then(response => response.json())
    .then(data => {
        document.getElementById('visit-count').innerText = data.value;
    })
    .catch(error => console.error('Error updating visit count:', error));
}

function calculateAllTimeMVPMIP(cyclistData) {
    const mvpHistory = cyclistData.mvp_history || [];
    const mipHistory = cyclistData.mip_history || [];

    let allTimeMVP = { name: '', points_added: 0, date: '' };
    let allTimeMIP = { name: '', percentage_increase: 0, date: '', from_zero: false };

    mvpHistory.forEach(mvp => {
        if (mvp.points_added > allTimeMVP.points_added) {
            allTimeMVP = mvp;
        }
    });

    mipHistory.forEach(mip => {
        if (mip.from_zero) {
            if (!allTimeMIP.from_zero || mip.percentage_increase > allTimeMIP.percentage_increase) {
                allTimeMIP = mip;
            }
        } else if (!allTimeMIP.from_zero && mip.percentage_increase > allTimeMIP.percentage_increase) {
            allTimeMIP = mip;
        }
    });

    return { allTimeMVP, allTimeMIP };
}

function updateAllTimeMVPMIP(cyclistData) {
    const { allTimeMVP, allTimeMIP } = calculateAllTimeMVPMIP(cyclistData);

    let allTimeMVPInfo = '';
    let allTimeMIPInfo = '';

    if (allTimeMVP.name) {
        allTimeMVPInfo = `
            <strong>All-Time MVP:</strong> ${allTimeMVP.name}<br>
            Points Added: ${allTimeMVP.points_added.toFixed(2)}<br>
            Date: ${new Date(allTimeMVP.date).toLocaleDateString()}
        `;
    }

    if (allTimeMIP.name) {
        allTimeMIPInfo = `
            <strong>All-Time MIP:</strong> ${allTimeMIP.name}<br>
            ${allTimeMIP.from_zero ? 'Points Gained' : 'Percentage Increase'}: ${allTimeMIP.from_zero ? allTimeMIP.percentage_increase.toFixed(2) : allTimeMIP.percentage_increase.toFixed(2) + '%'}<br>
            Date: ${new Date(allTimeMIP.date).toLocaleDateString()}
        `;
    }

    $('#allTimeMVPInfo').html(allTimeMVPInfo);
    $('#allTimeMIPInfo').html(allTimeMIPInfo);
}


function linearRegression(x, y) {
    const n = x.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
        sumX += x[i];
        sumY += y[i];
        sumXY += x[i] * y[i];
        sumXX += x[i] * x[i];
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    return { slope, intercept };
}

// Function to create the league standings chart with prediction
function createLeagueStandingsChart() {
    const leagueHistory = cyclistData.league_scores.history;
    const teams = {};
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
    
    // Process the historical data
    leagueHistory.forEach(entry => {
        const date = new Date(entry.date);
        entry.scores.forEach(score => {
            if (!teams[score.name]) {
                teams[score.name] = {
                    name: score.name,
                    x: [],
                    y: [],
                    color: colors[Object.keys(teams).length % colors.length]
                };
            }
            teams[score.name].x.push(date.getTime());
            teams[score.name].y.push(score.points);
        });
    });

    const traces = [];
    Object.values(teams).forEach(team => {
        // Perform linear regression
        const regression = linearRegression(team.x, team.y);
        
        // Calculate prediction for 5 days in the future
        const lastDate = new Date(Math.max(...team.x));
        const predictionDate = new Date(lastDate.getTime() + 5 * 24 * 60 * 60 * 1000);
        const predictionX = predictionDate.getTime();
        const predictionY = regression.slope * predictionX + regression.intercept;
        
        // Create main trace with custom hover template
        traces.push({
            x: team.x.map(timestamp => new Date(timestamp)),
            y: team.y,
            type: 'scatter',
            mode: 'lines+markers',
            name: team.name,
            line: { color: team.color },
            hovertemplate: 
                '<b>%{fullData.name}</b><br>' +
                'Date: %{x|%Y-%m-%d}<br>' +
                'Points: %{y:.2f}<br>' +
                '<extra></extra>'
        });
        
        // Create prediction trace with custom hover template
        traces.push({
            x: [new Date(team.x[team.x.length - 1]), predictionDate],
            y: [team.y[team.y.length - 1], predictionY],
            type: 'scatter',
            mode: 'lines',
            line: {
                dash: 'dash',
                color: team.color
            },
            name: `${team.name} (Predicted)`,
            showlegend: false,
            hovertemplate: 
                '<b>%{fullData.name}</b><br>' +
                'Date: %{x|%Y-%m-%d}<br>' +
                'Predicted Points: %{y:.2f}<br>' +
                '<extra></extra>'
        });
    });

    const layout = {
        title: {
            text: 'League Standings Over Time (with 5-day Prediction)',
            font: {
                family: 'VT323, monospace',
                color: '#ff1493'
            }
        },
        xaxis: {
            title: 'Date',
            tickangle: -45,
            hoverformat: '%Y-%m-%d'
        },
        yaxis: {
            title: 'Points'
        },
        paper_bgcolor: '#fff0f5',
        plot_bgcolor: '#fff0f5',
        legend: {
            orientation: 'h',
            y: -0.2
        },
        hovermode: 'closest'
    };

    createResponsiveChart('leagueStandingsChart', traces, layout);
}

function displayTeamPointsDistribution(teamRiders) {
  // Sort riders by points in descending order
  const sortedRiders = teamRiders.sort((a, b) => b.points - a.points);

  const trace = {
    labels: sortedRiders.map(rider => `${rider.name}<br>(${rider.role})`), // Add line break
    values: sortedRiders.map(rider => rider.points),
    type: 'pie',
    textinfo: 'label+percent',
    hoverinfo: 'text',
    hovertext: sortedRiders.map(rider => `Name: ${rider.name}<br>` +
                                          `Role: ${rider.role}<br>` +
                                          `Points: ${rider.points}<br>` +
                                          `Cost: ${rider.cost}`
    ),
    marker: {
      colors: sortedRiders.map(rider => getColorForRole(rider.role)),
      line: { color: '#ffffff', width: 2 }
    },
    textposition: 'outside', // Force all labels outside
    automargin: true // Automatically adjust margins
  };

  const layout = {
    title: {
      text: '',
      font: { family: 'VT323, monospace', color: '#ff1493' }
    },
    paper_bgcolor: '#fff0f5',
    plot_bgcolor: '#fff0f5',
    showlegend: false,
    margin: {l: 50, r: 50, t: 50, b: 50}, // Increase margins
    height: 600, // Increase height
    width: 800   // Increase width
  };

  createResponsiveChart('teamPointsDistributionChart', [trace], layout);
}

function displayAllTeamsComparison() {
    const teams = {};
    cyclistData.cyclists.forEach(cyclist => {
        if (!teams[cyclist.team]) {
            teams[cyclist.team] = 0;
        }
        teams[cyclist.team] += cyclist.points;
    });

    const sortedTeams = Object.entries(teams).sort((a, b) => b[1] - a[1]);

    const trace = {
        x: sortedTeams.map(team => team[0]),
        y: sortedTeams.map(team => team[1]),
        type: 'bar',
        marker: {
            color: sortedTeams.map((team, index) => `hsl(${index * 360 / sortedTeams.length}, 70%, 50%)`),
        },
        text: sortedTeams.map(team => `${team[1]} points`),
        textposition: 'auto',
        hoverinfo: 'text',
        hovertext: sortedTeams.map(team => `${team[0]}<br>${team[1]} points`)
    };

    const layout = {
        title: {
            text: 'Total Points Comparison Across All Teams',
            font: {
                family: 'VT323, monospace',
                color: '#ff1493'
            }
        },
        xaxis: {
            title: 'Teams',
            tickangle: -45,
        },
        yaxis: {
            title: 'Total Points',
        },
        paper_bgcolor: '#fff0f5',
        plot_bgcolor: '#fff0f5',
    };

    createResponsiveChart('allTeamsComparisonChart', [trace], layout);
}
function makeTableResponsive() {
    const table = document.getElementById('cyclistTable');
    const headerRow = table.querySelector('thead tr');
    const dataRows = table.querySelectorAll('tbody tr');
    
    function updateTableDisplay() {
        const windowWidth = window.innerWidth;
        const breakpoint = 768; // Adjust this value as needed
        
        if (windowWidth < breakpoint) {
            // Convert table to a list view for small screens
            headerRow.style.display = 'none';
            dataRows.forEach(row => {
                const cells = row.querySelectorAll('td');
                cells.forEach((cell, index) => {
                    const header = headerRow.cells[index].textContent;
                    cell.setAttribute('data-label', header);
                    cell.style.display = 'block';
                    cell.style.textAlign = 'right';
                    cell.style.paddingLeft = '50%';
                    cell.style.position = 'relative';
                    cell.insertAdjacentHTML('afterbegin', `<span style="position: absolute; left: 6px; width: 45%; padding-right: 10px; text-align: left; font-weight: bold;">${header}:</span>`);
                });
            });
        } else {
            // Revert to normal table view for larger screens
            headerRow.style.display = '';
            dataRows.forEach(row => {
                const cells = row.querySelectorAll('td');
                cells.forEach(cell => {
                    cell.style.display = '';
                    cell.style.textAlign = '';
                    cell.style.paddingLeft = '';
                    cell.style.position = '';
                    const labelSpan = cell.querySelector('span');
                    if (labelSpan) {
                        labelSpan.remove();
                    }
                });
            });
        }
    }

    // Initial call to set up the table
    updateTableDisplay();

    // Update on window resize
    window.addEventListener('resize', updateTableDisplay);
}
{
  "cyclists": [
    {
      "name": "Primož Roglič",
      "team": "Red Bull - BORA - hansgrohe",
      "role": "All Rounder",
      "cost": 24.0,
      "ownership": 38.1,
      "points": 785.0,
      "cost_per_point": 0.030573248407643312,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 435.0
        },
        {
          "date": "2024-08-22",
          "points": 471.0
        },
        {
          "date": "2024-08-23",
          "points": 519.0
        },
        {
          "date": "2024-08-24",
          "points": 785.0
        }
      ]
    },
    {
      "name": "Sepp Kuss",
      "team": "Team Visma | Lease a Bike",
      "role": "Climber",
      "cost": 20.0,
      "ownership": 28.6,
      "points": 159.0,
      "cost_per_point": 0.12578616352201258,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 102.0
        },
        {
          "date": "2024-08-22",
          "points": 138.0
        },
        {
          "date": "2024-08-23",
          "points": 152.0
        },
        {
          "date": "2024-08-24",
          "points": 159.0
        }
      ]
    },
    {
      "name": "João Almeida",
      "team": "UAE Team Emirates",
      "role": "All Rounder",
      "cost": 20.0,
      "ownership": 47.9,
      "points": 406.0,
      "cost_per_point": 0.04926108374384237,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 352.0
        },
        {
          "date": "2024-08-22",
          "points": 378.0
        },
        {
          "date": "2024-08-23",
          "points": 404.0
        },
        {
          "date": "2024-08-24",
          "points": 406.0
        }
      ]
    },
    {
      "name": "Adam Yates",
      "team": "UAE Team Emirates",
      "role": "All Rounder",
      "cost": 20.0,
      "ownership": 29.7,
      "points": 68.0,
      "cost_per_point": 0.29411764705882354,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 50.0
        },
        {
          "date": "2024-08-22",
          "points": 56.0
        },
        {
          "date": "2024-08-23",
          "points": 62.0
        },
        {
          "date": "2024-08-24",
          "points": 68.0
        }
      ]
    },
    {
      "name": "Wout Van Aert",
      "team": "Team Visma | Lease a Bike",
      "role": "Sprinter",
      "cost": 18.0,
      "ownership": 53.5,
      "points": 1180.0,
      "cost_per_point": 0.015254237288135594,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 912.0
        },
        {
          "date": "2024-08-22",
          "points": 924.0
        },
        {
          "date": "2024-08-23",
          "points": 1168.0
        },
        {
          "date": "2024-08-24",
          "points": 1180.0
        }
      ]
    },
    {
      "name": "Enric Mas",
      "team": "Movistar Team",
      "role": "Climber",
      "cost": 16.0,
      "ownership": 8.9,
      "points": 432.0,
      "cost_per_point": 0.037037037037037035,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 188.0
        },
        {
          "date": "2024-08-22",
          "points": 204.0
        },
        {
          "date": "2024-08-23",
          "points": 230.0
        },
        {
          "date": "2024-08-24",
          "points": 432.0
        }
      ]
    },
    {
      "name": "Carlos Rodríguez",
      "team": "INEOS Grenadiers",
      "role": "All Rounder",
      "cost": 14.0,
      "ownership": 23.4,
      "points": 127.0,
      "cost_per_point": 0.11023622047244094,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 6.0
        },
        {
          "date": "2024-08-22",
          "points": 7.0
        },
        {
          "date": "2024-08-23",
          "points": 8.0
        },
        {
          "date": "2024-08-24",
          "points": 127.0
        }
      ]
    },
    {
      "name": "Daniel Martínez",
      "team": "Red Bull - BORA - hansgrohe",
      "role": "All Rounder",
      "cost": 14.0,
      "ownership": 12.0,
      "points": 62.0,
      "cost_per_point": 0.22580645161290322,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 32.0
        },
        {
          "date": "2024-08-22",
          "points": 40.0
        },
        {
          "date": "2024-08-23",
          "points": 46.0
        },
        {
          "date": "2024-08-24",
          "points": 62.0
        }
      ]
    },
    {
      "name": "Mikel Landa",
      "team": "Soudal - Quick Step",
      "role": "Climber",
      "cost": 14.0,
      "ownership": 26.0,
      "points": 313.0,
      "cost_per_point": 0.04472843450479233,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 119.0
        },
        {
          "date": "2024-08-22",
          "points": 128.0
        },
        {
          "date": "2024-08-23",
          "points": 137.0
        },
        {
          "date": "2024-08-24",
          "points": 313.0
        }
      ]
    },
    {
      "name": "Kaden Groves",
      "team": "Alpecin-Deceuninck",
      "role": "Sprinter",
      "cost": 12.0,
      "ownership": 24.5,
      "points": 680.0,
      "cost_per_point": 0.01764705882352941,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 640.0
        },
        {
          "date": "2024-08-22",
          "points": 648.0
        },
        {
          "date": "2024-08-23",
          "points": 672.0
        },
        {
          "date": "2024-08-24",
          "points": 680.0
        }
      ]
    },
    {
      "name": "Richard Carapaz",
      "team": "EF Education-EasyPost",
      "role": "Climber",
      "cost": 12.0,
      "ownership": 44.2,
      "points": 84.0,
      "cost_per_point": 0.14285714285714285,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 16.0
        },
        {
          "date": "2024-08-23",
          "points": 51.0
        },
        {
          "date": "2024-08-24",
          "points": 84.0
        }
      ]
    },
    {
      "name": "Mattias Skjelmose",
      "team": "Lidl - Trek",
      "role": "All Rounder",
      "cost": 12.0,
      "ownership": 25.2,
      "points": 281.0,
      "cost_per_point": 0.042704626334519574,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 118.0
        },
        {
          "date": "2024-08-22",
          "points": 129.0
        },
        {
          "date": "2024-08-23",
          "points": 148.0
        },
        {
          "date": "2024-08-24",
          "points": 281.0
        }
      ]
    },
    {
      "name": "Cian Uijtdebroeks",
      "team": "Team Visma | Lease a Bike",
      "role": "Climber",
      "cost": 12.0,
      "ownership": 8.2,
      "points": 44.0,
      "cost_per_point": 0.2727272727272727,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 36.0
        },
        {
          "date": "2024-08-22",
          "points": 36.0
        },
        {
          "date": "2024-08-23",
          "points": 44.0
        },
        {
          "date": "2024-08-24",
          "points": 44.0
        }
      ]
    },
    {
      "name": "Isaac Del Toro",
      "team": "UAE Team Emirates",
      "role": "Climber",
      "cost": 12.0,
      "ownership": 14.9,
      "points": 162.0,
      "cost_per_point": 0.07407407407407407,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 62.0
        },
        {
          "date": "2024-08-22",
          "points": 140.0
        },
        {
          "date": "2024-08-23",
          "points": 148.0
        },
        {
          "date": "2024-08-24",
          "points": 162.0
        }
      ]
    },
    {
      "name": "Antonio Tiberi",
      "team": "Bahrain - Victorious",
      "role": "All Rounder",
      "cost": 10.0,
      "ownership": 10.9,
      "points": 373.0,
      "cost_per_point": 0.02680965147453083,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 138.0
        },
        {
          "date": "2024-08-22",
          "points": 160.0
        },
        {
          "date": "2024-08-23",
          "points": 215.0
        },
        {
          "date": "2024-08-24",
          "points": 373.0
        }
      ]
    },
    {
      "name": "Bryan Coquard",
      "team": "Cofidis",
      "role": "Sprinter",
      "cost": 10.0,
      "ownership": 6.5,
      "points": 250.0,
      "cost_per_point": 0.04,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 250.0
        },
        {
          "date": "2024-08-22",
          "points": 250.0
        },
        {
          "date": "2024-08-23",
          "points": 250.0
        },
        {
          "date": "2024-08-24",
          "points": 250.0
        }
      ]
    },
    {
      "name": "Felix Gall",
      "team": "Decathlon AG2R La Mondiale Team",
      "role": "Climber",
      "cost": 10.0,
      "ownership": 5.4,
      "points": 297.0,
      "cost_per_point": 0.03367003367003367,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 156.0
        },
        {
          "date": "2024-08-22",
          "points": 192.0
        },
        {
          "date": "2024-08-23",
          "points": 220.0
        },
        {
          "date": "2024-08-24",
          "points": 297.0
        }
      ]
    },
    {
      "name": "Ben O'Connor",
      "team": "Decathlon AG2R La Mondiale Team",
      "role": "Climber",
      "cost": 10.0,
      "ownership": 15.7,
      "points": 418.0,
      "cost_per_point": 0.023923444976076555,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 4.0
        },
        {
          "date": "2024-08-22",
          "points": 299.0
        },
        {
          "date": "2024-08-23",
          "points": 363.0
        },
        {
          "date": "2024-08-24",
          "points": 418.0
        }
      ]
    },
    {
      "name": "Thymen Arensman",
      "team": "INEOS Grenadiers",
      "role": "All Rounder",
      "cost": 10.0,
      "ownership": 9.9,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Jhonatan Narváez",
      "team": "INEOS Grenadiers",
      "role": "Unclassed",
      "cost": 10.0,
      "ownership": 16.7,
      "points": 95.0,
      "cost_per_point": 0.10526315789473684,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 95.0
        },
        {
          "date": "2024-08-22",
          "points": 95.0
        },
        {
          "date": "2024-08-23",
          "points": 95.0
        },
        {
          "date": "2024-08-24",
          "points": 95.0
        }
      ]
    },
    {
      "name": "Giulio Ciccone",
      "team": "Lidl - Trek",
      "role": "Climber",
      "cost": 10.0,
      "ownership": 11.5,
      "points": 16.0,
      "cost_per_point": 0.625,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 12.0
        },
        {
          "date": "2024-08-22",
          "points": 12.0
        },
        {
          "date": "2024-08-23",
          "points": 16.0
        },
        {
          "date": "2024-08-24",
          "points": 16.0
        }
      ]
    },
    {
      "name": "Tao Geoghegan Hart",
      "team": "Lidl - Trek",
      "role": "All Rounder",
      "cost": 10.0,
      "ownership": 7.6,
      "points": 16.0,
      "cost_per_point": 0.625,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 12.0
        },
        {
          "date": "2024-08-22",
          "points": 12.0
        },
        {
          "date": "2024-08-23",
          "points": 16.0
        },
        {
          "date": "2024-08-24",
          "points": 16.0
        }
      ]
    },
    {
      "name": "Lennert Van Eetvelt",
      "team": "Lotto Dstny",
      "role": "Climber",
      "cost": 10.0,
      "ownership": 10.6,
      "points": 518.0,
      "cost_per_point": 0.019305019305019305,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 344.0
        },
        {
          "date": "2024-08-22",
          "points": 369.0
        },
        {
          "date": "2024-08-23",
          "points": 433.0
        },
        {
          "date": "2024-08-24",
          "points": 518.0
        }
      ]
    },
    {
      "name": "Aleksandr Vlasov",
      "team": "Red Bull - BORA - hansgrohe",
      "role": "All Rounder",
      "cost": 10.0,
      "ownership": 3.0,
      "points": 270.0,
      "cost_per_point": 0.037037037037037035,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 182.0
        },
        {
          "date": "2024-08-22",
          "points": 238.0
        },
        {
          "date": "2024-08-23",
          "points": 252.0
        },
        {
          "date": "2024-08-24",
          "points": 270.0
        }
      ]
    },
    {
      "name": "Max Poole",
      "team": "Team dsm-firmenich PostNL",
      "role": "Climber",
      "cost": 10.0,
      "ownership": 4.5,
      "points": 78.0,
      "cost_per_point": 0.1282051282051282,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 8.0
        },
        {
          "date": "2024-08-22",
          "points": 8.0
        },
        {
          "date": "2024-08-23",
          "points": 78.0
        },
        {
          "date": "2024-08-24",
          "points": 78.0
        }
      ]
    },
    {
      "name": "Brandon McNulty",
      "team": "UAE Team Emirates",
      "role": "All Rounder",
      "cost": 10.0,
      "ownership": 4.3,
      "points": 402.0,
      "cost_per_point": 0.024875621890547265,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 388.0
        },
        {
          "date": "2024-08-22",
          "points": 394.0
        },
        {
          "date": "2024-08-23",
          "points": 400.0
        },
        {
          "date": "2024-08-24",
          "points": 402.0
        }
      ]
    },
    {
      "name": "Jay Vine",
      "team": "UAE Team Emirates",
      "role": "All Rounder",
      "cost": 10.0,
      "ownership": 3.0,
      "points": 146.0,
      "cost_per_point": 0.0684931506849315,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 102.0
        },
        {
          "date": "2024-08-22",
          "points": 138.0
        },
        {
          "date": "2024-08-23",
          "points": 144.0
        },
        {
          "date": "2024-08-24",
          "points": 146.0
        }
      ]
    },
    {
      "name": "Ide Schelling",
      "team": "Astana Qazaqstan Team",
      "role": "Sprinter",
      "cost": 8.0,
      "ownership": 0.8,
      "points": 20.0,
      "cost_per_point": 0.4,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 20.0
        },
        {
          "date": "2024-08-22",
          "points": 20.0
        },
        {
          "date": "2024-08-23",
          "points": 20.0
        },
        {
          "date": "2024-08-24",
          "points": 20.0
        }
      ]
    },
    {
      "name": "Damiano Caruso",
      "team": "Bahrain - Victorious",
      "role": "All Rounder",
      "cost": 8.0,
      "ownership": 1.9,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Guillaume Martin",
      "team": "Cofidis",
      "role": "Climber",
      "cost": 8.0,
      "ownership": 1.6,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Victor Lafay",
      "team": "Decathlon AG2R La Mondiale Team",
      "role": "Unclassed",
      "cost": 8.0,
      "ownership": 6.6,
      "points": 60.0,
      "cost_per_point": 0.13333333333333333,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 4.0
        },
        {
          "date": "2024-08-22",
          "points": 28.0
        },
        {
          "date": "2024-08-23",
          "points": 44.0
        },
        {
          "date": "2024-08-24",
          "points": 60.0
        }
      ]
    },
    {
      "name": "Valentin Paret-Peintre",
      "team": "Decathlon AG2R La Mondiale Team",
      "role": "Climber",
      "cost": 8.0,
      "ownership": 5.8,
      "points": 60.0,
      "cost_per_point": 0.13333333333333333,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 4.0
        },
        {
          "date": "2024-08-22",
          "points": 28.0
        },
        {
          "date": "2024-08-23",
          "points": 44.0
        },
        {
          "date": "2024-08-24",
          "points": 60.0
        }
      ]
    },
    {
      "name": "David Gaudu",
      "team": "Groupama - FDJ",
      "role": "Climber",
      "cost": 8.0,
      "ownership": 4.7,
      "points": 122.0,
      "cost_per_point": 0.06557377049180328,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 37.0
        },
        {
          "date": "2024-08-22",
          "points": 101.0
        },
        {
          "date": "2024-08-23",
          "points": 105.0
        },
        {
          "date": "2024-08-24",
          "points": 122.0
        }
      ]
    },
    {
      "name": "Joshua Tarling",
      "team": "INEOS Grenadiers",
      "role": "Unclassed",
      "cost": 8.0,
      "ownership": 29.5,
      "points": 141.0,
      "cost_per_point": 0.05673758865248227,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 141.0
        },
        {
          "date": "2024-08-22",
          "points": 141.0
        },
        {
          "date": "2024-08-23",
          "points": 141.0
        },
        {
          "date": "2024-08-24",
          "points": 141.0
        }
      ]
    },
    {
      "name": "Matthew Riccitello",
      "team": "Israel - Premier Tech",
      "role": "Climber",
      "cost": 8.0,
      "ownership": 6.6,
      "points": 134.0,
      "cost_per_point": 0.05970149253731343,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 130.0
        },
        {
          "date": "2024-08-22",
          "points": 134.0
        },
        {
          "date": "2024-08-23",
          "points": 134.0
        },
        {
          "date": "2024-08-24",
          "points": 134.0
        }
      ]
    },
    {
      "name": "Corbin Strong",
      "team": "Israel - Premier Tech",
      "role": "Sprinter",
      "cost": 8.0,
      "ownership": 5.2,
      "points": 399.0,
      "cost_per_point": 0.020050125313283207,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 393.0
        },
        {
          "date": "2024-08-22",
          "points": 399.0
        },
        {
          "date": "2024-08-23",
          "points": 399.0
        },
        {
          "date": "2024-08-24",
          "points": 399.0
        }
      ]
    },
    {
      "name": "Michael Woods",
      "team": "Israel - Premier Tech",
      "role": "Climber",
      "cost": 8.0,
      "ownership": 3.3,
      "points": 31.0,
      "cost_per_point": 0.25806451612903225,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 2.0
        },
        {
          "date": "2024-08-22",
          "points": 6.0
        },
        {
          "date": "2024-08-23",
          "points": 31.0
        },
        {
          "date": "2024-08-24",
          "points": 31.0
        }
      ]
    },
    {
      "name": "Patrick Konrad",
      "team": "Lidl - Trek",
      "role": "Unclassed",
      "cost": 8.0,
      "ownership": 3.4,
      "points": 36.0,
      "cost_per_point": 0.2222222222222222,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 12.0
        },
        {
          "date": "2024-08-22",
          "points": 32.0
        },
        {
          "date": "2024-08-23",
          "points": 36.0
        },
        {
          "date": "2024-08-24",
          "points": 36.0
        }
      ]
    },
    {
      "name": "Oier Lazkano",
      "team": "Movistar Team",
      "role": "Unclassed",
      "cost": 8.0,
      "ownership": 15.4,
      "points": 30.0,
      "cost_per_point": 0.26666666666666666,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 4.0
        },
        {
          "date": "2024-08-22",
          "points": 4.0
        },
        {
          "date": "2024-08-23",
          "points": 4.0
        },
        {
          "date": "2024-08-24",
          "points": 30.0
        }
      ]
    },
    {
      "name": "Nairo Quintana",
      "team": "Movistar Team",
      "role": "Climber",
      "cost": 8.0,
      "ownership": 3.5,
      "points": 10.0,
      "cost_per_point": 0.8,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 4.0
        },
        {
          "date": "2024-08-22",
          "points": 4.0
        },
        {
          "date": "2024-08-23",
          "points": 4.0
        },
        {
          "date": "2024-08-24",
          "points": 10.0
        }
      ]
    },
    {
      "name": "Einer Rubio",
      "team": "Movistar Team",
      "role": "Climber",
      "cost": 8.0,
      "ownership": 2.9,
      "points": 22.0,
      "cost_per_point": 0.36363636363636365,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 16.0
        },
        {
          "date": "2024-08-22",
          "points": 16.0
        },
        {
          "date": "2024-08-23",
          "points": 16.0
        },
        {
          "date": "2024-08-24",
          "points": 22.0
        }
      ]
    },
    {
      "name": "Pelayo Sánchez",
      "team": "Movistar Team",
      "role": "Unclassed",
      "cost": 8.0,
      "ownership": 9.1,
      "points": 65.0,
      "cost_per_point": 0.12307692307692308,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 4.0
        },
        {
          "date": "2024-08-22",
          "points": 51.0
        },
        {
          "date": "2024-08-23",
          "points": 55.0
        },
        {
          "date": "2024-08-24",
          "points": 65.0
        }
      ]
    },
    {
      "name": "Florian Lipowitz",
      "team": "Red Bull - BORA - hansgrohe",
      "role": "Climber",
      "cost": 8.0,
      "ownership": 4.3,
      "points": 388.0,
      "cost_per_point": 0.020618556701030927,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 102.0
        },
        {
          "date": "2024-08-22",
          "points": 306.0
        },
        {
          "date": "2024-08-23",
          "points": 325.0
        },
        {
          "date": "2024-08-24",
          "points": 388.0
        }
      ]
    },
    {
      "name": "Mauri Vansevenant",
      "team": "Soudal - Quick Step",
      "role": "Unclassed",
      "cost": 8.0,
      "ownership": 2.1,
      "points": 121.0,
      "cost_per_point": 0.06611570247933884,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 119.0
        },
        {
          "date": "2024-08-23",
          "points": 119.0
        },
        {
          "date": "2024-08-24",
          "points": 121.0
        }
      ]
    },
    {
      "name": "Pavel Bittner",
      "team": "Team dsm-firmenich PostNL",
      "role": "Sprinter",
      "cost": 8.0,
      "ownership": 4.8,
      "points": 474.0,
      "cost_per_point": 0.016877637130801686,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 456.0
        },
        {
          "date": "2024-08-22",
          "points": 462.0
        },
        {
          "date": "2024-08-23",
          "points": 468.0
        },
        {
          "date": "2024-08-24",
          "points": 474.0
        }
      ]
    },
    {
      "name": "Mauro Schmid",
      "team": "Team Jayco AlUla",
      "role": "Unclassed",
      "cost": 8.0,
      "ownership": 3.8,
      "points": 166.0,
      "cost_per_point": 0.04819277108433735,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 138.0
        },
        {
          "date": "2024-08-22",
          "points": 138.0
        },
        {
          "date": "2024-08-23",
          "points": 138.0
        },
        {
          "date": "2024-08-24",
          "points": 166.0
        }
      ]
    },
    {
      "name": "Pavel Sivakov",
      "team": "UAE Team Emirates",
      "role": "Climber",
      "cost": 8.0,
      "ownership": 1.4,
      "points": 163.0,
      "cost_per_point": 0.049079754601226995,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 130.0
        },
        {
          "date": "2024-08-22",
          "points": 147.0
        },
        {
          "date": "2024-08-23",
          "points": 160.0
        },
        {
          "date": "2024-08-24",
          "points": 163.0
        }
      ]
    },
    {
      "name": "Marc Soler",
      "team": "UAE Team Emirates",
      "role": "All Rounder",
      "cost": 8.0,
      "ownership": 3.9,
      "points": 64.0,
      "cost_per_point": 0.125,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 50.0
        },
        {
          "date": "2024-08-22",
          "points": 56.0
        },
        {
          "date": "2024-08-23",
          "points": 62.0
        },
        {
          "date": "2024-08-24",
          "points": 64.0
        }
      ]
    },
    {
      "name": "Maurice Ballerstedt",
      "team": "Alpecin-Deceuninck",
      "role": "Sprinter",
      "cost": 6.0,
      "ownership": 0.5,
      "points": 18.0,
      "cost_per_point": 0.3333333333333333,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 18.0
        },
        {
          "date": "2024-08-22",
          "points": 18.0
        },
        {
          "date": "2024-08-23",
          "points": 18.0
        },
        {
          "date": "2024-08-24",
          "points": 18.0
        }
      ]
    },
    {
      "name": "Quinten Hermans",
      "team": "Alpecin-Deceuninck",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 3.0,
      "points": 134.0,
      "cost_per_point": 0.04477611940298507,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 14.0
        },
        {
          "date": "2024-08-22",
          "points": 14.0
        },
        {
          "date": "2024-08-23",
          "points": 134.0
        },
        {
          "date": "2024-08-24",
          "points": 134.0
        }
      ]
    },
    {
      "name": "Xandro Meurisse",
      "team": "Alpecin-Deceuninck",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 0.1,
      "points": 14.0,
      "cost_per_point": 0.42857142857142855,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 14.0
        },
        {
          "date": "2024-08-22",
          "points": 14.0
        },
        {
          "date": "2024-08-23",
          "points": 14.0
        },
        {
          "date": "2024-08-24",
          "points": 14.0
        }
      ]
    },
    {
      "name": "Élie Gesbert",
      "team": "Arkéa - B&B Hotels",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 0.2,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Thibault Guernalec",
      "team": "Arkéa - B&B Hotels",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 0.2,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Cristián Rodríguez",
      "team": "Arkéa - B&B Hotels",
      "role": "Climber",
      "cost": 6.0,
      "ownership": 0.9,
      "points": 240.0,
      "cost_per_point": 0.025,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 8.0
        },
        {
          "date": "2024-08-22",
          "points": 185.0
        },
        {
          "date": "2024-08-23",
          "points": 201.0
        },
        {
          "date": "2024-08-24",
          "points": 240.0
        }
      ]
    },
    {
      "name": "Gleb Brussenskiy",
      "team": "Astana Qazaqstan Team",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 0.3,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Lorenzo Fortunato",
      "team": "Astana Qazaqstan Team",
      "role": "Climber",
      "cost": 6.0,
      "ownership": 5.1,
      "points": 35.0,
      "cost_per_point": 0.17142857142857143,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 35.0
        },
        {
          "date": "2024-08-22",
          "points": 35.0
        },
        {
          "date": "2024-08-23",
          "points": 35.0
        },
        {
          "date": "2024-08-24",
          "points": 35.0
        }
      ]
    },
    {
      "name": "Harold Martin López",
      "team": "Astana Qazaqstan Team",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 0.3,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Harold Tejada",
      "team": "Astana Qazaqstan Team",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 4.2,
      "points": 246.0,
      "cost_per_point": 0.024390243902439025,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 25.0
        },
        {
          "date": "2024-08-23",
          "points": 105.0
        },
        {
          "date": "2024-08-24",
          "points": 246.0
        }
      ]
    },
    {
      "name": "Jack Haig",
      "team": "Bahrain - Victorious",
      "role": "Climber",
      "cost": 6.0,
      "ownership": 1.9,
      "points": 130.0,
      "cost_per_point": 0.046153846153846156,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 30.0
        },
        {
          "date": "2024-08-22",
          "points": 35.0
        },
        {
          "date": "2024-08-23",
          "points": 60.0
        },
        {
          "date": "2024-08-24",
          "points": 130.0
        }
      ]
    },
    {
      "name": "Torstein Træen",
      "team": "Bahrain - Victorious",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 1.2,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Kenny Elissonde",
      "team": "Cofidis",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 1.4,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Jesús Herrada",
      "team": "Cofidis",
      "role": "Climber",
      "cost": 6.0,
      "ownership": 1.6,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Ion Izagirre",
      "team": "Cofidis",
      "role": "All Rounder",
      "cost": 6.0,
      "ownership": 1.3,
      "points": 36.0,
      "cost_per_point": 0.16666666666666666,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 36.0
        }
      ]
    },
    {
      "name": "Bruno Armirail",
      "team": "Decathlon AG2R La Mondiale Team",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 5.1,
      "points": 217.0,
      "cost_per_point": 0.027649769585253458,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 157.0
        },
        {
          "date": "2024-08-22",
          "points": 181.0
        },
        {
          "date": "2024-08-23",
          "points": 201.0
        },
        {
          "date": "2024-08-24",
          "points": 217.0
        }
      ]
    },
    {
      "name": "Clément Berthet",
      "team": "Decathlon AG2R La Mondiale Team",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 1.5,
      "points": 252.0,
      "cost_per_point": 0.023809523809523808,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 4.0
        },
        {
          "date": "2024-08-22",
          "points": 210.0
        },
        {
          "date": "2024-08-23",
          "points": 236.0
        },
        {
          "date": "2024-08-24",
          "points": 252.0
        }
      ]
    },
    {
      "name": "Geoffrey Bouchard",
      "team": "Decathlon AG2R La Mondiale Team",
      "role": "Climber",
      "cost": 6.0,
      "ownership": 0.5,
      "points": 60.0,
      "cost_per_point": 0.1,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 4.0
        },
        {
          "date": "2024-08-22",
          "points": 28.0
        },
        {
          "date": "2024-08-23",
          "points": 44.0
        },
        {
          "date": "2024-08-24",
          "points": 60.0
        }
      ]
    },
    {
      "name": "Sander De Pestel",
      "team": "Decathlon AG2R La Mondiale Team",
      "role": "Sprinter",
      "cost": 6.0,
      "ownership": 0.2,
      "points": 60.0,
      "cost_per_point": 0.1,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 4.0
        },
        {
          "date": "2024-08-22",
          "points": 28.0
        },
        {
          "date": "2024-08-23",
          "points": 44.0
        },
        {
          "date": "2024-08-24",
          "points": 60.0
        }
      ]
    },
    {
      "name": "Jefferson Alexander Cepeda",
      "team": "EF Education-EasyPost",
      "role": "Climber",
      "cost": 6.0,
      "ownership": 0.8,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Rui Costa",
      "team": "EF Education-EasyPost",
      "role": "All Rounder",
      "cost": 6.0,
      "ownership": 2.5,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Owain Doull",
      "team": "EF Education-EasyPost",
      "role": "Sprinter",
      "cost": 6.0,
      "ownership": 0.8,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Darren Rafferty",
      "team": "EF Education-EasyPost",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 1.2,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "James Shaw",
      "team": "EF Education-EasyPost",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 1.3,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Harry Sweeny",
      "team": "EF Education-EasyPost",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 0.7,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Rigoberto Urán",
      "team": "EF Education-EasyPost",
      "role": "All Rounder",
      "cost": 6.0,
      "ownership": 1.5,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Pablo Castrillo",
      "team": "Equipo Kern Pharma",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 3.7,
      "points": 65.0,
      "cost_per_point": 0.09230769230769231,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 43.0
        },
        {
          "date": "2024-08-22",
          "points": 63.0
        },
        {
          "date": "2024-08-23",
          "points": 65.0
        },
        {
          "date": "2024-08-24",
          "points": 65.0
        }
      ]
    },
    {
      "name": "Pau Miquel",
      "team": "Equipo Kern Pharma",
      "role": "Sprinter",
      "cost": 6.0,
      "ownership": 0.2,
      "points": 375.0,
      "cost_per_point": 0.016,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 215.0
        },
        {
          "date": "2024-08-22",
          "points": 215.0
        },
        {
          "date": "2024-08-23",
          "points": 375.0
        },
        {
          "date": "2024-08-24",
          "points": 375.0
        }
      ]
    },
    {
      "name": "Antonio Jesús Soto",
      "team": "Equipo Kern Pharma",
      "role": "Sprinter",
      "cost": 6.0,
      "ownership": 0.2,
      "points": 182.0,
      "cost_per_point": 0.03296703296703297,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 180.0
        },
        {
          "date": "2024-08-22",
          "points": 180.0
        },
        {
          "date": "2024-08-23",
          "points": 182.0
        },
        {
          "date": "2024-08-24",
          "points": 182.0
        }
      ]
    },
    {
      "name": "Jon Aberasturi",
      "team": "Euskaltel - Euskadi",
      "role": "Sprinter",
      "cost": 6.0,
      "ownership": 1.7,
      "points": 291.0,
      "cost_per_point": 0.020618556701030927,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 291.0
        },
        {
          "date": "2024-08-22",
          "points": 291.0
        },
        {
          "date": "2024-08-23",
          "points": 291.0
        },
        {
          "date": "2024-08-24",
          "points": 291.0
        }
      ]
    },
    {
      "name": "Mikel Bizkarra",
      "team": "Euskaltel - Euskadi",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 2.3,
      "points": 26.0,
      "cost_per_point": 0.23076923076923078,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 26.0
        },
        {
          "date": "2024-08-22",
          "points": 26.0
        },
        {
          "date": "2024-08-23",
          "points": 26.0
        },
        {
          "date": "2024-08-24",
          "points": 26.0
        }
      ]
    },
    {
      "name": "Joan Bou",
      "team": "Euskaltel - Euskadi",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 1.0,
      "points": 52.0,
      "cost_per_point": 0.11538461538461539,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 2.0
        },
        {
          "date": "2024-08-22",
          "points": 52.0
        },
        {
          "date": "2024-08-23",
          "points": 52.0
        },
        {
          "date": "2024-08-24",
          "points": 52.0
        }
      ]
    },
    {
      "name": "Txomin Juaristi",
      "team": "Euskaltel - Euskadi",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 0.5,
      "points": 22.0,
      "cost_per_point": 0.2727272727272727,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 22.0
        },
        {
          "date": "2024-08-22",
          "points": 22.0
        },
        {
          "date": "2024-08-23",
          "points": 22.0
        },
        {
          "date": "2024-08-24",
          "points": 22.0
        }
      ]
    },
    {
      "name": "Gotzon Martín",
      "team": "Euskaltel - Euskadi",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 0.2,
      "points": 53.0,
      "cost_per_point": 0.11320754716981132,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 53.0
        },
        {
          "date": "2024-08-22",
          "points": 53.0
        },
        {
          "date": "2024-08-23",
          "points": 53.0
        },
        {
          "date": "2024-08-24",
          "points": 53.0
        }
      ]
    },
    {
      "name": "Luis Ángel Maté",
      "team": "Euskaltel - Euskadi",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 1.0,
      "points": 124.0,
      "cost_per_point": 0.04838709677419355,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 117.0
        },
        {
          "date": "2024-08-22",
          "points": 120.0
        },
        {
          "date": "2024-08-23",
          "points": 122.0
        },
        {
          "date": "2024-08-24",
          "points": 124.0
        }
      ]
    },
    {
      "name": "Sven Erik Bystrøm",
      "team": "Groupama - FDJ",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 0.3,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Kevin Geniets",
      "team": "Groupama - FDJ",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 0.3,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Stefan Küng",
      "team": "Groupama - FDJ",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 8.6,
      "points": 523.0,
      "cost_per_point": 0.011472275334608031,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 380.0
        },
        {
          "date": "2024-08-22",
          "points": 380.0
        },
        {
          "date": "2024-08-23",
          "points": 522.0
        },
        {
          "date": "2024-08-24",
          "points": 523.0
        }
      ]
    },
    {
      "name": "Quentin Pacher",
      "team": "Groupama - FDJ",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 3.9,
      "points": 110.0,
      "cost_per_point": 0.05454545454545454,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 110.0
        },
        {
          "date": "2024-08-24",
          "points": 110.0
        }
      ]
    },
    {
      "name": "Rémy Rochas",
      "team": "Groupama - FDJ",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 0.3,
      "points": 35.0,
      "cost_per_point": 0.17142857142857143,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 35.0
        },
        {
          "date": "2024-08-23",
          "points": 35.0
        },
        {
          "date": "2024-08-24",
          "points": 35.0
        }
      ]
    },
    {
      "name": "Laurens De Plus",
      "team": "INEOS Grenadiers",
      "role": "All Rounder",
      "cost": 6.0,
      "ownership": 1.8,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Kim Heiduk",
      "team": "INEOS Grenadiers",
      "role": "Sprinter",
      "cost": 6.0,
      "ownership": 0.3,
      "points": 25.0,
      "cost_per_point": 0.24,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 25.0
        },
        {
          "date": "2024-08-22",
          "points": 25.0
        },
        {
          "date": "2024-08-23",
          "points": 25.0
        },
        {
          "date": "2024-08-24",
          "points": 25.0
        }
      ]
    },
    {
      "name": "Brandon Smith Rivera",
      "team": "INEOS Grenadiers",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 0.9,
      "points": 70.0,
      "cost_per_point": 0.08571428571428572,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 70.0
        },
        {
          "date": "2024-08-22",
          "points": 70.0
        },
        {
          "date": "2024-08-23",
          "points": 70.0
        },
        {
          "date": "2024-08-24",
          "points": 70.0
        }
      ]
    },
    {
      "name": "Óscar Rodríguez",
      "team": "INEOS Grenadiers",
      "role": "Climber",
      "cost": 6.0,
      "ownership": 1.0,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Vito Braet",
      "team": "Intermarché - Wanty",
      "role": "Sprinter",
      "cost": 6.0,
      "ownership": 0.3,
      "points": 50.0,
      "cost_per_point": 0.12,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 50.0
        },
        {
          "date": "2024-08-22",
          "points": 50.0
        },
        {
          "date": "2024-08-23",
          "points": 50.0
        },
        {
          "date": "2024-08-24",
          "points": 50.0
        }
      ]
    },
    {
      "name": "Kobe Goossens",
      "team": "Intermarché - Wanty",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 0.7,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Arne Marit",
      "team": "Intermarché - Wanty",
      "role": "Sprinter",
      "cost": 6.0,
      "ownership": 0.6,
      "points": 240.0,
      "cost_per_point": 0.025,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 240.0
        },
        {
          "date": "2024-08-22",
          "points": 240.0
        },
        {
          "date": "2024-08-23",
          "points": 240.0
        },
        {
          "date": "2024-08-24",
          "points": 240.0
        }
      ]
    },
    {
      "name": "Louis Meintjes",
      "team": "Intermarché - Wanty",
      "role": "Climber",
      "cost": 6.0,
      "ownership": 2.0,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Lorenzo Rota",
      "team": "Intermarché - Wanty",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 0.8,
      "points": 155.0,
      "cost_per_point": 0.03870967741935484,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 60.0
        },
        {
          "date": "2024-08-22",
          "points": 60.0
        },
        {
          "date": "2024-08-23",
          "points": 155.0
        },
        {
          "date": "2024-08-24",
          "points": 155.0
        }
      ]
    },
    {
      "name": "Rein Taaramäe",
      "team": "Intermarché - Wanty",
      "role": "Climber",
      "cost": 6.0,
      "ownership": 0.4,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "George Bennett",
      "team": "Israel - Premier Tech",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 10.7,
      "points": 180.0,
      "cost_per_point": 0.03333333333333333,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 82.0
        },
        {
          "date": "2024-08-22",
          "points": 89.0
        },
        {
          "date": "2024-08-23",
          "points": 152.0
        },
        {
          "date": "2024-08-24",
          "points": 180.0
        }
      ]
    },
    {
      "name": "Marco Frigo",
      "team": "Israel - Premier Tech",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 0.9,
      "points": 219.0,
      "cost_per_point": 0.0273972602739726,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 17.0
        },
        {
          "date": "2024-08-22",
          "points": 219.0
        },
        {
          "date": "2024-08-23",
          "points": 219.0
        },
        {
          "date": "2024-08-24",
          "points": 219.0
        }
      ]
    },
    {
      "name": "Riley Sheehan",
      "team": "Israel - Premier Tech",
      "role": "Sprinter",
      "cost": 6.0,
      "ownership": 0.5,
      "points": 6.0,
      "cost_per_point": 1.0,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 2.0
        },
        {
          "date": "2024-08-22",
          "points": 6.0
        },
        {
          "date": "2024-08-23",
          "points": 6.0
        },
        {
          "date": "2024-08-24",
          "points": 6.0
        }
      ]
    },
    {
      "name": "Dylan Teuns",
      "team": "Israel - Premier Tech",
      "role": "Climber",
      "cost": 6.0,
      "ownership": 1.5,
      "points": 6.0,
      "cost_per_point": 1.0,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 2.0
        },
        {
          "date": "2024-08-22",
          "points": 6.0
        },
        {
          "date": "2024-08-23",
          "points": 6.0
        },
        {
          "date": "2024-08-24",
          "points": 6.0
        }
      ]
    },
    {
      "name": "Sam Oomen",
      "team": "Lidl - Trek",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 0.5,
      "points": 36.0,
      "cost_per_point": 0.16666666666666666,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 12.0
        },
        {
          "date": "2024-08-22",
          "points": 12.0
        },
        {
          "date": "2024-08-23",
          "points": 16.0
        },
        {
          "date": "2024-08-24",
          "points": 36.0
        }
      ]
    },
    {
      "name": "Mathias Vacek",
      "team": "Lidl - Trek",
      "role": "Sprinter",
      "cost": 6.0,
      "ownership": 8.3,
      "points": 502.0,
      "cost_per_point": 0.01195219123505976,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 316.0
        },
        {
          "date": "2024-08-22",
          "points": 316.0
        },
        {
          "date": "2024-08-23",
          "points": 500.0
        },
        {
          "date": "2024-08-24",
          "points": 502.0
        }
      ]
    },
    {
      "name": "Carlos Verona",
      "team": "Lidl - Trek",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 1.7,
      "points": 16.0,
      "cost_per_point": 0.375,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 12.0
        },
        {
          "date": "2024-08-22",
          "points": 12.0
        },
        {
          "date": "2024-08-23",
          "points": 16.0
        },
        {
          "date": "2024-08-24",
          "points": 16.0
        }
      ]
    },
    {
      "name": "Victor Campenaerts",
      "team": "Lotto Dstny",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 19.1,
      "points": 4.0,
      "cost_per_point": 1.5,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 4.0
        },
        {
          "date": "2024-08-22",
          "points": 4.0
        },
        {
          "date": "2024-08-23",
          "points": 4.0
        },
        {
          "date": "2024-08-24",
          "points": 4.0
        }
      ]
    },
    {
      "name": "Thomas De Gendt",
      "team": "Lotto Dstny",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 6.6,
      "points": 4.0,
      "cost_per_point": 1.5,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 4.0
        },
        {
          "date": "2024-08-22",
          "points": 4.0
        },
        {
          "date": "2024-08-23",
          "points": 4.0
        },
        {
          "date": "2024-08-24",
          "points": 4.0
        }
      ]
    },
    {
      "name": "Jonas Gregaard",
      "team": "Lotto Dstny",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 0.3,
      "points": 4.0,
      "cost_per_point": 1.5,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 4.0
        },
        {
          "date": "2024-08-22",
          "points": 4.0
        },
        {
          "date": "2024-08-23",
          "points": 4.0
        },
        {
          "date": "2024-08-24",
          "points": 4.0
        }
      ]
    },
    {
      "name": "Andreas Kron",
      "team": "Lotto Dstny",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 9.0,
      "points": 38.0,
      "cost_per_point": 0.15789473684210525,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 38.0
        },
        {
          "date": "2024-08-22",
          "points": 38.0
        },
        {
          "date": "2024-08-23",
          "points": 38.0
        },
        {
          "date": "2024-08-24",
          "points": 38.0
        }
      ]
    },
    {
      "name": "Sylvain Moniquet",
      "team": "Lotto Dstny",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 0.2,
      "points": 95.0,
      "cost_per_point": 0.06315789473684211,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 63.0
        },
        {
          "date": "2024-08-22",
          "points": 75.0
        },
        {
          "date": "2024-08-23",
          "points": 87.0
        },
        {
          "date": "2024-08-24",
          "points": 95.0
        }
      ]
    },
    {
      "name": "Eduardo Sepúlveda",
      "team": "Lotto Dstny",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 0.4,
      "points": 4.0,
      "cost_per_point": 1.5,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 4.0
        },
        {
          "date": "2024-08-22",
          "points": 4.0
        },
        {
          "date": "2024-08-23",
          "points": 4.0
        },
        {
          "date": "2024-08-24",
          "points": 4.0
        }
      ]
    },
    {
      "name": "Carlos Canal",
      "team": "Movistar Team",
      "role": "Sprinter",
      "cost": 6.0,
      "ownership": 0.6,
      "points": 113.0,
      "cost_per_point": 0.05309734513274336,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 107.0
        },
        {
          "date": "2024-08-22",
          "points": 107.0
        },
        {
          "date": "2024-08-23",
          "points": 107.0
        },
        {
          "date": "2024-08-24",
          "points": 113.0
        }
      ]
    },
    {
      "name": "Nelson Oliveira",
      "team": "Movistar Team",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 2.5,
      "points": 91.0,
      "cost_per_point": 0.06593406593406594,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 85.0
        },
        {
          "date": "2024-08-22",
          "points": 85.0
        },
        {
          "date": "2024-08-23",
          "points": 85.0
        },
        {
          "date": "2024-08-24",
          "points": 91.0
        }
      ]
    },
    {
      "name": "Roger Adrià",
      "team": "Red Bull - BORA - hansgrohe",
      "role": "Sprinter",
      "cost": 6.0,
      "ownership": 1.9,
      "points": 82.0,
      "cost_per_point": 0.07317073170731707,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 52.0
        },
        {
          "date": "2024-08-22",
          "points": 60.0
        },
        {
          "date": "2024-08-23",
          "points": 66.0
        },
        {
          "date": "2024-08-24",
          "points": 82.0
        }
      ]
    },
    {
      "name": "Giovanni Aleotti",
      "team": "Red Bull - BORA - hansgrohe",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 2.0,
      "points": 62.0,
      "cost_per_point": 0.0967741935483871,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 32.0
        },
        {
          "date": "2024-08-22",
          "points": 40.0
        },
        {
          "date": "2024-08-23",
          "points": 46.0
        },
        {
          "date": "2024-08-24",
          "points": 62.0
        }
      ]
    },
    {
      "name": "Nico Denz",
      "team": "Red Bull - BORA - hansgrohe",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 1.9,
      "points": 78.0,
      "cost_per_point": 0.07692307692307693,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 40.0
        },
        {
          "date": "2024-08-22",
          "points": 48.0
        },
        {
          "date": "2024-08-23",
          "points": 62.0
        },
        {
          "date": "2024-08-24",
          "points": 78.0
        }
      ]
    },
    {
      "name": "Patrick Gamper",
      "team": "Red Bull - BORA - hansgrohe",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 0.4,
      "points": 62.0,
      "cost_per_point": 0.0967741935483871,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 32.0
        },
        {
          "date": "2024-08-22",
          "points": 40.0
        },
        {
          "date": "2024-08-23",
          "points": 46.0
        },
        {
          "date": "2024-08-24",
          "points": 62.0
        }
      ]
    },
    {
      "name": "Kasper Asgreen",
      "team": "Soudal - Quick Step",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 12.0,
      "points": 58.0,
      "cost_per_point": 0.10344827586206896,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 56.0
        },
        {
          "date": "2024-08-22",
          "points": 56.0
        },
        {
          "date": "2024-08-23",
          "points": 56.0
        },
        {
          "date": "2024-08-24",
          "points": 58.0
        }
      ]
    },
    {
      "name": "Mattia Cattaneo",
      "team": "Soudal - Quick Step",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 1.3,
      "points": 35.0,
      "cost_per_point": 0.17142857142857143,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 33.0
        },
        {
          "date": "2024-08-22",
          "points": 33.0
        },
        {
          "date": "2024-08-23",
          "points": 33.0
        },
        {
          "date": "2024-08-24",
          "points": 35.0
        }
      ]
    },
    {
      "name": "James Knox",
      "team": "Soudal - Quick Step",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 1.4,
      "points": 2.0,
      "cost_per_point": 3.0,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 2.0
        }
      ]
    },
    {
      "name": "William Junior Lecerf",
      "team": "Soudal - Quick Step",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 1.1,
      "points": 2.0,
      "cost_per_point": 3.0,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 2.0
        }
      ]
    },
    {
      "name": "Casper Pedersen",
      "team": "Soudal - Quick Step",
      "role": "Sprinter",
      "cost": 6.0,
      "ownership": 2.5,
      "points": 2.0,
      "cost_per_point": 3.0,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 2.0
        }
      ]
    },
    {
      "name": "Louis Vervaeke",
      "team": "Soudal - Quick Step",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 0.3,
      "points": 2.0,
      "cost_per_point": 3.0,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 2.0
        }
      ]
    },
    {
      "name": "Chris Hamilton",
      "team": "Team dsm-firmenich PostNL",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 0.7,
      "points": 8.0,
      "cost_per_point": 0.75,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 8.0
        },
        {
          "date": "2024-08-22",
          "points": 8.0
        },
        {
          "date": "2024-08-23",
          "points": 8.0
        },
        {
          "date": "2024-08-24",
          "points": 8.0
        }
      ]
    },
    {
      "name": "Gijs Leemreize",
      "team": "Team dsm-firmenich PostNL",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 0.3,
      "points": 158.0,
      "cost_per_point": 0.0379746835443038,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 8.0
        },
        {
          "date": "2024-08-22",
          "points": 138.0
        },
        {
          "date": "2024-08-23",
          "points": 138.0
        },
        {
          "date": "2024-08-24",
          "points": 158.0
        }
      ]
    },
    {
      "name": "Alessandro De Marchi",
      "team": "Team Jayco AlUla",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 1.4,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Eddie Dunbar",
      "team": "Team Jayco AlUla",
      "role": "All Rounder",
      "cost": 6.0,
      "ownership": 2.1,
      "points": 110.0,
      "cost_per_point": 0.05454545454545454,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 30.0
        },
        {
          "date": "2024-08-24",
          "points": 110.0
        }
      ]
    },
    {
      "name": "Felix Engelhardt",
      "team": "Team Jayco AlUla",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 0.9,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Chris Harper",
      "team": "Team Jayco AlUla",
      "role": "Climber",
      "cost": 6.0,
      "ownership": 0.6,
      "points": 24.0,
      "cost_per_point": 0.25,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 24.0
        },
        {
          "date": "2024-08-23",
          "points": 24.0
        },
        {
          "date": "2024-08-24",
          "points": 24.0
        }
      ]
    },
    {
      "name": "Callum Scotson",
      "team": "Team Jayco AlUla",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 0.2,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Filippo Zana",
      "team": "Team Jayco AlUla",
      "role": "Climber",
      "cost": 6.0,
      "ownership": 4.9,
      "points": 66.0,
      "cost_per_point": 0.09090909090909091,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 46.0
        },
        {
          "date": "2024-08-22",
          "points": 54.0
        },
        {
          "date": "2024-08-23",
          "points": 60.0
        },
        {
          "date": "2024-08-24",
          "points": 66.0
        }
      ]
    },
    {
      "name": "Edoardo Affini",
      "team": "Team Visma | Lease a Bike",
      "role": "Sprinter",
      "cost": 6.0,
      "ownership": 2.1,
      "points": 214.0,
      "cost_per_point": 0.028037383177570093,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 206.0
        },
        {
          "date": "2024-08-22",
          "points": 206.0
        },
        {
          "date": "2024-08-23",
          "points": 214.0
        },
        {
          "date": "2024-08-24",
          "points": 214.0
        }
      ]
    },
    {
      "name": "Robert Gesink",
      "team": "Team Visma | Lease a Bike",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 1.8,
      "points": 44.0,
      "cost_per_point": 0.13636363636363635,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 36.0
        },
        {
          "date": "2024-08-22",
          "points": 36.0
        },
        {
          "date": "2024-08-23",
          "points": 44.0
        },
        {
          "date": "2024-08-24",
          "points": 44.0
        }
      ]
    },
    {
      "name": "Steven Kruijswijk",
      "team": "Team Visma | Lease a Bike",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 3.3,
      "points": 44.0,
      "cost_per_point": 0.13636363636363635,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 36.0
        },
        {
          "date": "2024-08-22",
          "points": 36.0
        },
        {
          "date": "2024-08-23",
          "points": 44.0
        },
        {
          "date": "2024-08-24",
          "points": 44.0
        }
      ]
    },
    {
      "name": "Attila Valter",
      "team": "Team Visma | Lease a Bike",
      "role": "Climber",
      "cost": 6.0,
      "ownership": 1.5,
      "points": 44.0,
      "cost_per_point": 0.13636363636363635,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 36.0
        },
        {
          "date": "2024-08-22",
          "points": 36.0
        },
        {
          "date": "2024-08-23",
          "points": 44.0
        },
        {
          "date": "2024-08-24",
          "points": 44.0
        }
      ]
    },
    {
      "name": "Dylan Van Baarle",
      "team": "Team Visma | Lease a Bike",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 3.2,
      "points": 14.0,
      "cost_per_point": 0.42857142857142855,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 14.0
        },
        {
          "date": "2024-08-22",
          "points": 14.0
        },
        {
          "date": "2024-08-23",
          "points": 14.0
        },
        {
          "date": "2024-08-24",
          "points": 14.0
        }
      ]
    },
    {
      "name": "Filippo Baroncini",
      "team": "UAE Team Emirates",
      "role": "Unclassed",
      "cost": 6.0,
      "ownership": 2.1,
      "points": 168.0,
      "cost_per_point": 0.03571428571428571,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 154.0
        },
        {
          "date": "2024-08-22",
          "points": 160.0
        },
        {
          "date": "2024-08-23",
          "points": 166.0
        },
        {
          "date": "2024-08-24",
          "points": 168.0
        }
      ]
    },
    {
      "name": "Juri Hollmann",
      "team": "Alpecin-Deceuninck",
      "role": "Unclassed",
      "cost": 4.0,
      "ownership": 1.9,
      "points": 14.0,
      "cost_per_point": 0.2857142857142857,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 14.0
        },
        {
          "date": "2024-08-22",
          "points": 14.0
        },
        {
          "date": "2024-08-23",
          "points": 14.0
        },
        {
          "date": "2024-08-24",
          "points": 14.0
        }
      ]
    },
    {
      "name": "Edward Planckaert",
      "team": "Alpecin-Deceuninck",
      "role": "Unclassed",
      "cost": 4.0,
      "ownership": 2.3,
      "points": 18.0,
      "cost_per_point": 0.2222222222222222,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 18.0
        },
        {
          "date": "2024-08-22",
          "points": 18.0
        },
        {
          "date": "2024-08-23",
          "points": 18.0
        },
        {
          "date": "2024-08-24",
          "points": 18.0
        }
      ]
    },
    {
      "name": "Oscar Riesebeek",
      "team": "Alpecin-Deceuninck",
      "role": "Unclassed",
      "cost": 4.0,
      "ownership": 1.7,
      "points": 14.0,
      "cost_per_point": 0.2857142857142857,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 14.0
        },
        {
          "date": "2024-08-22",
          "points": 14.0
        },
        {
          "date": "2024-08-23",
          "points": 14.0
        },
        {
          "date": "2024-08-24",
          "points": 14.0
        }
      ]
    },
    {
      "name": "Luca Vergallito",
      "team": "Alpecin-Deceuninck",
      "role": "Unclassed",
      "cost": 4.0,
      "ownership": 3.6,
      "points": 98.0,
      "cost_per_point": 0.04081632653061224,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 14.0
        },
        {
          "date": "2024-08-22",
          "points": 34.0
        },
        {
          "date": "2024-08-23",
          "points": 34.0
        },
        {
          "date": "2024-08-24",
          "points": 98.0
        }
      ]
    },
    {
      "name": "Simon Guglielmi",
      "team": "Arkéa - B&B Hotels",
      "role": "Unclassed",
      "cost": 4.0,
      "ownership": 1.1,
      "points": 56.0,
      "cost_per_point": 0.07142857142857142,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 56.0
        },
        {
          "date": "2024-08-22",
          "points": 56.0
        },
        {
          "date": "2024-08-23",
          "points": 56.0
        },
        {
          "date": "2024-08-24",
          "points": 56.0
        }
      ]
    },
    {
      "name": "Laurens Huys",
      "team": "Arkéa - B&B Hotels",
      "role": "Unclassed",
      "cost": 4.0,
      "ownership": 1.0,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Mathis Le Berre",
      "team": "Arkéa - B&B Hotels",
      "role": "Unclassed",
      "cost": 4.0,
      "ownership": 4.4,
      "points": 44.0,
      "cost_per_point": 0.09090909090909091,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 12.0
        },
        {
          "date": "2024-08-22",
          "points": 12.0
        },
        {
          "date": "2024-08-23",
          "points": 12.0
        },
        {
          "date": "2024-08-24",
          "points": 44.0
        }
      ]
    },
    {
      "name": "Łukasz Owsian",
      "team": "Arkéa - B&B Hotels",
      "role": "Unclassed",
      "cost": 4.0,
      "ownership": 0.4,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Michel Ries",
      "team": "Arkéa - B&B Hotels",
      "role": "Unclassed",
      "cost": 4.0,
      "ownership": 1.2,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Gianmarco Garofoli",
      "team": "Astana Qazaqstan Team",
      "role": "Unclassed",
      "cost": 4.0,
      "ownership": 1.1,
      "points": 78.0,
      "cost_per_point": 0.05128205128205128,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 78.0
        },
        {
          "date": "2024-08-22",
          "points": 78.0
        },
        {
          "date": "2024-08-23",
          "points": 78.0
        },
        {
          "date": "2024-08-24",
          "points": 78.0
        }
      ]
    },
    {
      "name": "Santiago Umba",
      "team": "Astana Qazaqstan Team",
      "role": "Unclassed",
      "cost": 4.0,
      "ownership": 2.1,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Nicolas Vinokurov",
      "team": "Astana Qazaqstan Team",
      "role": "Unclassed",
      "cost": 4.0,
      "ownership": 4.8,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Kamil Gradek",
      "team": "Bahrain - Victorious",
      "role": "Unclassed",
      "cost": 4.0,
      "ownership": 1.7,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Rainer Kepplinger",
      "team": "Bahrain - Victorious",
      "role": "Unclassed",
      "cost": 4.0,
      "ownership": 1.8,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Fran Miholjević",
      "team": "Bahrain - Victorious",
      "role": "Unclassed",
      "cost": 4.0,
      "ownership": 1.3,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Jasha Sütterlin",
      "team": "Bahrain - Victorious",
      "role": "Unclassed",
      "cost": 4.0,
      "ownership": 2.4,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Thomas Champion",
      "team": "Cofidis",
      "role": "Unclassed",
      "cost": 4.0,
      "ownership": 5.1,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Rubén Fernández",
      "team": "Cofidis",
      "role": "Unclassed",
      "cost": 4.0,
      "ownership": 5.6,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Jonathan Lastra",
      "team": "Cofidis",
      "role": "Unclassed",
      "cost": 4.0,
      "ownership": 3.8,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Urko Berrade",
      "team": "Equipo Kern Pharma",
      "role": "Unclassed",
      "cost": 4.0,
      "ownership": 8.0,
      "points": 102.0,
      "cost_per_point": 0.0392156862745098,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 100.0
        },
        {
          "date": "2024-08-23",
          "points": 102.0
        },
        {
          "date": "2024-08-24",
          "points": 102.0
        }
      ]
    },
    {
      "name": "Jorge Gutiérrez",
      "team": "Equipo Kern Pharma",
      "role": "Unclassed",
      "cost": 4.0,
      "ownership": 2.4,
      "points": 2.0,
      "cost_per_point": 2.0,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 2.0
        },
        {
          "date": "2024-08-24",
          "points": 2.0
        }
      ]
    },
    {
      "name": "Unai Iribar",
      "team": "Equipo Kern Pharma",
      "role": "Unclassed",
      "cost": 4.0,
      "ownership": 1.3,
      "points": 30.0,
      "cost_per_point": 0.13333333333333333,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 28.0
        },
        {
          "date": "2024-08-22",
          "points": 28.0
        },
        {
          "date": "2024-08-23",
          "points": 30.0
        },
        {
          "date": "2024-08-24",
          "points": 30.0
        }
      ]
    },
    {
      "name": "José Félix Parra",
      "team": "Equipo Kern Pharma",
      "role": "Unclassed",
      "cost": 4.0,
      "ownership": 4.4,
      "points": 2.0,
      "cost_per_point": 2.0,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 2.0
        },
        {
          "date": "2024-08-24",
          "points": 2.0
        }
      ]
    },
    {
      "name": "Ibon Ruiz",
      "team": "Equipo Kern Pharma",
      "role": "Unclassed",
      "cost": 4.0,
      "ownership": 1.7,
      "points": 106.0,
      "cost_per_point": 0.03773584905660377,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 104.0
        },
        {
          "date": "2024-08-22",
          "points": 104.0
        },
        {
          "date": "2024-08-23",
          "points": 106.0
        },
        {
          "date": "2024-08-24",
          "points": 106.0
        }
      ]
    },
    {
      "name": "Xabier Berasategi",
      "team": "Euskaltel - Euskadi",
      "role": "Unclassed",
      "cost": 4.0,
      "ownership": 5.6,
      "points": 22.0,
      "cost_per_point": 0.18181818181818182,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 22.0
        },
        {
          "date": "2024-08-22",
          "points": 22.0
        },
        {
          "date": "2024-08-23",
          "points": 22.0
        },
        {
          "date": "2024-08-24",
          "points": 22.0
        }
      ]
    },
    {
      "name": "Xabier Isasa",
      "team": "Euskaltel - Euskadi",
      "role": "Unclassed",
      "cost": 4.0,
      "ownership": 3.3,
      "points": 90.0,
      "cost_per_point": 0.044444444444444446,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 50.0
        },
        {
          "date": "2024-08-22",
          "points": 50.0
        },
        {
          "date": "2024-08-23",
          "points": 90.0
        },
        {
          "date": "2024-08-24",
          "points": 90.0
        }
      ]
    },
    {
      "name": "Lorenzo Germani",
      "team": "Groupama - FDJ",
      "role": "Unclassed",
      "cost": 4.0,
      "ownership": 1.5,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Reuben Thompson",
      "team": "Groupama - FDJ",
      "role": "Unclassed",
      "cost": 4.0,
      "ownership": 1.3,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Tom Paquot",
      "team": "Intermarché - Wanty",
      "role": "Unclassed",
      "cost": 4.0,
      "ownership": 1.1,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Simone Petilli",
      "team": "Intermarché - Wanty",
      "role": "Unclassed",
      "cost": 4.0,
      "ownership": 1.7,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    },
    {
      "name": "Nadav Raisberg",
      "team": "Israel - Premier Tech",
      "role": "Unclassed",
      "cost": 4.0,
      "ownership": 0.5,
      "points": 46.0,
      "cost_per_point": 0.08695652173913043,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 42.0
        },
        {
          "date": "2024-08-22",
          "points": 46.0
        },
        {
          "date": "2024-08-23",
          "points": 46.0
        },
        {
          "date": "2024-08-24",
          "points": 46.0
        }
      ]
    },
    {
      "name": "Otto Vergaerde",
      "team": "Lidl - Trek",
      "role": "Unclassed",
      "cost": 4.0,
      "ownership": 3.1,
      "points": 16.0,
      "cost_per_point": 0.25,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 12.0
        },
        {
          "date": "2024-08-22",
          "points": 12.0
        },
        {
          "date": "2024-08-23",
          "points": 16.0
        },
        {
          "date": "2024-08-24",
          "points": 16.0
        }
      ]
    },
    {
      "name": "Arjen Livyns",
      "team": "Lotto Dstny",
      "role": "Unclassed",
      "cost": 4.0,
      "ownership": 1.4,
      "points": 115.0,
      "cost_per_point": 0.034782608695652174,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 115.0
        },
        {
          "date": "2024-08-22",
          "points": 115.0
        },
        {
          "date": "2024-08-23",
          "points": 115.0
        },
        {
          "date": "2024-08-24",
          "points": 115.0
        }
      ]
    },
    {
      "name": "Jorge Arcas",
      "team": "Movistar Team",
      "role": "Unclassed",
      "cost": 4.0,
      "ownership": 7.1,
      "points": 14.0,
      "cost_per_point": 0.2857142857142857,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 8.0
        },
        {
          "date": "2024-08-22",
          "points": 8.0
        },
        {
          "date": "2024-08-23",
          "points": 8.0
        },
        {
          "date": "2024-08-24",
          "points": 14.0
        }
      ]
    },
    {
      "name": "Enzo Leijnse",
      "team": "Team dsm-firmenich PostNL",
      "role": "Unclassed",
      "cost": 4.0,
      "ownership": 0.7,
      "points": 8.0,
      "cost_per_point": 0.5,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 8.0
        },
        {
          "date": "2024-08-22",
          "points": 8.0
        },
        {
          "date": "2024-08-23",
          "points": 8.0
        },
        {
          "date": "2024-08-24",
          "points": 8.0
        }
      ]
    },
    {
      "name": "Tim Naberman",
      "team": "Team dsm-firmenich PostNL",
      "role": "Unclassed",
      "cost": 4.0,
      "ownership": 0.5,
      "points": 8.0,
      "cost_per_point": 0.5,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 8.0
        },
        {
          "date": "2024-08-22",
          "points": 8.0
        },
        {
          "date": "2024-08-23",
          "points": 8.0
        },
        {
          "date": "2024-08-24",
          "points": 8.0
        }
      ]
    },
    {
      "name": "Martijn Tusveld",
      "team": "Team dsm-firmenich PostNL",
      "role": "Unclassed",
      "cost": 4.0,
      "ownership": 1.1,
      "points": 8.0,
      "cost_per_point": 0.5,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 8.0
        },
        {
          "date": "2024-08-22",
          "points": 8.0
        },
        {
          "date": "2024-08-23",
          "points": 8.0
        },
        {
          "date": "2024-08-24",
          "points": 8.0
        }
      ]
    },
    {
      "name": "Julius Van Den Berg",
      "team": "Team dsm-firmenich PostNL",
      "role": "Unclassed",
      "cost": 4.0,
      "ownership": 3.7,
      "points": 8.0,
      "cost_per_point": 0.5,
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 8.0
        },
        {
          "date": "2024-08-22",
          "points": 8.0
        },
        {
          "date": "2024-08-23",
          "points": 8.0
        },
        {
          "date": "2024-08-24",
          "points": 8.0
        }
      ]
    },
    {
      "name": "Welay Berhe",
      "team": "Team Jayco AlUla",
      "role": "Unclassed",
      "cost": 4.0,
      "ownership": 3.2,
      "points": 0.0,
      "cost_per_point": "Infinity",
      "pointHistory": [
        {
          "date": "2024-08-21",
          "points": 0.0
        },
        {
          "date": "2024-08-22",
          "points": 0.0
        },
        {
          "date": "2024-08-23",
          "points": 0.0
        },
        {
          "date": "2024-08-24",
          "points": 0.0
        }
      ]
    }
  ],
  "top_50_efficiency": [
    {
      "name": "Stefan Küng",
      "cost_per_point": 0.011472275334608031,
      "role": "Unclassed",
      "points": 523.0,
      "cost": 6.0
    },
    {
      "name": "Mathias Vacek",
      "cost_per_point": 0.01195219123505976,
      "role": "Sprinter",
      "points": 502.0,
      "cost": 6.0
    },
    {
      "name": "Wout Van Aert",
      "cost_per_point": 0.015254237288135594,
      "role": "Sprinter",
      "points": 1180.0,
      "cost": 18.0
    },
    {
      "name": "Pau Miquel",
      "cost_per_point": 0.016,
      "role": "Sprinter",
      "points": 375.0,
      "cost": 6.0
    },
    {
      "name": "Pavel Bittner",
      "cost_per_point": 0.016877637130801686,
      "role": "Sprinter",
      "points": 474.0,
      "cost": 8.0
    },
    {
      "name": "Kaden Groves",
      "cost_per_point": 0.01764705882352941,
      "role": "Sprinter",
      "points": 680.0,
      "cost": 12.0
    },
    {
      "name": "Lennert Van Eetvelt",
      "cost_per_point": 0.019305019305019305,
      "role": "Climber",
      "points": 518.0,
      "cost": 10.0
    },
    {
      "name": "Corbin Strong",
      "cost_per_point": 0.020050125313283207,
      "role": "Sprinter",
      "points": 399.0,
      "cost": 8.0
    },
    {
      "name": "Florian Lipowitz",
      "cost_per_point": 0.020618556701030927,
      "role": "Climber",
      "points": 388.0,
      "cost": 8.0
    },
    {
      "name": "Jon Aberasturi",
      "cost_per_point": 0.020618556701030927,
      "role": "Sprinter",
      "points": 291.0,
      "cost": 6.0
    },
    {
      "name": "Clément Berthet",
      "cost_per_point": 0.023809523809523808,
      "role": "Unclassed",
      "points": 252.0,
      "cost": 6.0
    },
    {
      "name": "Ben O'Connor",
      "cost_per_point": 0.023923444976076555,
      "role": "Climber",
      "points": 418.0,
      "cost": 10.0
    },
    {
      "name": "Harold Tejada",
      "cost_per_point": 0.024390243902439025,
      "role": "Unclassed",
      "points": 246.0,
      "cost": 6.0
    },
    {
      "name": "Brandon McNulty",
      "cost_per_point": 0.024875621890547265,
      "role": "All Rounder",
      "points": 402.0,
      "cost": 10.0
    },
    {
      "name": "Cristián Rodríguez",
      "cost_per_point": 0.025,
      "role": "Climber",
      "points": 240.0,
      "cost": 6.0
    },
    {
      "name": "Arne Marit",
      "cost_per_point": 0.025,
      "role": "Sprinter",
      "points": 240.0,
      "cost": 6.0
    },
    {
      "name": "Antonio Tiberi",
      "cost_per_point": 0.02680965147453083,
      "role": "All Rounder",
      "points": 373.0,
      "cost": 10.0
    },
    {
      "name": "Marco Frigo",
      "cost_per_point": 0.0273972602739726,
      "role": "Unclassed",
      "points": 219.0,
      "cost": 6.0
    },
    {
      "name": "Bruno Armirail",
      "cost_per_point": 0.027649769585253458,
      "role": "Unclassed",
      "points": 217.0,
      "cost": 6.0
    },
    {
      "name": "Edoardo Affini",
      "cost_per_point": 0.028037383177570093,
      "role": "Sprinter",
      "points": 214.0,
      "cost": 6.0
    },
    {
      "name": "Primož Roglič",
      "cost_per_point": 0.030573248407643312,
      "role": "All Rounder",
      "points": 785.0,
      "cost": 24.0
    },
    {
      "name": "Antonio Jesús Soto",
      "cost_per_point": 0.03296703296703297,
      "role": "Sprinter",
      "points": 182.0,
      "cost": 6.0
    },
    {
      "name": "George Bennett",
      "cost_per_point": 0.03333333333333333,
      "role": "Unclassed",
      "points": 180.0,
      "cost": 6.0
    },
    {
      "name": "Felix Gall",
      "cost_per_point": 0.03367003367003367,
      "role": "Climber",
      "points": 297.0,
      "cost": 10.0
    },
    {
      "name": "Arjen Livyns",
      "cost_per_point": 0.034782608695652174,
      "role": "Unclassed",
      "points": 115.0,
      "cost": 4.0
    },
    {
      "name": "Filippo Baroncini",
      "cost_per_point": 0.03571428571428571,
      "role": "Unclassed",
      "points": 168.0,
      "cost": 6.0
    },
    {
      "name": "Enric Mas",
      "cost_per_point": 0.037037037037037035,
      "role": "Climber",
      "points": 432.0,
      "cost": 16.0
    },
    {
      "name": "Aleksandr Vlasov",
      "cost_per_point": 0.037037037037037035,
      "role": "All Rounder",
      "points": 270.0,
      "cost": 10.0
    },
    {
      "name": "Ibon Ruiz",
      "cost_per_point": 0.03773584905660377,
      "role": "Unclassed",
      "points": 106.0,
      "cost": 4.0
    },
    {
      "name": "Gijs Leemreize",
      "cost_per_point": 0.0379746835443038,
      "role": "Unclassed",
      "points": 158.0,
      "cost": 6.0
    },
    {
      "name": "Lorenzo Rota",
      "cost_per_point": 0.03870967741935484,
      "role": "Unclassed",
      "points": 155.0,
      "cost": 6.0
    },
    {
      "name": "Urko Berrade",
      "cost_per_point": 0.0392156862745098,
      "role": "Unclassed",
      "points": 102.0,
      "cost": 4.0
    },
    {
      "name": "Bryan Coquard",
      "cost_per_point": 0.04,
      "role": "Sprinter",
      "points": 250.0,
      "cost": 10.0
    },
    {
      "name": "Luca Vergallito",
      "cost_per_point": 0.04081632653061224,
      "role": "Unclassed",
      "points": 98.0,
      "cost": 4.0
    },
    {
      "name": "Mattias Skjelmose",
      "cost_per_point": 0.042704626334519574,
      "role": "All Rounder",
      "points": 281.0,
      "cost": 12.0
    },
    {
      "name": "Xabier Isasa",
      "cost_per_point": 0.044444444444444446,
      "role": "Unclassed",
      "points": 90.0,
      "cost": 4.0
    },
    {
      "name": "Mikel Landa",
      "cost_per_point": 0.04472843450479233,
      "role": "Climber",
      "points": 313.0,
      "cost": 14.0
    },
    {
      "name": "Quinten Hermans",
      "cost_per_point": 0.04477611940298507,
      "role": "Unclassed",
      "points": 134.0,
      "cost": 6.0
    },
    {
      "name": "Jack Haig",
      "cost_per_point": 0.046153846153846156,
      "role": "Climber",
      "points": 130.0,
      "cost": 6.0
    },
    {
      "name": "Mauro Schmid",
      "cost_per_point": 0.04819277108433735,
      "role": "Unclassed",
      "points": 166.0,
      "cost": 8.0
    },
    {
      "name": "Luis Ángel Maté",
      "cost_per_point": 0.04838709677419355,
      "role": "Unclassed",
      "points": 124.0,
      "cost": 6.0
    },
    {
      "name": "Pavel Sivakov",
      "cost_per_point": 0.049079754601226995,
      "role": "Climber",
      "points": 163.0,
      "cost": 8.0
    },
    {
      "name": "João Almeida",
      "cost_per_point": 0.04926108374384237,
      "role": "All Rounder",
      "points": 406.0,
      "cost": 20.0
    },
    {
      "name": "Gianmarco Garofoli",
      "cost_per_point": 0.05128205128205128,
      "role": "Unclassed",
      "points": 78.0,
      "cost": 4.0
    },
    {
      "name": "Carlos Canal",
      "cost_per_point": 0.05309734513274336,
      "role": "Sprinter",
      "points": 113.0,
      "cost": 6.0
    },
    {
      "name": "Quentin Pacher",
      "cost_per_point": 0.05454545454545454,
      "role": "Unclassed",
      "points": 110.0,
      "cost": 6.0
    },
    {
      "name": "Eddie Dunbar",
      "cost_per_point": 0.05454545454545454,
      "role": "All Rounder",
      "points": 110.0,
      "cost": 6.0
    },
    {
      "name": "Joshua Tarling",
      "cost_per_point": 0.05673758865248227,
      "role": "Unclassed",
      "points": 141.0,
      "cost": 8.0
    },
    {
      "name": "Matthew Riccitello",
      "cost_per_point": 0.05970149253731343,
      "role": "Climber",
      "points": 134.0,
      "cost": 8.0
    },
    {
      "name": "Sylvain Moniquet",
      "cost_per_point": 0.06315789473684211,
      "role": "Unclassed",
      "points": 95.0,
      "cost": 6.0
    }
  ],
  "league_scores": {
    "current": [
      {
        "name": "Team Name",
        "points": 3083,
        "roster": [
          "João Almeida",
          "Mattias Skjelmose",
          "Lennert Van Eetvelt",
          "Isaac Del Toro",
          "Wout Van Aert",
          "Harold Tejada",
          "Quentin Pacher",
          "George Bennett",
          "Thymen Arensman"
        ]
      },
      {
        "name": "Iberische Halbpinsel",
        "points": 1536,
        "roster": [
          "João Almeida",
          "Adam Yates",
          "Mikel Landa",
          "Max Poole",
          "Ide Schelling",
          "Steven Kruijswijk",
          "Jasha Sütterlin",
          "Stefan Küng",
          "Richard Carapaz"
        ]
      },
      {
        "name": "Team Fiestina",
        "points": 1529,
        "roster": [
          "João Almeida",
          "Mattias Skjelmose",
          "Richard Carapaz",
          "Enric Mas",
          "Kim Heiduk",
          "Patrick Konrad",
          "Jhonatan Narváez",
          "Julius Van Den Berg",
          "Isaac Del Toro"
        ]
      },
      {
        "name": "Ganz anderer Teamname",
        "points": 1230,
        "roster": [
          "Daniel Martínez",
          "Tao Geoghegan Hart",
          "Michael Woods",
          "Sepp Kuss",
          "Kaden Groves",
          "Oier Lazkano",
          "Jhonatan Narváez",
          "Joshua Tarling",
          "Giulio Ciccone"
        ]
      }
    ],
    "history": [
      {
        "date": "2024-08-22",
        "scores": [
          {
            "name": "Team Name",
            "points": 2054
          },
          {
            "name": "Ganz anderer Teamname",
            "points": 1096
          },
          {
            "name": "Team Fiestina",
            "points": 1027
          },
          {
            "name": "Iberische Halbpinsel",
            "points": 1022
          }
        ]
      },
      {
        "date": "2024-08-23",
        "scores": [
          {
            "name": "Team Name",
            "points": 2668,
            "roster": [
              "João Almeida",
              "Mattias Skjelmose",
              "Lennert Van Eetvelt",
              "Isaac Del Toro",
              "Wout Van Aert",
              "Harold Tejada",
              "Quentin Pacher",
              "George Bennett",
              "Thymen Arensman"
            ]
          },
          {
            "name": "Iberische Halbpinsel",
            "points": 1318,
            "roster": [
              "João Almeida",
              "Adam Yates",
              "Mikel Landa",
              "Max Poole",
              "Ide Schelling",
              "Steven Kruijswijk",
              "Jasha Sütterlin",
              "Stefan Küng",
              "Richard Carapaz"
            ]
          },
          {
            "name": "Ganz anderer Teamname",
            "points": 1173,
            "roster": [
              "Daniel Martínez",
              "Tao Geoghegan Hart",
              "Michael Woods",
              "Sepp Kuss",
              "Kaden Groves",
              "Oier Lazkano",
              "Jhonatan Narváez",
              "Joshua Tarling",
              "Giulio Ciccone"
            ]
          },
          {
            "name": "Team Fiestina",
            "points": 1145,
            "roster": [
              "João Almeida",
              "Mattias Skjelmose",
              "Richard Carapaz",
              "Enric Mas",
              "Kim Heiduk",
              "Patrick Konrad",
              "Jhonatan Narváez",
              "Julius Van Den Berg",
              "Isaac Del Toro"
            ]
          }
        ]
      },
      {
        "date": "2024-08-24",
        "scores": [
          {
            "name": "Team Name",
            "points": 3083,
            "roster": [
              "João Almeida",
              "Mattias Skjelmose",
              "Lennert Van Eetvelt",
              "Isaac Del Toro",
              "Wout Van Aert",
              "Harold Tejada",
              "Quentin Pacher",
              "George Bennett",
              "Thymen Arensman"
            ]
          },
          {
            "name": "Iberische Halbpinsel",
            "points": 1536,
            "roster": [
              "João Almeida",
              "Adam Yates",
              "Mikel Landa",
              "Max Poole",
              "Ide Schelling",
              "Steven Kruijswijk",
              "Jasha Sütterlin",
              "Stefan Küng",
              "Richard Carapaz"
            ]
          },
          {
            "name": "Team Fiestina",
            "points": 1529,
            "roster": [
              "João Almeida",
              "Mattias Skjelmose",
              "Richard Carapaz",
              "Enric Mas",
              "Kim Heiduk",
              "Patrick Konrad",
              "Jhonatan Narváez",
              "Julius Van Den Berg",
              "Isaac Del Toro"
            ]
          },
          {
            "name": "Ganz anderer Teamname",
            "points": 1230,
            "roster": [
              "Daniel Martínez",
              "Tao Geoghegan Hart",
              "Michael Woods",
              "Sepp Kuss",
              "Kaden Groves",
              "Oier Lazkano",
              "Jhonatan Narváez",
              "Joshua Tarling",
              "Giulio Ciccone"
            ]
          }
        ]
      }
    ]
  },
  "dream_team": {
    "riders": [
      {
        "name": "Primož Roglič",
        "role": "All Rounder",
        "cost": 24.0,
        "points": 785.0,
        "pointHistory": [
          {
            "date": "2024-08-21",
            "points": 435.0
          },
          {
            "date": "2024-08-22",
            "points": 471.0
          },
          {
            "date": "2024-08-23",
            "points": 519.0
          },
          {
            "date": "2024-08-24",
            "points": 785.0
          }
        ]
      },
      {
        "name": "Wout Van Aert",
        "role": "Sprinter",
        "cost": 18.0,
        "points": 1180.0,
        "pointHistory": [
          {
            "date": "2024-08-21",
            "points": 912.0
          },
          {
            "date": "2024-08-22",
            "points": 924.0
          },
          {
            "date": "2024-08-23",
            "points": 1168.0
          },
          {
            "date": "2024-08-24",
            "points": 1180.0
          }
        ]
      },
      {
        "name": "Kaden Groves",
        "role": "Sprinter",
        "cost": 12.0,
        "points": 680.0,
        "pointHistory": [
          {
            "date": "2024-08-21",
            "points": 640.0
          },
          {
            "date": "2024-08-22",
            "points": 648.0
          },
          {
            "date": "2024-08-23",
            "points": 672.0
          },
          {
            "date": "2024-08-24",
            "points": 680.0
          }
        ]
      },
      {
        "name": "Lennert Van Eetvelt",
        "role": "Climber",
        "cost": 10.0,
        "points": 518.0,
        "pointHistory": [
          {
            "date": "2024-08-21",
            "points": 344.0
          },
          {
            "date": "2024-08-22",
            "points": 369.0
          },
          {
            "date": "2024-08-23",
            "points": 433.0
          },
          {
            "date": "2024-08-24",
            "points": 518.0
          }
        ]
      },
      {
        "name": "Brandon McNulty",
        "role": "All Rounder",
        "cost": 10.0,
        "points": 402.0,
        "pointHistory": [
          {
            "date": "2024-08-21",
            "points": 388.0
          },
          {
            "date": "2024-08-22",
            "points": 394.0
          },
          {
            "date": "2024-08-23",
            "points": 400.0
          },
          {
            "date": "2024-08-24",
            "points": 402.0
          }
        ]
      },
      {
        "name": "Florian Lipowitz",
        "role": "Climber",
        "cost": 8.0,
        "points": 388.0,
        "pointHistory": [
          {
            "date": "2024-08-21",
            "points": 102.0
          },
          {
            "date": "2024-08-22",
            "points": 306.0
          },
          {
            "date": "2024-08-23",
            "points": 325.0
          },
          {
            "date": "2024-08-24",
            "points": 388.0
          }
        ]
      },
      {
        "name": "Harold Tejada",
        "role": "Unclassed",
        "cost": 6.0,
        "points": 246.0,
        "pointHistory": [
          {
            "date": "2024-08-21",
            "points": 0.0
          },
          {
            "date": "2024-08-22",
            "points": 25.0
          },
          {
            "date": "2024-08-23",
            "points": 105.0
          },
          {
            "date": "2024-08-24",
            "points": 246.0
          }
        ]
      },
      {
        "name": "Clément Berthet",
        "role": "Unclassed",
        "cost": 6.0,
        "points": 252.0,
        "pointHistory": [
          {
            "date": "2024-08-21",
            "points": 4.0
          },
          {
            "date": "2024-08-22",
            "points": 210.0
          },
          {
            "date": "2024-08-23",
            "points": 236.0
          },
          {
            "date": "2024-08-24",
            "points": 252.0
          }
        ]
      },
      {
        "name": "Stefan Küng",
        "role": "Unclassed",
        "cost": 6.0,
        "points": 523.0,
        "pointHistory": [
          {
            "date": "2024-08-21",
            "points": 380.0
          },
          {
            "date": "2024-08-22",
            "points": 380.0
          },
          {
            "date": "2024-08-23",
            "points": 522.0
          },
          {
            "date": "2024-08-24",
            "points": 523.0
          }
        ]
      }
    ],
    "total_points": 4974.0,
    "total_cost": 100.0
  },
  "last_update": "2024-08-24",
  "mvp_history": [
    {
      "name": "Wout Van Aert",
      "points_added": 244.0,
      "date": "2024-08-23"
    },
    {
      "name": "Primož Roglič",
      "points_added": 266.0,
      "date": "2024-08-24"
    }
  ],
  "mip_history": [
    {
      "name": "Quentin Pacher",
      "percentage_increase": 110.0,
      "date": "2024-08-23",
      "from_zero": true
    },
    {
      "name": "Ion Izagirre",
      "percentage_increase": 36.0,
      "date": "2024-08-24",
      "from_zero": true
    }
  ]
}
function generateNewsContent() {
    let newsHtml = '';

    // First row with two columns
    newsHtml += '<div class="news-row">';

    let standings = [];
    if (cyclistData && cyclistData.league_scores && cyclistData.league_scores.current) {
        standings = cyclistData.league_scores.current.sort((a, b) => b.points - a.points);
    }

    // Latest Standings (left column)
    newsHtml += '<div class="news-column">';
    newsHtml += '<div class="news-section news-standings">';
    newsHtml += '<h3>Overall Standings</h3>';
    if (standings.length > 0) {
        newsHtml += '<div class="standings-list">';
        standings.slice(0, 5).forEach((team, index) => {
            newsHtml += `<div class="standing-item">
                <span class="standing-rank">${index + 1}</span>
                <span class="team-name">${team.name}</span>
                <span class="team-points">${team.points} points</span>
            </div>`;
        });
        newsHtml += '</div>';
    } else {
        newsHtml += '<p>Standings data not available.</p>';
    }
    newsHtml += '</div>';
    newsHtml += '</div>';

    // Recent Points Added (right column)
    newsHtml += '<div class="news-column">';
    newsHtml += '<div class="news-section news-score-changes">';
    newsHtml += '<h3>Recent Points Added</h3>';
    if (cyclistData && cyclistData.league_scores && cyclistData.league_scores.history && cyclistData.league_scores.history.length >= 2) {
        const latestScores = cyclistData.league_scores.history[0].scores;
        const previousScores = cyclistData.league_scores.history[1].scores;
        
        const scoreChanges = latestScores.map(latest => {
            const previous = previousScores.find(prev => prev.name === latest.name);
            return {
                name: latest.name,
                change: Math.max(0, latest.points - (previous ? previous.points : latest.points))
            };
        });

        // Sort score changes to match the order of overall standings
        const sortedScoreChanges = standings.map(team => 
            scoreChanges.find(change => change.name === team.name)
        ).filter(change => change !== undefined);

        newsHtml += '<div class="score-changes-list">';
        sortedScoreChanges.slice(0, 5).forEach((team, index) => {
            newsHtml += `<div class="score-change-item">
                <span class="standing-rank">${index + 1}</span>
                <span class="team-name">${team.name}</span>
                <span class="team-change positive-change">+${team.change} points</span>
            </div>`;
        });
        newsHtml += '</div>';
    } else {
        newsHtml += '<p>Recent score change data not available.</p>';
    }
    newsHtml += '</div>';
    newsHtml += '</div>';

    newsHtml += '</div>'; // Close news-row

    // Most Recent MVP and MIP
    newsHtml += '<div class="news-section news-achievements">';
    newsHtml += '<h3>Recent Achievements</h3>';
    if (cyclistData && cyclistData.mvp_history && cyclistData.mvp_history.length > 0) {
        const mvp = cyclistData.mvp_history[cyclistData.mvp_history.length - 1];
        newsHtml += `<p><span class="achievement-name">MVP: ${mvp.name}</span><span class="achievement-value">${mvp.points_added.toFixed(2)} points added</span></p>`;
    }
    if (cyclistData && cyclistData.mip_history && cyclistData.mip_history.length > 0) {
        const mip = cyclistData.mip_history[cyclistData.mip_history.length - 1];
        newsHtml += `<p><span class="achievement-name">MIP: ${mip.name}</span><span class="achievement-value">${mip.percentage_increase.toFixed(2)}% increase</span></p>`;
    }
    newsHtml += '</div>';

    // Top 10 Riders
    newsHtml += '<div class="news-section news-top-riders">';
    newsHtml += '<h3>Top 10 Riders</h3>';
    if (cyclistData && cyclistData.cyclists) {
        const top10 = cyclistData.cyclists.sort((a, b) => b.points - a.points).slice(0, 10);
        newsHtml += '<div class="top-riders-list">';
        top10.forEach((rider, index) => {
            newsHtml += `<div class="top-rider-item">
                <span class="rider-rank">${index + 1}</span>
                <span class="rider-name">${rider.name} <span class="rider-details">(${rider.team})</span></span>
                <span class="rider-details">${rider.points} points</span>
            </div>`;
        });
        newsHtml += '</div>';
    } else {
        newsHtml += '<p>Rider data not available.</p>';
    }
    newsHtml += '</div>';

    document.getElementById('News').innerHTML = newsHtml;
}

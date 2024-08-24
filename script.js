let leagueData;
let cyclistData;
// Define a common color scheme function
function getColorForRole(role) {
    switch(role) {
        case 'All Rounder': return '#ff6384';
        case 'Climber': return '#36a2eb';
        case 'Sprinter': return '#cc65fe';
        case 'Unclassed': return '#ffce56';
        default: return '#4bc0c0';
    }
}

// Update the createRoleChart function
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

    // Make the layout responsive
    layout.autosize = true;
    
    const container = document.getElementById(chartId);
    if (!container) {
        console.error(`Container with id ${chartId} not found`);
        return;
    }

    // Ensure the container is visible and has dimensions
    container.style.display = 'block';
    container.style.height = '400px'; // Set a default height

    // Remove specific width and height from layout
    delete layout.width;
    delete layout.height;

    // Center the chart content
    layout.margin = {
        l: 50,
        r: 50,
        t: 50,
        b: 50,
        pad: 4,
        autoexpand: true
    };

    // Ensure axes are set
    layout.xaxis = layout.xaxis || {};
    layout.yaxis = layout.yaxis || {};

    // Enable automargin for axes
    layout.xaxis.automargin = true;
    layout.yaxis.automargin = true;

    // Base font size calculation
    const baseFontSize = 14;

    // Set font sizes
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

    // Adjust x-axis for better label fitting
    layout.xaxis.tickangle = layout.xaxis.tickangle || -45;

    // Ensure legend fits
    layout.legend = layout.legend || {};
    layout.legend.font = {
        family: 'VT323, monospace',
        size: baseFontSize * 0.9,
        color: '#ff1493'
    };

    try {
        Plotly.newPlot(chartId, traces, layout, config);
    } catch (error) {
        console.error(`Error creating chart ${chartId}:`, error);
        container.innerHTML = `<p>Error creating chart. Please try refreshing the page.</p>`;
    }

    // Add a resize listener to update the chart when the window size changes
    window.addEventListener('resize', function() {
        try {
            Plotly.relayout(chartId, {
                autosize: true
            });
        } catch (error) {
            console.error(`Error resizing chart ${chartId}:`, error);
        }
    });
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

        // Store cyclist data globally
        cyclistData = data;

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

        // Open the default tab
        document.getElementById("defaultOpen").click();
    }).fail(function(jqxhr, textStatus, error) {
        $('#loading').hide();
        $('#error').text("Error fetching data: " + error).show();
    });
});

function createRoleChart(roles) {
    const ctx = document.getElementById('roleChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(roles),
            datasets: [{
                data: Object.values(roles),
                backgroundColor: [
                    '#ff6384', '#36a2eb', '#cc65fe', '#ffce56', '#4bc0c0', '#ff9f40'
                ],
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

const customColorScheme = [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
];

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
    var tabcontent = document.getElementsByClassName("tabcontent");
    for (var i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    var tablinks = document.getElementsByClassName("tablinks");
    for (var i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    var selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.style.display = "block";
    }

    if (evt.currentTarget) {
        evt.currentTarget.className += " active";
    }

    if (tabName === 'RiderTrajectoryTab') {
        updateTrajectoryChart();
    }

    if (tabName === 'LeagueScoresTab') {
        loadDefaultLeagueTeamChart();
        createLeagueStandingsChart();
    }

    if (tabName === 'TeamsTab') {
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
        labels: sortedRiders.map(rider => rider.name),
        values: sortedRiders.map(rider => rider.points),
        type: 'pie',
        textinfo: 'label+percent',
        hoverinfo: 'text',
        hovertext: sortedRiders.map(rider => 
            `Name: ${rider.name}<br>` +
            `Role: ${rider.role}<br>` +
            `Points: ${rider.points}<br>` +
            `Cost: ${rider.cost}`
        ),
        marker: {
            colors: sortedRiders.map(rider => getColorForRole(rider.role))
        }
    };

    const layout = {
        title: {
            text: 'Team Points Distribution',
            font: {
                family: 'VT323, monospace',
                color: '#ff1493'
            }
        },
        paper_bgcolor: '#fff0f5',
        plot_bgcolor: '#fff0f5',
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

let leagueData;
let cyclistData;
let globalTeamColors = {};

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
        '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', '#FFB3BA', 
        '#FFC9DE', '#E0BBE4', '#957DAD', '#D291BC', '#FFDFD3', '#C1E7E3', 
        '#B6CFB6', '#C2BBF0', '#F0E6EF', '#E8D3A9', '#F7D6BF', '#C9E4DE', 
        '#FFEEDD', '#F1E0E0', '#D4F0F0', '#CCCCFF', '#FFE5B4', '#FFF0F5'
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

function createResponsiveChart(chartId, traces, layout, config = {}) {
    const defaultConfig = {
        responsive: true,
        displayModeBar: false,
    };
    const mergedConfig = { ...defaultConfig, ...config };
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
    
    layout.margin = layout.margin || {
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
        const baseSize = Math.min(window.innerWidth, window.innerHeight) / 50;
        
        layout.font = layout.font || {};
        layout.font.size = baseSize;

        if (layout.title) {
            if (typeof layout.title === 'string') {
                layout.title = { text: layout.title };
            }
            layout.title.font = layout.title.font || {};
            layout.title.font.size = baseSize * 1.2;
        }

        if (layout.xaxis) {
            layout.xaxis.title = layout.xaxis.title || {};
            if (typeof layout.xaxis.title === 'string') {
                layout.xaxis.title = { text: layout.xaxis.title };
            }
            layout.xaxis.title.font = layout.xaxis.title.font || {};
            layout.xaxis.title.font.size = baseSize * 0.8;
        }

        if (layout.yaxis) {
            layout.yaxis.title = layout.yaxis.title || {};
            if (typeof layout.yaxis.title === 'string') {
                layout.yaxis.title = { text: layout.yaxis.title };
            }
            layout.yaxis.title.font = layout.yaxis.title.font || {};
            layout.yaxis.title.font.size = baseSize * 0.8;
        }

        if (layout.legend) {
            layout.legend.font = layout.legend.font || {};
            layout.legend.font.size = baseSize*0.8;
        }

    }
    
    layout.xaxis.tickangle = layout.xaxis.tickangle || -45;
    
    updateFontSizes();
    
       try {
        Plotly.newPlot(chartId, traces, layout, mergedConfig).then(() => {
            // Apply withdrawn rider styles after the chart is plotted
            applyWithdrawnRiderStyles();
        });
    } catch (error) {
        console.error(`Error creating chart ${chartId}:`, error);
        container.innerHTML = `<p>Error creating chart. Please try refreshing the page.</p>`;
    }
    
    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            if (entry.target.id === chartId) {
                updateFontSizes();
                try {
                    const updateLayout = {
                        autosize: true,
                        'font.size': layout.font.size,
                    };
                    if (layout.title && layout.title.font) {
                        updateLayout['title.font.size'] = layout.title.font.size;
                    }
                    if (layout.xaxis && layout.xaxis.title && layout.xaxis.title.font) {
                        updateLayout['xaxis.title.font.size'] = layout.xaxis.title.font.size;
                    }
                    if (layout.yaxis && layout.yaxis.title && layout.yaxis.title.font) {
                        updateLayout['yaxis.title.font.size'] = layout.yaxis.title.font.size;
                    }
                    if (layout.legend && layout.legend.font) {
                        updateLayout['legend.font.size'] = layout.legend.font.size;
                    }
                    Plotly.relayout(chartId, updateLayout);
                } catch (error) {
                    console.error(`Error resizing chart ${chartId}:`, error);
                }
            }
        }
    });
    
    resizeObserver.observe(container);
}

function initializeCyclingTeamSelect() {
    const cyclingTeamSelect = document.getElementById('cyclingTeamSelect');
    const cyclingTeamSelect2 = document.getElementById('cyclingTeamSelect2');
    cyclingTeamSelect.innerHTML = '<option value="">Select a Cycling Team</option>';
    cyclingTeamSelect2.innerHTML = '<option value="">Select a Cycling Team</option>';
    const teams = [...new Set(cyclistData.cyclists.map(cyclist => cyclist.team))].sort();
    teams.forEach(team => {
        const option = document.createElement('option');
        option.value = team;
        option.textContent = team;
        cyclingTeamSelect.appendChild(option);
        cyclingTeamSelect2.appendChild(option.cloneNode(true));
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

function updateLeagueTeamRosterChart() {
    const selectedTeam = document.getElementById('leagueTeamSelect').value;
    if (!selectedTeam) return;

    const team = leagueData.find(t => t.name === selectedTeam);
    if (!team) return;

    const rosterData = team.roster.map(riderName => {
        const normalizedRiderName = normalizeNameDiacritics(riderName);
        const rider = cyclistData.cyclists.find(c => normalizeNameDiacritics(c.name) === normalizedRiderName);
        const isWithdrawn = cyclistData.withdrawals.some(w => normalizeNameDiacritics(w.rider) === normalizedRiderName);
        return {
            name: riderName,
            points: rider ? rider.points : 0,
            role: rider ? rider.role : 'Unknown',
            isWithdrawn: isWithdrawn
        };
    }).sort((a, b) => b.points - a.points);


    // Create the overall roster points chart
    const trace = {
        x: rosterData.map(r => r.name),
        y: rosterData.map(r => r.points),
        type: 'bar',
        marker: {
            color: rosterData.map(r => getColorForRole(r.role))
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
            tickfont: {
                size: 8
            },
            ticktext: rosterData.map(r => r.isWithdrawn ? `<span style="text-decoration:line-through;">${r.name}</span>` : r.name),
            tickvals: rosterData.map(r => r.name)
        },
        yaxis: {
            title: 'Points',
        },
        paper_bgcolor: '#fff0f5',
        plot_bgcolor: '#fff0f5'
    };

    createResponsiveChart('leagueTeamRosterChart', [trace], layout);

    // Calculate and create the daily points chart
    const dailyPoints = calculateDailyPoints(team.roster);
    createDailyPointsChart(dailyPoints, selectedTeam);
    applyWithdrawnRiderStyles();
    updateBestRoleSelections();

    // Update balanced team information
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
        document.getElementById('teamRiskAssessmentChart').innerHTML = '';
        document.getElementById('riskAssessmentTable').innerHTML = '';
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
    applyWithdrawnRiderStyles();

    // Call the function to display the points distribution
    displayTeamPointsDistribution(teamRiders);

    // Call the function to display the all teams comparison
    displayAllTeamsComparison();

    // Call the function to display the risk assessment
    displayTeamRiskAssessment();
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
        let withdrawals = data.withdrawals;

        // Initialize variables
        let totalCost = 0;
        let totalPoints = 0;
        const roles = {};


// Sort cyclists by cost per point (convert "Infinity" to a large number for sorting)
let sortedCyclists = cyclistData.cyclists.sort((a, b) => {
    const costPerPointA = a.cost_per_point === "Infinity" ? Infinity : parseFloat(a.cost_per_point);
    const costPerPointB = b.cost_per_point === "Infinity" ? Infinity : parseFloat(b.cost_per_point);
    return costPerPointA - costPerPointB;
});

// Get the top 50 cyclists
const top50Cyclists = sortedCyclists.slice(0, 50);



        cyclists.forEach(cyclist => {
            totalCost += cyclist.cost;
            totalPoints += cyclist.points;
            roles[cyclist.role] = (roles[cyclist.role] || 0) + 1;

            const costPerPoint = cyclist.points === 0 ? "∞" : (cyclist.cost / cyclist.points).toFixed(2);
            const isAbandoned = withdrawals.some(w => convertNameFormat(w.rider) === cyclist.name);
            const nameStyle = isAbandoned ? 'text-decoration: line-through;' : '';

            $('#cyclistTable tbody').append(`
                <tr>
                    <td><a href="#" class="rider-link" data-rider="${cyclist.name}" style="${nameStyle}">${cyclist.name}</a></td>
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
        applyWithdrawnRiderStyles();


             // Initialize the cycling team select dropdown
        initializeCyclingTeamSelect();

        if (data.dream_team) {
            displayDreamTeam(data.dream_team);
        }

        // Initialize the trajectory chart with top 10 riders
        updateTrajectoryChart();

        // Generate the news content
        generateNewsContent();

        // Display All-Star Team data
        displayAllStarTeam();

        // Open the News tab by default
        document.getElementById("defaultOpen").click();
        document.getElementById('riskInfoButton').addEventListener('click', toggleRiskExplanation);

    }).fail(function(jqxhr, textStatus, error) {
        $('#loading').hide();
        $('#error').text("Error fetching data: " + error).show();
    });

    // Add click event handler for rider links
    $(document).on('click', '.rider-link', function(e) {
        e.preventDefault();
        const riderName = $(this).data('rider');
        openTab(null, 'RiderTrajectoryTab', riderName);
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
    applyWithdrawnRiderStyles();

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
    applyWithdrawnRiderStyles();

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
             tickfont: {
                size: 8  // Smaller font size for x-axis labels
            }
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

    applyWithdrawnRiderStyles();

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

function updateTrajectoryChart(selectedRider = null) {
    const riderSelect = $('#riderSelect');
    let selectedOption = selectedRider || riderSelect.val();

    // If a specific rider is selected but not in the dropdown, add it
    if (selectedRider && !riderSelect.find(`option[value="${selectedRider}"]`).length) {
        riderSelect.append(`<option value="${selectedRider}">${selectedRider}</option>`);
    }

    // Set the dropdown value
    riderSelect.val(selectedOption);

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
    updateAllTimeMVPMIP(cyclistData);
}

// Update the click event handler for rider links
$(document).on('click', '.rider-link', function(e) {
    e.preventDefault();
    const riderName = $(this).data('rider');
    openTab(null, 'RiderTrajectoryTab', riderName);
});

function openTab(evt, tabName, riderName = null) {
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
    
    // Find the correct tab button and set it as active
    const activeTab = Array.from(tablinks).find(link => link.textContent.includes(tabName));
    if (activeTab) {
        activeTab.className += " active";
    }

    // Scroll to the top of the page
    window.scrollTo(0, 0);

    // Call specific functions based on the tab opened
    if (tabName === 'News') {
        generateNewsContent();
    } else if (tabName === 'RiderTrajectoryTab') {
        // Delay the update to ensure the dropdown is populated
        setTimeout(() => {
            if (riderName) {
                $('#riderSelect').val(riderName);
            }
            updateTrajectoryChart(riderName);
        }, 0);
    } else if (tabName === 'LeagueScoresTab') {
        loadDefaultLeagueTeamChart();
        createLeagueStandingsChart();
        createLatestPointsUpdateChart();
        updateLeagueTeamRosterChart();
    } else if (tabName === 'TeamsTab') {
        loadDefaultCyclingTeamChart();
        displayAllTeamsComparison();
        displayTeamCostsChart(); 
        displayTeamPointsVsCostChart(); 
        displayTeamEfficiencyChart();
        displayTeamRiskAssessment();
        displayTeamOverallRisk(); 
    } else if (tabName === 'RiskTab') {
        updateRiskAssessment();
    } else if (tabName === 'AllStarTeamTab') {
        displayAllStarTeam();
    }
    applyWithdrawnRiderStyles();

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
            if (columnIndex === 0) {
                // For the name column, get the text content
                xValue = x.textContent.trim().toLowerCase();
                yValue = y.textContent.trim().toLowerCase();
            } else if (columnIndex === 3 || columnIndex === 4 || columnIndex === 5) {
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
             tickfont: {
                size: 8  // Smaller font size for x-axis labels
            }
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
            title: '',
            tickangle: -45,
                        hoverformat: '%Y-%m-%d',
            tickfont: {
                size: 8  // Smaller font size for x-axis labels
            }
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
function createLatestPointsUpdateChart() {
    // Ensure we have the necessary data
    if (!cyclistData || !cyclistData.league_scores || !cyclistData.league_scores.history || cyclistData.league_scores.history.length < 2) {
        console.error('Insufficient data for latest points update chart');
        return;
    }

    const latestData = cyclistData.league_scores.history[cyclistData.league_scores.history.length - 1];
    const previousData = cyclistData.league_scores.history[cyclistData.league_scores.history.length - 2];

    // Calculate the point changes
    const pointChanges = latestData.scores.map(team => {
        const previousTeam = previousData.scores.find(t => t.name === team.name);
        const previousPoints = previousTeam ? previousTeam.points : 0;
        return {
            name: team.name,
            change: Math.max(0, team.points - previousPoints)  // Ensure change is non-negative
        };
    });

    // Sort teams by point change (descending order)
    pointChanges.sort((a, b) => b.change - a.change);

    const trace = {
        x: pointChanges.map(team => team.name),
        y: pointChanges.map(team => team.change),
        type: 'bar',
        marker: {
            color: 'green'  // All changes are now positive, so we use green for all bars
        },
        text: pointChanges.map(team => `+${team.change.toFixed(2)}`),
        textposition: 'auto',
        hoverinfo: 'x+text'
    };

    const layout = {
        title: {
            text: 'Latest Points Added per Team',
            font: {
                family: 'VT323, monospace',
                color: '#ff1493'
            }
        },
        xaxis: {
            title: '',
            tickangle: -45,
             tickfont: {
                size: 8  // Smaller font size for x-axis labels
            }
        },
        yaxis: {
            title: 'Points Added',
        },
        paper_bgcolor: '#fff0f5',
        plot_bgcolor: '#fff0f5',
    };

    createResponsiveChart('latestPointsUpdateChart', [trace], layout);
}


// List of common name prefixes
const namePrefixes = ['VAN', 'DE', 'VON', 'DER', 'TEN', 'TER', 'DEN', 'DA', 'DOS', 'DAS', 'DU', 'LA', 'LE', 'MC', 'MAC'];

function convertNameFormat(name) {
    // Split the name into parts
    const parts = name.split(' ');
    // Capitalize the first letter of each part
    return parts.map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(' ');
}
function applyWithdrawnRiderStyles() {
    const withdrawnRiders = new Set(cyclistData.withdrawals.map(w => normalizeNameDiacritics(w.rider)));
    
    function strikethroughWithdrawnRiders(element) {
        if (element.nodeType === Node.TEXT_NODE) {
            const parent = element.parentNode;
            const text = element.textContent;
            const parts = text.split(/\b/);
            const newFragment = document.createDocumentFragment();
            
            parts.forEach(part => {
                if (withdrawnRiders.has(normalizeNameDiacritics(part.trim()))) {
                    const span = document.createElement('span');
                    span.style.textDecoration = 'line-through';
                    span.textContent = part;
                    newFragment.appendChild(span);
                } else {
                    newFragment.appendChild(document.createTextNode(part));
                }
            });
            
            parent.replaceChild(newFragment, element);
        } else if (element.nodeType === Node.ELEMENT_NODE) {
            if (element.tagName === 'A' && withdrawnRiders.has(normalizeNameDiacritics(element.textContent.trim()))) {
                element.style.textDecoration = 'line-through';
            }
            Array.from(element.childNodes).forEach(strikethroughWithdrawnRiders);
        }
    }

    strikethroughWithdrawnRiders(document.body);
}

function generateNewsContent() {
    let newsHtml = '';

    // Add the welcome message
    newsHtml += '<div class="welcome-message">';
    newsHtml += '<p>This is the Velo Data Dash! <br> A Second-Hand WebApp for Velogames Datascience.</p>';
    newsHtml += '</div>';

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
                <span class="team-name"><a href="#" class="team-link" data-team="${team.name}">${team.name}</a></span>
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
    if (cyclistData && cyclistData.league_scores && cyclistData.league_scores.history && cyclistData.league_scores.history.length >= 2) {
        const latestHistory = cyclistData.league_scores.history[cyclistData.league_scores.history.length - 1];
        const previousHistory = cyclistData.league_scores.history[cyclistData.league_scores.history.length - 2];

        const latestDate = new Date(latestHistory.date);
        newsHtml += `<h3>Recent Points Added <span class="news-date">(${latestDate.toDateString()})</span></h3>`;

        const scoreChanges = latestHistory.scores.map(latest => {
            const previous = previousHistory.scores.find(prev => prev.name === latest.name);
            return {
                name: latest.name,
                change: Math.max(0, latest.points - (previous ? previous.points : latest.points))
            };
        });

        // Sort score changes by the amount of change (descending)
        scoreChanges.sort((a, b) => b.change - a.change);

        newsHtml += '<div class="score-changes-list">';
        scoreChanges.slice(0, 5).forEach((team, index) => {
            newsHtml += `<div class="score-change-item">
                <span class="standing-rank">${index + 1}</span>
                <span class="team-name"><a href="#" class="team-link" data-team="${team.name}">${team.name}</a></span>
                <span class="team-change positive-change">+${team.change} points</span>
            </div>`;
        });
        newsHtml += '</div>';
    } else {
        newsHtml += '<h3>Recent Points Added</h3>';
        newsHtml += '<p>Recent score change data not available.</p>';
    }
    newsHtml += '</div>';
    newsHtml += '</div>';

    newsHtml += '</div>'; // Close news-row

    // Most Recent MVP and MIP
    newsHtml += '<div class="news-section news-achievements">';
    let achievementDate = 'N/A';
    if (cyclistData && cyclistData.mip_history && cyclistData.mip_history.length > 0) {
        const mip = cyclistData.mip_history[cyclistData.mip_history.length - 1];
        achievementDate = new Date(mip.date).toDateString();
    }
    newsHtml += `<h3>Recent Achievements <span class="news-date">(${achievementDate})</span></h3>`;
    if (cyclistData && cyclistData.mvp_history && cyclistData.mvp_history.length > 0) {
        const mvp = cyclistData.mvp_history[cyclistData.mvp_history.length - 1];
        newsHtml += `<p><span class="achievement-name">MVP: <a href="#" class="rider-link" data-rider="${mvp.name}">${mvp.name}</a></span><span class="achievement-value">${mvp.points_added.toFixed(2)} points added</span></p>`;
    }
    if (cyclistData && cyclistData.mip_history && cyclistData.mip_history.length > 0) {
        const mip = cyclistData.mip_history[cyclistData.mip_history.length - 1];
        newsHtml += `<p><span class="achievement-name">MIP: <a href="#" class="rider-link" data-rider="${mip.name}">${mip.name}</a></span><span class="achievement-value">${mip.percentage_increase.toFixed(2)}% increase</span></p>`;
    }
    newsHtml += '</div>';

     // Add Withdrawals section
    if (cyclistData.withdrawals && cyclistData.withdrawals.length > 0) {
        newsHtml += '<div class="news-section news-withdrawals">';
        newsHtml += '<h3>Recent Withdrawals</h3>';
        newsHtml += '<div class="withdrawals-list">';
        
        // Sort withdrawals by stage in descending order
        const sortedWithdrawals = cyclistData.withdrawals.sort((a, b) => b.stage - a.stage);
        
        // Display the 5 most recent withdrawals
        sortedWithdrawals.slice(0, 5).forEach(withdrawal => {
            const convertedName = convertNameFormat(withdrawal.rider);
            newsHtml += `
                <div class="withdrawal-item">
                    <span class="rider-name">
                        <a href="#" class="rider-link" data-rider="${convertedName}">${convertedName}</a>
                        <span class="team-name">(${withdrawal.team})</span>
                    </span>
                    <span class="stage-info">Stage ${withdrawal.stage}</span>
                </div>
            `;
        });
        
        newsHtml += '</div>'; // Close withdrawals-list
        newsHtml += '</div>'; // Close news-section news-withdrawals
    }
    // Top 10 Riders
    newsHtml += '<div class="news-section news-top-riders">';
    newsHtml += '<h3>Top 10 Riders</h3>';
    if (cyclistData && cyclistData.cyclists) {
        const top10 = cyclistData.cyclists.sort((a, b) => b.points - a.points).slice(0, 10);
        newsHtml += '<div class="top-riders-list">';
        top10.forEach((rider, index) => {
            newsHtml += `<div class="top-rider-item">
                <span class="rider-rank">${index + 1}</span>
                <span class="rider-name"><a href="#" class="rider-link" data-rider="${rider.name}">${rider.name}</a> <span class="rider-details">(${rider.team})</span></span>
                <span class="rider-details">${rider.points} points</span>
            </div>`;
        });
        newsHtml += '</div>';
    } else {
        newsHtml += '<p>Rider data not available.</p>';
    }
    newsHtml += '</div>';

    document.getElementById('News').innerHTML = newsHtml;
    applyWithdrawnRiderStyles();


    // Add event listeners to the new rider links
    document.querySelectorAll('#News .rider-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const riderName = this.getAttribute('data-rider');
            openTab(null, 'RiderTrajectoryTab', riderName);
        });
    });

    // Add event listeners to the new team links
    document.querySelectorAll('#News .team-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const teamName = this.getAttribute('data-team');
            openTab(null, 'LeagueScoresTab');
            // Set the selected team in the dropdown and update the chart
            document.getElementById('leagueTeamSelect').value = teamName;
            updateLeagueTeamRosterChart();
        });
    });
}

function displayTeamCostsChart() {
    const teams = {};
    cyclistData.cyclists.forEach(cyclist => {
        if (!teams[cyclist.team]) {
            teams[cyclist.team] = 0;
        }
        teams[cyclist.team] += cyclist.cost;
    });

    const sortedTeams = Object.entries(teams).sort((a, b) => b[1] - a[1]);
    const teamNames = sortedTeams.map(team => team[0]);
    const teamColors = getTeamColors(teamNames);

    const trace = {
        x: teamNames,
        y: sortedTeams.map(team => team[1]),
        type: 'bar',
        marker: {
            color: teamNames.map(team => teamColors[team]),
            line: {
                color: '#FF69B4',
                width: 1.5
            }
        },
        text: sortedTeams.map(team => `${team[1].toFixed(2)} credits`),
        textposition: 'auto',
        hoverinfo: 'text',
        hovertext: sortedTeams.map(team => `${team[0]}<br>${team[1].toFixed(2)} credits`)
    };

    const layout = {
        title: {
            text: 'Total Team Costs',
            font: {
                family: 'VT323, monospace',
                color: '#FF1493'
            }
        },
        xaxis: {
            title: '',
            tickangle: -45,
            tickfont: {
                family: 'VT323, monospace',
                color: '#FF1493'
            }
        },
        yaxis: {
            title: 'Total Cost (Credits)',
            tickfont: {
                family: 'VT323, monospace',
                color: '#FF1493'
            }
        },
        paper_bgcolor: '#FFF0F5',
        plot_bgcolor: '#FFF0F5',
        font: {
            family: 'VT323, monospace',
            color: '#000000'
        }
    };

    createResponsiveChart('teamCostsChart', [trace], layout);
}

function displayTeamPointsVsCostChart() {
    const teams = {};
    cyclistData.cyclists.forEach(cyclist => {
        if (!teams[cyclist.team]) {
            teams[cyclist.team] = { cost: 0, points: 0 };
        }
        teams[cyclist.team].cost += cyclist.cost;
        teams[cyclist.team].points += cyclist.points;
    });

    const teamData = Object.entries(teams).map(([name, data]) => ({
        name,
        cost: data.cost,
        points: data.points,
        efficiency: data.points / data.cost
    }));

    teamData.sort((a, b) => b.efficiency - a.efficiency);

    const efficiencies = teamData.map(team => team.efficiency);
    const minEfficiency = Math.min(...efficiencies);
    const maxEfficiency = Math.max(...efficiencies);

    // Calculate axis ranges with padding
    const costs = teamData.map(team => team.cost);
    const points = teamData.map(team => team.points);
    const minCost = Math.min(...costs);
    const maxCost = Math.max(...costs);
    const minPoints = Math.min(...points);
    const maxPoints = Math.max(...points);
    const costRange = maxCost - minCost;
    const pointsRange = maxPoints - minPoints;
    const padding = 0.1; // 10% padding

    const trace = {
        x: teamData.map(team => team.cost),
        y: teamData.map(team => team.points),
        mode: 'markers+text',
        type: 'scatter',
        marker: {
            size: 12,
            color: teamData.map(team => team.efficiency),
            colorscale: 'Viridis',
            colorbar: {
                title: 'Efficiency<br>(Points/Cost)',
                tickfont: {
                    family: 'VT323, monospace',
                    size: 12
                }
            },
            cmin: minEfficiency,
            cmax: maxEfficiency,
            line: {
                color: '#FF69B4',
                width: 1
            }
        },
        text: teamData.map(team => team.name),
        textposition: 'top center',
        textfont: {
            family: 'VT323, monospace',
            size: 9,
            color: '#000000'
        },
        hoverinfo: 'text',
        hovertext: teamData.map(team => 
            `${team.name}<br>` +
            `Cost: ${team.cost.toFixed(2)} credits<br>` +
            `Points: ${team.points.toFixed(2)}<br>` +
            `Efficiency: ${team.efficiency.toFixed(2)} points/credit`
        )
    };

    const layout = {
        title: {
            text: 'Team Points vs Team Cost (Colored by Efficiency)',
            font: {
                family: 'VT323, monospace',
                size: 24,
                color: '#FF1493'
            }
        },
        xaxis: {
            title: 'Team Cost (Credits)',
            tickfont: {
                family: 'VT323, monospace',
                size: 14,
                color: '#000000'
            },
            range: [minCost - padding * costRange, maxCost + padding * costRange],
        },
        yaxis: {
            title: 'Team Points',
            tickfont: {
                family: 'VT323, monospace',
                size: 14,
                color: '#000000'
            },
            range: [minPoints - padding * pointsRange, maxPoints + padding * pointsRange],
        },
        paper_bgcolor: '#FFF0F5',
        plot_bgcolor: '#FFF0F5',
        font: {
            family: 'VT323, monospace',
            color: '#000000'
        },
        hovermode: 'closest',
        showlegend: false,
        margin: {t: 50, r: 50, b: 50, l: 50},
        autosize: true,
    };

    const config = {
        responsive: true,
        displayModeBar: false,
    };

    createResponsiveChart('teamPointsVsCostChart', [trace], layout, config);

    // Function to adjust label positions to avoid overlap
    function adjustLabelPositions() {
        const chartElement = document.getElementById('teamPointsVsCostChart');
        const labels = chartElement.getElementsByClassName('textpoint');
        const positions = [];

        for (let label of labels) {
            const rect = label.getBoundingClientRect();
            positions.push({
                element: label,
                top: rect.top,
                bottom: rect.bottom,
                height: rect.height
            });
        }

        positions.sort((a, b) => a.top - b.top);

        for (let i = 1; i < positions.length; i++) {
            const current = positions[i];
            const previous = positions[i - 1];
            const overlap = previous.bottom - current.top;

            if (overlap > 0) {
                const offset = overlap + 2; // 2px extra space
                current.element.style.transform = `translateY(${offset}px)`;
                current.top += offset;
                current.bottom += offset;
            }
        }
    }

    // Call adjustLabelPositions after the chart has been rendered
    setTimeout(adjustLabelPositions, 1000); // Adjust delay as needed

    // Adjust labels on window resize
    window.addEventListener('resize', () => {
        Plotly.Plots.resize('teamPointsVsCostChart');
        adjustLabelPositions();
    });
}
function displayTeamEfficiencyChart() {
    const teams = {};
    cyclistData.cyclists.forEach(cyclist => {
        if (!teams[cyclist.team]) {
            teams[cyclist.team] = { cost: 0, points: 0 };
        }
        teams[cyclist.team].cost += cyclist.cost;
        teams[cyclist.team].points += cyclist.points;
    });

    const teamData = Object.entries(teams).map(([name, data]) => ({
        name,
        efficiency: data.points / data.cost
    }));

    teamData.sort((a, b) => b.efficiency - a.efficiency);
    const teamNames = teamData.map(team => team.name);
    const teamColors = getTeamColors(teamNames);

    const trace = {
        x: teamNames,
        y: teamData.map(team => team.efficiency),
        type: 'bar',
        marker: {
            color: teamNames.map(team => teamColors[team]),
            line: {
                color: '#FF69B4',
                width: 1.5
            }
        },
        text: teamData.map(team => team.efficiency.toFixed(2)),
        textposition: 'auto',
        hoverinfo: 'text',
        hovertext: teamData.map(team => 
            `${team.name}<br>` +
            `Efficiency: ${team.efficiency.toFixed(2)} points/credit`
        )
    };

    const layout = {
        title: {
            text: 'Team Efficiency (Points per Credit)',
            font: {
                family: 'VT323, monospace',
                size: 24,
                color: '#FF1493'
            }
        },
        xaxis: {
            title: '',
            tickangle: -45,
            tickfont: {
                family: 'VT323, monospace',
                size: 12,
                color: '#000000'
            }
        },
        yaxis: {
            title: 'Efficiency (Points/Credit)',
            tickfont: {
                family: 'VT323, monospace',
                size: 14,
                color: '#000000'
            }
        },
        paper_bgcolor: '#FFF0F5',
        plot_bgcolor: '#FFF0F5',
        font: {
            family: 'VT323, monospace',
            color: '#000000'
        },
        autosize: true,
        margin: {t: 50, r: 50, b: 100, l: 50},
    };

    createResponsiveChart('teamEfficiencyChart', [trace], layout);
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
    const teamNames = sortedTeams.map(team => team[0]);
    const teamColors = getTeamColors(teamNames);

    const trace = {
        x: teamNames,
        y: sortedTeams.map(team => team[1]),
        type: 'bar',
        marker: {
            color: teamNames.map(team => teamColors[team]),
            line: {
                color: '#FF69B4',
                width: 1.5
            }
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
function getTeamColors(teamNames) {
    teamNames.forEach(team => {
        if (!globalTeamColors[team]) {
            globalTeamColors[team] = customColorScheme[Object.keys(globalTeamColors).length % customColorScheme.length];
        }
    });
    return globalTeamColors;
}
function displayRiskAssessmentTable(riskData) {
    const tableContainer = document.getElementById('riskAssessmentTable');
    if (!tableContainer) {
        console.error('Risk assessment table container not found');
        return;
    }

    let tableHTML = `
        <table class="risk-table">
            <thead>
                <tr>
                    <th>Rider</th>
                    <th>Overall Risk</th>
                    <th>Cost Efficiency</th>
                    <th>Ownership</th>
                    <th>Consistency</th>
                    <th>Trend</th>
                    <th>Role</th>
                    <th>Cost</th>
                    <th>Points</th>
                </tr>
            </thead>
            <tbody>
    `;

    riskData.forEach(r => {
        tableHTML += `
            <tr>
                <td>${r.rider}</td>
                <td>${r.overallRisk.toFixed(2)}</td>
                <td>${r.costEfficiencyRisk.toFixed(2)}</td>
                <td>${r.ownershipRisk.toFixed(2)}</td>
                <td>${r.consistencyRisk.toFixed(2)}</td>
                <td>${r.trendRisk.toFixed(2)}</td>
                <td>${r.roleRisk.toFixed(2)}</td>
                <td>${r.cost}</td>
                <td>${r.points}</td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;

    tableContainer.innerHTML = tableHTML;
}


function displayTeamRiskAssessment(selectedTeam) {
    const teamRiders = cyclistData.cyclists.filter(cyclist => cyclist.team === selectedTeam);
    const riskData = teamRiders.map(rider => calculateRiderRisk(rider.name)).filter(risk => risk !== null);

    riskData.sort((a, b) => b.overallRisk - a.overallRisk);

    // Display the chart
    const trace = {
        x: riskData.map(r => r.rider),
        y: riskData.map(r => r.overallRisk),
        type: 'bar',
        marker: {
            color: riskData.map(r => {
                if (r.overallRisk < 0.8) return 'green';
                if (r.overallRisk < 1.2) return 'yellow';
                return 'red';
            }),
            line: {
                color: '#FF69B4',
                width: 1.5
            }
        },
        text: riskData.map(r => r.overallRisk.toFixed(2)),
        textposition: 'auto',
        hoverinfo: 'text',
        hovertext: riskData.map(r => 
            `${r.rider}<br>` +
            `Overall Risk: ${r.overallRisk.toFixed(2)}<br>` +
            `Cost Efficiency Risk: ${r.costEfficiencyRisk.toFixed(2)}<br>` +
            `Ownership Risk: ${r.ownershipRisk.toFixed(2)}<br>` +
            `Consistency Risk: ${r.consistencyRisk.toFixed(2)}<br>` +
            `Trend Risk: ${r.trendRisk.toFixed(2)}<br>` +
            `Role Risk: ${r.roleRisk.toFixed(2)}<br>` +
            `Cost: ${r.cost} | Points: ${r.points}<br>` +
            `Ownership: ${r.ownership}% | Role: ${r.role}`
        )
    };

    const layout = {
        title: {
            text: `Risk Assessment for ${selectedTeam}`,
            font: {
                family: 'VT323, monospace',
                size: 24,
                color: '#FF1493'
            }
        },
        xaxis: {
            title: 'Riders',
            tickangle: -45,
            tickfont: {
                family: 'VT323, monospace',
                size: 12,
                color: '#000000'
            }
        },
        yaxis: {
            title: 'Risk Score',
            tickfont: {
                family: 'VT323, monospace',
                size: 14,
                color: '#000000'
            }
        },
        paper_bgcolor: '#FFF0F5',
        plot_bgcolor: '#FFF0F5',
        font: {
            family: 'VT323, monospace',
            color: '#000000'
        },
        autosize: true,
        margin: {t: 50, r: 50, b: 100, l: 50},
    };

    createResponsiveChart('teamRiskAssessmentChart', [trace], layout);

    // Display the table
    displayRiskAssessmentTable(riskData);
}


function displayRiskAssessmentTable(riskData) {
    const tableContainer = document.getElementById('riskAssessmentTable');
    if (!tableContainer) {
        console.error('Risk assessment table container not found');
        return;
    }

    let tableHTML = `
        <table class="risk-table">
            <thead>
                <tr>
                    <th>Rider</th>
                    <th>Overall Risk</th>
                    <th>Cost Efficiency</th>
                    <th>Ownership</th>
                    <th>Consistency</th>
                    <th>Trend</th>
                    <th>Role</th>
                    <th>Cost</th>
                    <th>Points</th>
                    <th>Ownership %</th>
                </tr>
            </thead>
            <tbody>
    `;

    riskData.forEach(r => {
        tableHTML += `
            <tr>
                <td>${r.rider}</td>
                <td>${r.overallRisk.toFixed(2)}</td>
                <td>${r.costEfficiencyRisk.toFixed(2)}</td>
                <td>${r.ownershipRisk.toFixed(2)}</td>
                <td>${r.consistencyRisk.toFixed(2)}</td>
                <td>${r.trendRisk.toFixed(2)}</td>
                <td>${r.role}</td>
                <td>${r.cost}</td>
                <td>${r.points}</td>
                <td>${r.ownership}%</td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;

    tableContainer.innerHTML = tableHTML;
}
function calculateRiderRisk(riderName) {
    const rider = cyclistData.cyclists.find(c => c.name === riderName);
    if (!rider) {
        console.error(`Rider ${riderName} not found`);
        return null;
    }

    // Calculate mean points per rider across all cyclists
    const meanPointsPerRider = cyclistData.cyclists.reduce((sum, c) => sum + c.points, 0) / cyclistData.cyclists.length;

    // Calculate mean points per rider for each role
    const rolePoints = {};
    cyclistData.cyclists.forEach(c => {
        if (!rolePoints[c.role]) {
            rolePoints[c.role] = { total: 0, count: 0 };
        }
        rolePoints[c.role].total += c.points;
        rolePoints[c.role].count++;
    });

    const roleMeanPoints = Object.keys(rolePoints).reduce((acc, role) => {
        acc[role] = rolePoints[role].total / rolePoints[role].count;
        return acc;
    }, {});

    // Factor 1: Cost Efficiency Risk
    const avgCostPerPoint = cyclistData.cyclists.reduce((sum, c) => sum + (c.cost / Math.max(c.points, 1)), 0) / cyclistData.cyclists.length;
    const riderCostPerPoint = rider.cost / Math.max(rider.points, 1);
    const costEfficiencyRisk = riderCostPerPoint / avgCostPerPoint;

    // Factor 2: Ownership Risk (higher ownership = lower risk)
    const maxOwnership = Math.max(...cyclistData.cyclists.map(c => c.ownership));
    const ownershipRisk = 1 - (rider.ownership / maxOwnership);

    // Factor 3: Consistency Risk
    const pointHistory = rider.pointHistory.map(h => h.points);
    const avgPoints = pointHistory.reduce((sum, points) => sum + points, 0) / pointHistory.length;
    const variance = pointHistory.reduce((sum, points) => sum + Math.pow(points - avgPoints, 2), 0) / pointHistory.length;
    const standardDeviation = Math.sqrt(variance);
    const consistencyRisk = standardDeviation / Math.max(avgPoints, 1);

    // Factor 4: Recent Performance Trend
    const recentPerformance = pointHistory.slice(-3); // Last 3 performances
    const trend = recentPerformance.reduce((sum, points, index) => sum + points * (index + 1), 0) / 6; // Weighted sum
    const trendRisk = avgPoints / Math.max(trend, 1); // Lower if recent performance is better than average

    // Factor 5: Role-based Risk
    const roleRisk = meanPointsPerRider / Math.max(roleMeanPoints[rider.role], 1);

    // Combine factors (adjust weights as needed)
    const overallRisk = (
        costEfficiencyRisk * 0.3 +
        ownershipRisk * 0.1 +
        consistencyRisk * 0.2 +
        trendRisk * 0.2 +
        roleRisk * 0.2
    );

    return {
        rider: rider.name,
        overallRisk: overallRisk,
        costEfficiencyRisk: costEfficiencyRisk,
        ownershipRisk: ownershipRisk,
        consistencyRisk: consistencyRisk,
        trendRisk: trendRisk,
        roleRisk: roleRisk,
        cost: rider.cost,
        points: rider.points,
        ownership: rider.ownership,
        role: rider.role
    };
}
function toggleRiskExplanation() {
    const explanationContainer = document.getElementById('riskExplanationContainer');
    const button = document.getElementById('riskInfoButton');
    if (explanationContainer.style.display === 'none') {
        explanationContainer.style.display = 'block';
        button.textContent = 'Hide Risk Calculation Info';
    } else {
        explanationContainer.style.display = 'none';
        button.textContent = 'Risk Calculation Info';
    }
}
function displayTeamOverallRisk() {
    const teams = {};
    cyclistData.cyclists.forEach(cyclist => {
        if (!teams[cyclist.team]) {
            teams[cyclist.team] = [];
        }
        teams[cyclist.team].push(cyclist);
    });

    const teamRisks = Object.entries(teams).map(([teamName, riders]) => {
        const teamRisks = riders.map(rider => calculateRiderRisk(rider.name).overallRisk);
        const avgRisk = teamRisks.reduce((sum, risk) => sum + risk, 0) / teamRisks.length;
        return { team: teamName, risk: avgRisk };
    });

    teamRisks.sort((a, b) => b.risk - a.risk);

    const trace = {
        x: teamRisks.map(t => t.team),
        y: teamRisks.map(t => t.risk),
        type: 'bar',
        marker: {
            color: teamRisks.map(t => {
                if (t.risk < 0.8) return 'green';
                if (t.risk < 1.2) return 'yellow';
                return 'red';
            }),
            line: {
                color: '#FF69B4',
                width: 1.5
            }
        },
        text: teamRisks.map(t => t.risk.toFixed(2)),
        textposition: 'auto',
        hoverinfo: 'text',
        hovertext: teamRisks.map(t => 
            `${t.team}<br>` +
            `Overall Risk: ${t.risk.toFixed(2)}`
        )
    };

    const layout = {
        title: {
            text: 'Team Overall Risk (Average Risk of Riders)',
            font: {
                family: 'VT323, monospace',
                size: 24,
                color: '#FF1493'
            }
        },
        xaxis: {
            title: 'Teams',
            tickangle: -45,
            tickfont: {
                family: 'VT323, monospace',
                size: 12,
                color: '#000000'
            }
        },
        yaxis: {
            title: 'Risk Score',
            tickfont: {
                family: 'VT323, monospace',
                size: 14,
                color: '#000000'
            }
        },
        paper_bgcolor: '#FFF0F5',
        plot_bgcolor: '#FFF0F5',
        font: {
            family: 'VT323, monospace',
            color: '#000000'
        },
        autosize: true,
        margin: {t: 50, r: 50, b: 100, l: 50},
    };

    createResponsiveChart('teamOverallRiskChart', [trace], layout);
}
function updateRiskAssessment() {
    const cyclingTeamSelect2 = document.getElementById('cyclingTeamSelect2');
    
    // If no team is selected, select the first team
    if (!cyclingTeamSelect2.value) {
        if (cyclingTeamSelect2.options.length > 1) {
            cyclingTeamSelect2.selectedIndex = 1; // Select the first team (index 0 is usually the default "Select a team" option)
        }
    }

    const selectedTeam = cyclingTeamSelect2.value;
    if (!selectedTeam) {
        document.getElementById('selectedTeamInfo').textContent = '';
        document.getElementById('teamRiskAssessmentChart').innerHTML = '';
        document.getElementById('riskAssessmentTable').innerHTML = '';
        return;
    }

    document.getElementById('selectedTeamInfo').textContent = selectedTeam;
    displayTeamRiskAssessment(selectedTeam);
    displayTeamOverallRisk();
}
function displayTeamEfficiencyChart() {
    const teams = {};
    cyclistData.cyclists.forEach(cyclist => {
        if (!teams[cyclist.team]) {
            teams[cyclist.team] = { cost: 0, points: 0 };
        }
        teams[cyclist.team].cost += cyclist.cost;
        teams[cyclist.team].points += cyclist.points;
    });

    const teamData = Object.entries(teams).map(([name, data]) => ({
        name,
        efficiency: data.points / data.cost
    }));

    teamData.sort((a, b) => b.efficiency - a.efficiency);
    const teamNames = teamData.map(team => team.name);
    const teamColors = getTeamColors(teamNames);

    const trace = {
        x: teamNames,
        y: teamData.map(team => team.efficiency),
        type: 'bar',
        marker: {
            color: teamNames.map(team => teamColors[team]),
            line: {
                color: '#FF69B4',
                width: 1.5
            }
        },
        text: teamData.map(team => team.efficiency.toFixed(2)),
        textposition: 'auto',
        hoverinfo: 'text',
        hovertext: teamData.map(team => 
            `${team.name}<br>` +
            `Efficiency: ${team.efficiency.toFixed(2)} points/credit`
        )
    };

    const layout = {
        title: {
            text: 'Team Efficiency (Points per Credit)',
            font: {
                family: 'VT323, monospace',
                size: 24,
                color: '#FF1493'
            }
        },
        xaxis: {
            title: '',
            tickangle: -45,
            tickfont: {
                family: 'VT323, monospace',
                size: 12,
                color: '#000000'
            }
        },
        yaxis: {
            title: 'Efficiency (Points/Credit)',
            tickfont: {
                family: 'VT323, monospace',
                size: 14,
                color: '#000000'
            }
        },
        paper_bgcolor: '#FFF0F5',
        plot_bgcolor: '#FFF0F5',
        font: {
            family: 'VT323, monospace',
            color: '#000000'
        },
        autosize: true,
        margin: {t: 50, r: 50, b: 100, l: 50},
    };

    createResponsiveChart('teamEfficiencyChart', [trace], layout);
}

function calculateDailyPoints(rosterNames) {
    const dailyPoints = {};
    
    rosterNames.forEach(riderName => {
        const normalizedRiderName = normalizeNameDiacritics(riderName);
        const rider = cyclistData.cyclists.find(c => normalizeNameDiacritics(c.name) === normalizedRiderName);
        if (rider && rider.pointHistory) {
            rider.pointHistory.forEach(history => {
                const date = history.date.split('T')[0];
                if (!dailyPoints[date]) {
                    dailyPoints[date] = {};
                }
                dailyPoints[date][normalizedRiderName] = history.points;
            });
        }
    });

    return dailyPoints;
}

function createDailyPointsChart(dailyPoints, teamName) {
    const dates = Object.keys(dailyPoints).sort();
    const riders = Object.keys(dailyPoints[dates[0]]);

    const traces = riders.map((rider, index) => {
        const originalRiderName = cyclistData.cyclists.find(c => normalizeNameDiacritics(c.name) === rider)?.name || rider;
        const isWithdrawn = cyclistData.withdrawals.some(w => normalizeNameDiacritics(w.rider) === rider);
        return {
            x: dates,
            y: dates.map(date => dailyPoints[date][rider] || 0),
            type: 'scatter',
            mode: 'lines+markers',
            name: isWithdrawn ? `<span style="text-decoration:line-through;">${originalRiderName}</span>` : originalRiderName,
            legendgroup: `group${Math.floor(index / 3)}`,
            hoverinfo: 'text',
            hovertext: dates.map(date => 
                `${originalRiderName}${isWithdrawn ? ' (Withdrawn)' : ''}<br>Date: ${date}<br>Points: ${dailyPoints[date][rider] || 0}`
            )
        };
    });

    const layout = {
        title: {
            text: `Daily Points for ${teamName}`,
            font: {
                family: 'VT323, monospace',
                color: '#ff1493'
            }
        },
        xaxis: {
            title: '',
            tickangle: -45,
            tickfont: {
                size: 8
            }
        },
        yaxis: {
            title: 'Points',
        },
        paper_bgcolor: '#fff0f5',
        plot_bgcolor: '#fff0f5',
        legend: {
            orientation: 'v',
            traceorder: 'grouped',
            tracegroupgap: 0,
            font: {
                family: 'VT323, monospace',
                size: 10
            },
            x: 1,
            y: 1,
            xanchor: 'left',
            yanchor: 'top'
        },
        hovermode: 'closest',
        margin: {
            r: 150  // Increase right margin to accommodate legend
        }
    };

    createResponsiveChart('dailyPointsChart', traces, layout);
}

function displayAllStarTeam() {
    if (!cyclistData.league_all_star_team) {
        document.getElementById('AllStarTeamTab').innerHTML = '<p>All-Star Team data not available.</p>';
        return;
    }

    const allStarTeam = cyclistData.league_all_star_team;
    const twitterComparison = allStarTeam.twitter_league_comparison;


    let allStarHtml = `
        <div class="team-roster-container">
            <h2>All-Star Team</h2>
            <div class="team-stats">
                <div class="stat-box">
                    <h3>Total Points</h3>
                    <p>${allStarTeam.total_points}</p>
                </div>
                <div class="stat-box">
                    <h3>Total Cost</h3>
                    <p>${allStarTeam.total_cost}</p>
                </div>
                <div class="stat-box">
                    <h3>Twitter League Rank</h3>
                    <p>${twitterComparison.rank} / ${twitterComparison.total_participants}</p>
                </div>
                <div class="stat-box">
                    <h3>Percentile</h3>
                    <p>${twitterComparison.percentile.toFixed(2)}%</p>
                </div>
            </div>
            <div class="roster-charts-row">
                <div class="roster-chart-column">
                    <div id="allStarTeamRosterDisplay" class="team-roster"></div>
                </div>
                <div class="roster-chart-column">
                    <div class="chart-container">
                        <div id="allStarTeamPointsDistributionChart"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('AllStarTeamTab').innerHTML = allStarHtml;

    // Populate the roster display
    const rosterDisplay = document.getElementById('allStarTeamRosterDisplay');
    allStarTeam.riders.forEach(rider => {
        const riderCard = document.createElement('div');
        riderCard.className = 'rider-card';
        riderCard.innerHTML = `
            <h4>${rider.name}</h4>
            <p>Team: ${rider.team}</p>
            <p>Role: ${rider.role}</p>
            <p>Cost: ${rider.cost}</p>
            <p>Points: ${rider.points}</p>
        `;
        rosterDisplay.appendChild(riderCard);
    });
    applyWithdrawnRiderStyles();

    // Create and display the points distribution chart
    displayAllStarTeamPointsDistribution(allStarTeam.riders);
}

function displayAllStarTeamPointsDistribution(riders) {
    const sortedRiders = riders.sort((a, b) => b.points - a.points);

    const trace = {
        labels: sortedRiders.map(rider => `${rider.name}<br>(${rider.role})`),
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
        textposition: 'outside',
        automargin: true
    };

    const layout = {
        title: {
            text: 'All-Star Team Points Distribution',
            font: { family: 'VT323, monospace', color: '#ff1493' }
        },
        paper_bgcolor: '#fff0f5',
        plot_bgcolor: '#fff0f5',
        showlegend: false,
        margin: {l: 50, r: 50, t: 50, b: 50, pad: 4},
        height: 500,
        width: 700
    };

    createResponsiveChart('allStarTeamPointsDistributionChart', [trace], layout);
}
function createBestRoleSelectionsComponent(leagueData, cyclistData) {
    const roles = ['All Rounder', 'Climber', 'Sprinter', 'Unclassed'];
    const bestByRole = {};

    roles.forEach(role => {
        let bestScore = 0;
        let bestTeam = '';
        let bestRiders = [];

        leagueData.forEach(team => {
            const roleRiders = team.roster
                .map(riderName => cyclistData.cyclists.find(c => c.name === riderName))
                .filter(rider => rider && rider.role === role);

            const totalPoints = roleRiders.reduce((sum, rider) => sum + rider.points, 0);

            if (totalPoints > bestScore) {
                bestScore = totalPoints;
                bestTeam = team.name;
                bestRiders = roleRiders;
            }
        });

        bestByRole[role] = { team: bestTeam, score: bestScore, riders: bestRiders };
    });

    const container = document.createElement('div');
    container.className = 'best-role-selections';
    container.innerHTML = `
        <h2>Best by Category</h2>
        <div class="best-role-grid">
            ${roles.map(role => `
                <div class="role-card">
                    <h3>${role}</h3>
                    <p class="team-name">${bestByRole[role].team}</p>
                    <p class="total-points">Total Points: ${bestByRole[role].score}</p>
                    <ul>
                        ${bestByRole[role].riders.map(rider => `
                            <li>${rider.name} (${rider.points} pts)</li>
                        `).join('')}
                    </ul>
                </div>
            `).join('')}
        </div>
    `;

    return container;
}

function updateBestRoleSelections() {
    const container = document.getElementById('bestRoleSelectionsContainer');
    if (container) {
        container.innerHTML = ''; // Clear existing content
        container.style.width = '100%';  // Ensure full width
        const bestRoleSelectionsComponent = createBestRoleSelectionsComponent(leagueData, cyclistData);
        container.appendChild(bestRoleSelectionsComponent);
    }
}
function normalizeNameDiacritics(name) {
    // First, handle the tilde separately
    const withoutTilde = name.replace(/ñ/gi, 'n').replace(/Ñ/gi, 'N');
    
    // Then proceed with the general diacritic removal
    const decomposed = withoutTilde.normalize('NFD');
    const normalized = decomposed.replace(/[\u0300-\u036f]/g, '');
    
    // Convert to lowercase for case-insensitive comparison
    return normalized.toLowerCase();
}

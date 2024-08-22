
// Global variable to store the cyclist data
let cyclistData;

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
        createLeagueScoresChart(leagueScores);
        createCostVsPointsChart(top50Cyclists);

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
        text: top50Cyclists.map(c => `Points: ${c.points}<br>Cost: ${c.cost}`),
        hoverinfo: 'text+y'
    };

    const layout = {
        title: {
            text: 'Top 50 Cyclists by Cost Efficiency(Lower is better)',
            font: {
                family: 'VT323, monospace',
                size: 24,
                color: '#ff1493'
            }
        },
        xaxis: {
            title: '',
            tickangle: -45,
            titlefont: {
                family: 'VT323, monospace',
                size: 16,
                color: '#ff1493'
            },
            tickfont: {
                family: 'VT323, monospace',
                size: 14,
                color: '#ff1493'
            }
        },
        yaxis: {
            title: 'Cost per Point',
            titlefont: {
                family: 'VT323, monospace',
                size: 16,
                color: '#ff1493'
            },
            tickfont: {
                family: 'VT323, monospace',
                size: 14,
                color: '#ff1493'
            }
        },
        legend: {
            font: {
                family: 'VT323, monospace',
                size: 14,
                color: '#000000'
            }
        },
        paper_bgcolor: '#fff0f5',
        plot_bgcolor: '#fff0f5',
        height: 500,
        margin: {
            l: 50,
            r: 50,
            b: 100,
            t: 50,
            pad: 4
        }
    };

    Plotly.newPlot('top50Chart', [trace], layout);
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
        text: top50PointsPerNameLength.map(c => `Points: ${c.points}<br>Name Length: ${c.name.replace(/\s/g, '').length}`),
        hoverinfo: 'text+y'
    };

    const layoutPointsPerNameLength = {
        title: {
            text: 'Top 50 Cyclists by Points per Name Length',
            font: {
                family: 'VT323, monospace',
                size: 24,
                color: '#ff1493'
            }
        },
        xaxis: {
            title: '',
            tickangle: -45,
            titlefont: {
                family: 'VT323, monospace',
                size: 16,
                color: '#ff1493'
            },
            tickfont: {
                family: 'VT323, monospace',
                size: 14,
                color: '#ff1493'
            }
        },
        yaxis: {
            title: 'Points per Name Length',
            titlefont: {
                family: 'VT323, monospace',
                size: 16,
                color: '#ff1493'
            },
            tickfont: {
                family: 'VT323, monospace',
                size: 14,
                color: '#ff1493'
            }
        },
        legend: {
            font: {
                family: 'VT323, monospace',
                size: 14,
                color: '#000000'
            }
        },
        paper_bgcolor: '#fff0f5',
        plot_bgcolor: '#fff0f5',
        height: 500,
        margin: {
            l: 50,
            r: 50,
            b: 100,
            t: 50,
            pad: 4
        }
    };

    Plotly.newPlot('pointsPerNameLengthChart', [tracePointsPerNameLength], layoutPointsPerNameLength);
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
                size: 24,
                color: '#ff1493'
            }
        },
        barmode: 'stack',
        xaxis: {
            title: '',
            tickangle: -45,
            titlefont: {
                family: 'VT323, monospace',
                size: 16,
                color: '#ff1493'
            },
            tickfont: {
                family: 'VT323, monospace',
                size: 14,
                color: '#ff1493'
            }
        },
        yaxis: {
            title: '',
            titlefont: {
                family: 'VT323, monospace',
                size: 16,
                color: '#ff1493'
            },
            tickfont: {
                family: 'VT323, monospace',
                size: 14,
                color: '#ff1493'
            }
        },
        legend: {
            font: {
                family: 'VT323, monospace',
                size: 14,
                color: '#000000'
            }
        },
        paper_bgcolor: '#fff0f5',
        plot_bgcolor: '#fff0f5',
        height: 500,
        margin: {
            l: 50,
            r: 50,
            b: 100,
            t: 50,
            pad: 4
        }
    };

    Plotly.newPlot('leagueScoresChart', [leagueTrace1, leagueTrace2, leagueTrace3], leagueLayout);
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
                size: 24,
                color: '#ff1493'
            }
        },
        xaxis: {
            title: 'Points',
            tickangle: -45,
            titlefont: {
                family: 'VT323, monospace',
                size: 16,
                color: '#ff1493'
            },
            tickfont: {
                family: 'VT323, monospace',
                size: 14,
                color: '#ff1493'
            }
        },
        yaxis: {
            title: 'Cost',
            titlefont: {
                family: 'VT323, monospace',
                size: 16,
                color: '#ff1493'
            },
            tickfont: {
                family: 'VT323, monospace',
                size: 14,
                color: '#ff1493'
            }
        },
        legend: {
            font: {
                family: 'VT323, monospace',
                size: 14,
                color: '#000000'
            }
        },
        paper_bgcolor: '#fff0f5',
        plot_bgcolor: '#fff0f5',
        height: 500,
        margin: {
            l: 50,
            r: 50,
            b: 100,
            t: 50,
            pad: 4
        }
    };

    Plotly.newPlot('costVsPointsChart', [costVsPointsTrace], costVsPointsLayout);
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
                backgroundColor: Object.keys(roleData).map(role => roleColors[role] || roleColors['Other']),
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
        const traces = cyclists.map(cyclist => ({
            x: cyclist.pointHistory.map(h => h.date.split('T')[0]),
            y: cyclist.pointHistory.map(h => h.points),
            type: 'scatter',
            mode: 'lines+markers',
            name: cyclist.name
        }));

        const layout = {
            title: {
                text: 'Rider Point Trajectories',
                font: {
                    family: 'VT323, monospace',
                    size: 24,
                    color: '#ff1493'
                }
            },
            xaxis: {
                title: 'Date',
                titlefont: {
                    family: 'VT323, monospace',
                    size: 16,
                    color: '#ff1493'
                }
            },
            yaxis: {
                title: 'Points',
                titlefont: {
                    family: 'VT323, monospace',
                    size: 16,
                    color: '#ff1493'
                }
            },
            legend: {
                font: {
                    family: 'VT323, monospace',
                    size: 14,
                    color: '#000000'
                }
            },
            paper_bgcolor: '#fff0f5',
            plot_bgcolor: '#fff0f5',
            margin: {
                t: 50,
                r: 50,
                b: 50,
                l: 50
            }
        };

        Plotly.newPlot('trajectoryChart', traces, layout);
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

    // Render the trajectory chart when its tab is opened
        if (tabName === 'RiderTrajectoryTab') {
            updateTrajectoryChart(); // Use updateTrajectoryChart instead of createTrajectoryChart
        }
}

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

function updateVisitCount() {
    fetch('https://api.countapi.xyz/update/mhke0.github.io/visits/?amount=1')
    .then(response => response.json())
    .then(data => {
        document.getElementById('visit-count').innerText = data.value;
    })
    .catch(error => console.error('Error updating visit count:', error));
}

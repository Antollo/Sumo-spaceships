window.onload = function () {
    google.charts.load('current', { 'packages': ['bar'] });
    google.charts.setOnLoadCallback(function () {
        drawChart("type");
        drawChart("text");
    });
    function drawChart(type) {
        var data = new google.visualization.DataTable();
        data.addColumn('string', 'Tytuł');
        data.addColumn('number', 'Głosy');
        var L = {};
        for (var i = 0; i < H.length; i++) {
            for (var j = 0; j < H[i].likes.length; j++) {
                if (L[H[i].likes[j][type]] === undefined) L[H[i].likes[j][type]] = 0;
                L[H[i].likes[j][type]]++;
            }
        }
        var A = [];
        Object.keys(L).forEach(function (key) {
            if (L[key] > 5) A.push({ name: key, value: L[key] });
        });
        A.sort(function (a, b) {
            if (a.value > b.value)
                return -1;
            if (a.value < b.value)
                return 1;
            return 0;
        })
        for (var i = 0; i < A.length; i++) {
            data.addRow([A[i].name, A[i].value]);
        }
        document.getElementById(type + '-div').style.height = (A.length * 32).toString() + 'px'; 
        var options = {
            chart: {},
            bars: 'horizontal',
            legend: { position: 'none' },
            colors: ['rgb(66,66,66)']
        };
        var chart = new google.charts.Bar(document.getElementById(type + '-div'));
        chart.draw(data, google.charts.Bar.convertOptions(options));
    }
};
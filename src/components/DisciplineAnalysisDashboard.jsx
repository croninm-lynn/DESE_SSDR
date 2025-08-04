import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';

function DisciplineAnalysisDashboard() {
  const [data, setData] = useState(null);
  const [selectedView, setSelectedView] = useState('overview');

  useEffect(() => {
    async function loadData() {
      try {
        const fileContent = await window.fs.readFile('Updated_DESEMA_Discipline_Calculations.csv', { encoding: 'utf8' });
        const parsed = Papa.parse(fileContent, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        });
        setData(parsed.data);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    }
    loadData();
  }, []);

  if (!data) return <div className="p-8 text-center">Loading data...</div>;

  // Process data for visualizations
  const latestYearData = data.filter(d => d.Year === "2023-24")
    .map(d => ({
      group: d['Student Group'],
      percent: d[' Percent of Students Disciplined']
    }))
    .sort((a, b) => b.percent - a.percent);

  const trendData = {};
  const yearOrder = ["2021-22", "2022-23", "2023-24"];
  
  data.forEach(row => {
    const group = row['Student Group'];
    if (!trendData[group]) trendData[group] = [];
    trendData[group].push({
      year: row.Year,
      percent: row[' Percent of Students Disciplined']
    });
  });

  // Format trend data for selected groups
  const selectedGroups = ["All Students", "Afr. Amer./Black", "Hispanic/Latino", "White", "Asian", "Students w/disabilities"];
  const formattedTrendData = yearOrder.map(year => {
    const yearData = { year: year.replace("-", "-\n") };
    selectedGroups.forEach(group => {
      const groupData = trendData[group];
      if (groupData) {
        const dataPoint = groupData.find(d => d.year === year);
        if (dataPoint) {
          yearData[group] = dataPoint.percent;
        }
      }
    });
    return yearData;
  });

  // Calculate disparities
  const allStudentsBaseline = latestYearData.find(d => d.group === "All Students")?.percent || 0;
  const disparityData = latestYearData
    .filter(d => d.group !== "All Students")
    .map(d => ({
      group: d.group,
      percent: d.percent,
      disparity: d.percent - allStudentsBaseline
    }))
    .sort((a, b) => b.disparity - a.disparity);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-2">Student Discipline Data Analysis</h1>
      <p className="text-gray-600 mb-6">Analysis of discipline percentages across student groups and years</p>
      
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setSelectedView('overview')}
          className={`px-4 py-2 rounded ${selectedView === 'overview' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setSelectedView('trends')}
          className={`px-4 py-2 rounded ${selectedView === 'trends' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border'}`}
        >
          Trends Over Time
        </button>
        <button
          onClick={() => setSelectedView('disparities')}
          className={`px-4 py-2 rounded ${selectedView === 'disparities' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border'}`}
        >
          Disparities
        </button>
      </div>

      {selectedView === 'overview' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">2023-24 Discipline Rates by Student Group</h2>
          <ResponsiveContainer width="100%" height={500}>
            <BarChart data={latestYearData} margin={{ top: 20, right: 30, left: 50, bottom: 100 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="group" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                label={{ value: 'Percent Disciplined', angle: -90, position: 'insideLeft' }}
                domain={[0, 'dataMax + 1']}
              />
              <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
              <Bar 
                dataKey="percent" 
                fill="#3B82F6"
                label={{ position: 'top', fontSize: 10, formatter: (value) => `${value.toFixed(1)}%` }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {selectedView === 'trends' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Discipline Rate Trends (2021-22 to 2023-24)</h2>
          <ResponsiveContainer width="100%" height={500}>
            <LineChart data={formattedTrendData} margin={{ top: 20, right: 30, left: 50, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis 
                label={{ value: 'Percent Disciplined', angle: -90, position: 'insideLeft' }}
                domain={[0, 8]}
              />
              <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
              <Legend />
              <Line type="monotone" dataKey="All Students" stroke="#3B82F6" strokeWidth={3} />
              <Line type="monotone" dataKey="Afr. Amer./Black" stroke="#DC2626" strokeWidth={2} />
              <Line type="monotone" dataKey="Hispanic/Latino" stroke="#F59E0B" strokeWidth={2} />
              <Line type="monotone" dataKey="Students w/disabilities" stroke="#8B5CF6" strokeWidth={2} />
              <Line type="monotone" dataKey="White" stroke="#10B981" strokeWidth={2} />
              <Line type="monotone" dataKey="Asian" stroke="#6366F1" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Key Finding:</strong> All groups show declining discipline rates from 2021-22 to 2023-24, 
            but significant disparities persist.</p>
          </div>
        </div>
      )}

      {selectedView === 'disparities' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Disparities from All Students Average (2023-24)</h2>
          <p className="text-sm text-gray-600 mb-4">All Students baseline: {allStudentsBaseline.toFixed(2)}%</p>
          <ResponsiveContainer width="100%" height={500}>
            <BarChart data={disparityData} margin={{ top: 20, right: 30, left: 50, bottom: 100 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="group" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                label={{ value: 'Percentage Point Difference', angle: -90, position: 'insideLeft' }}
                domain={[-3, 3]}
              />
              <Tooltip formatter={(value) => `${value > 0 ? '+' : ''}${value.toFixed(2)} pp`} />
              <Bar 
                dataKey="disparity" 
                fill={(entry) => entry.disparity > 0 ? '#DC2626' : '#10B981'}
                label={{ position: 'top', fontSize: 10, formatter: (value) => `${value > 0 ? '+' : ''}${value.toFixed(1)}` }}
              />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Groups with highest disparities:</strong></p>
            <ul className="list-disc ml-6 mt-2">
              <li>Students w/disabilities: +2.74 percentage points</li>
              <li>African American/Black students: +2.69 percentage points</li>
              <li>Low Income students: +2.19 percentage points</li>
            </ul>
          </div>
        </div>
      )}

      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Summary of Key Findings</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">Overall Trends</h3>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Discipline rates decreased across all student groups from 2021-22 to 2023-24</li>
              <li>Overall rate for all students dropped from 4.20% to 3.45% (-0.76 percentage points)</li>
              <li>The largest improvements were seen in African American/Black students (-1.51 pp) and Students with disabilities (-1.38 pp)</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg">Persistent Disparities</h3>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Despite improvements, significant disparities remain in 2023-24</li>
              <li>Students with disabilities are disciplined at nearly twice the rate of all students (6.19% vs 3.45%)</li>
              <li>African American/Black students face discipline at 1.8x the overall rate</li>
              <li>Asian students have the lowest discipline rate at 0.85%, well below the average</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg">Gender Differences</h3>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Male students are disciplined at higher rates than female students (4.44% vs 2.43% in 2023-24)</li>
              <li>This represents a nearly 2:1 ratio in discipline rates by gender</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DisciplineAnalysisDashboard;

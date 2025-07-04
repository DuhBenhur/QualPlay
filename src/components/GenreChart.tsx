import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { MovieDetails } from '../types/movie';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface GenreChartProps {
  movies: MovieDetails[];
}

const GenreChart: React.FC<GenreChartProps> = ({ movies }) => {
  const genreCount = movies.reduce((acc, movie) => {
    const genres = movie.genres || [];
    if (genres.length === 0) {
      acc['Gênero não informado'] = (acc['Gênero não informado'] || 0) + 1;
    } else {
      genres.forEach(genre => {
        acc[genre.name] = (acc[genre.name] || 0) + 1;
      });
    }
    return acc;
  }, {} as Record<string, number>);

  const sortedGenres = Object.entries(genreCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);

  const data = {
    labels: sortedGenres.map(([genre]) => genre),
    datasets: [
      {
        label: 'Número de Filmes',
        data: sortedGenres.map(([, count]) => count),
        backgroundColor: [
          '#3B82F6',
          '#EF4444',
          '#10B981',
          '#F59E0B',
          '#8B5CF6',
          '#06B6D4',
          '#F97316',
          '#84CC16',
          '#EC4899',
          '#6366F1',
        ],
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Distribuição de Filmes por Gênero',
        color: 'white',
        font: {
          size: 18,
          weight: 'bold',
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: 'white',
          stepSize: 1,
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      x: {
        ticks: {
          color: 'white',
          maxRotation: 45,
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
  };

  if (movies.length <= 1) {
    return null;
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6 mb-6">
      <Bar data={data} options={options} />
    </div>
  );
};

export default GenreChart;
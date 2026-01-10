import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { Box, Typography, Card, CardContent, useTheme } from '@mui/material';
import { format } from 'date-fns';

interface RevenueTrendChartProps {
  data: Array<{
    date: string;
    revenue: number;
  }>;
}

const RevenueTrendChart: React.FC<RevenueTrendChartProps> = ({ data }) => {
  const theme = useTheme();

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Revenue Trends (Last 30 Days)
          </Typography>
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No revenue data available
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Format data for chart
  const chartData = data.map((item) => ({
    date: format(new Date(item.date), 'MMM dd'),
    fullDate: item.date,
    revenue: Number(item.revenue.toFixed(2)),
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            backgroundColor: 'background.paper',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            p: 1.5,
            boxShadow: theme.shadows[3],
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            {payload[0].payload.fullDate
              ? format(new Date(payload[0].payload.fullDate), 'MMM dd, yyyy')
              : ''}
          </Typography>
          <Typography variant="body2" color="primary">
            Revenue: {new Intl.NumberFormat('en-ZA', {
              style: 'currency',
              currency: 'ZAR',
            }).format(payload[0].value)}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Revenue Trends (Last 30 Days)
        </Typography>
        <Box sx={{ width: '100%', height: 400, mt: 2 }}>
          <ResponsiveContainer>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={theme.palette.primary.main}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={theme.palette.primary.main}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) =>
                  new Intl.NumberFormat('en-ZA', {
                    style: 'currency',
                    currency: 'ZAR',
                    notation: 'compact',
                  }).format(value)
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={theme.palette.primary.main}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="Revenue"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RevenueTrendChart;


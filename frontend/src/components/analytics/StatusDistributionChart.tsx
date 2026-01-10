import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Box, Typography, Card, CardContent, useTheme } from '@mui/material';

interface StatusDistributionChartProps {
  data: Record<string, number>;
}

const StatusDistributionChart: React.FC<StatusDistributionChartProps> = ({
  data,
}) => {
  const theme = useTheme();

  // Convert object to array and filter out zero values
  const chartData = Object.entries(data)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({
      name,
      value,
    }));

  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Order Status Distribution
          </Typography>
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No order status data available
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Calculate total for percentages
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  // Map status names to meaningful colors
  const getStatusColor = (statusName: string): string => {
    const status = statusName.toLowerCase();
    
    // Completed orders - use primary color (same for both)
    if (status === 'delivered' || status === 'pickedup') {
      return theme.palette.primary.main;
    }
    
    // Refunded - use error color (red)
    if (status === 'refunded') {
      return theme.palette.error.main;
    }
    
    // Cancelled - use grey/error
    if (status === 'cancelled') {
      return theme.palette.error.dark || '#d32f2f';
    }
    
    // Ready for pickup - use success color (green)
    if (status === 'ready') {
      return theme.palette.success.main;
    }
    
    // Processing - use warning color (yellow/orange)
    if (status === 'processing') {
      return theme.palette.warning.main;
    }
    
    // Shipped - use info color (blue)
    if (status === 'shipped') {
      return theme.palette.info.main;
    }
    
    // Confirmed/Pending - use secondary or info color
    if (status === 'confirmed' || status === 'pending') {
      return theme.palette.secondary.main || theme.palette.info.main;
    }
    
    // Default fallback
    return theme.palette.grey[500] || '#9e9e9e';
  };

  // Generate colors for each status
  const finalColors = chartData.map((item) => getStatusColor(item.name));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / total) * 100).toFixed(1);
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
            {data.name}
          </Typography>
          <Typography variant="body2" color="primary">
            Count: {data.value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Percentage: {percentage}%
          </Typography>
        </Box>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show label if slice is too small

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Order Status Distribution
        </Typography>
        <Box sx={{ width: '100%', height: 400, mt: 2 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={finalColors[index % finalColors.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry: any) => (
                  <span style={{ color: entry.color }}>
                    {value}: {entry.payload.value} ({((entry.payload.value / total) * 100).toFixed(1)}%)
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatusDistributionChart;

